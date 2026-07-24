// 后台 Service Worker：消息路由、来源图片抓取、反推与生图调用、侧边栏/相册打开

import { apiBaseUrlError, loadSettings, providerLabel, resolveModelConfig } from './lib/settings.js';
import {
  normalizeImageBlob,
  blobFromDataUrl,
  reversePromptFromImage,
  generateImageFromPrompt,
  generateAtlasCloudImage,
  generateAtlasCloudImageEdit,
  generateRunningHubImage,
  generateRunningHubWorkflowImage,
  generateAgnesImageEdit,
  generateZenMuxImageEdit,
  generateImageEdit,
  runningHubNeedsSource,
  listModels,
  testConnection
} from './lib/api.js';
import { hasPrivacyConsent } from './lib/privacy.js';
import { addRecordWithSource } from './lib/db.js';
import { normalizedWindowId, scopedSessionKey } from './lib/task-state.js';
import { resolveLanguage, t } from './lib/i18n.js';

const MENU_IMAGE = 'ir-image';
const MENU_ALBUM = 'ir-album';
const activeSourceRequestIds = new Map();
const runningJobs = new Map();

function errText(e) {
  return (e && (e.message || String(e))) || '未知错误';
}

function messageWindowId(payload, sender) {
  return normalizedWindowId(payload?.windowId) ?? normalizedWindowId(sender?.tab?.windowId);
}

async function getWindowSession(kind, windowId) {
  const key = scopedSessionKey(kind, windowId);
  if (!key) return null;
  const values = await chrome.storage.session.get(key);
  return values[key] || null;
}

async function setWindowSession(kind, windowId, value) {
  const key = scopedSessionKey(kind, windowId);
  if (!key) throw new Error('无法确定当前浏览器窗口');
  await chrome.storage.session.set({ [key]: value });
}

async function removeWindowSession(kind, windowId) {
  const key = scopedSessionKey(kind, windowId);
  if (key) await chrome.storage.session.remove(key);
}

// ---------- 安装与菜单 ----------

chrome.runtime.onInstalled.addListener(() => {
  void refreshContextMenus();
  setupActionBehavior();
  restrictStorageAccess();
  void refreshActiveContentScripts();
});

chrome.runtime.onStartup?.addListener(setupActionBehavior);
setupActionBehavior(); // SW 被唤醒时也确保行为生效
restrictStorageAccess();

async function refreshContextMenus() {
  const settings = await loadSettings().catch(() => ({ language: 'auto' }));
  const language = resolveLanguage(settings.language, [chrome.i18n?.getUILanguage?.() || navigator.language]);
  await chrome.contextMenus.removeAll().catch(() => {});
  chrome.contextMenus.create({ id: MENU_IMAGE, title: t('✨ 反推提示词并生成同款', {}, language), contexts: ['image'] });
  chrome.contextMenus.create({ id: MENU_ALBUM, title: t('🖼 打开拍同款相册', {}, language), contexts: ['image', 'page'] });
}

chrome.storage.local.onChanged.addListener((changes) => {
  if (changes.settings?.newValue?.language !== changes.settings?.oldValue?.language) {
    void refreshContextMenus();
    void broadcastLanguage();
  }
});

async function broadcastLanguage() {
  const settings = await loadSettings();
  const language = resolveLanguage(settings.language, [chrome.i18n?.getUILanguage?.() || navigator.language]);
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map((tab) => tab.id == null
    ? null
    : chrome.tabs.sendMessage(tab.id, { type: 'ir.languageChanged', language }).catch(() => null)));
}

chrome.windows?.onRemoved?.addListener((windowId) => {
  activeSourceRequestIds.delete(windowId);
  const keys = ['pendingSource', 'panelTask', 'albumAction', 'captureFeedback', 'job', 'reverseJob']
    .map((kind) => scopedSessionKey(kind, windowId))
    .filter(Boolean);
  if (keys.length) void chrome.storage.session.remove(keys).catch(() => {});
});

function setupActionBehavior() {
  try {
    chrome.sidePanel
      ?.setPanelBehavior({ openPanelOnActionClick: true })
      ?.catch(() => {});
  } catch { /* 忽略不支持的环境 */ }
}

function restrictStorageAccess() {
  // API Key 只应由设置页、面板和 Service Worker 读取，内容脚本不需要访问。
  chrome.storage.local
    ?.setAccessLevel?.({ accessLevel: 'TRUSTED_CONTEXTS' })
    ?.catch(() => {});
}

async function refreshActiveContentScripts() {
  const tabs = await chrome.tabs.query({ active: true });
  await Promise.all(tabs
    .filter((tab) => tab.id != null && /^https?:\/\//i.test(tab.url || ''))
    .map((tab) => chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content/content.js']
    }).catch(() => null)));
}

function openAlbum(recordId = '') {
  const query = recordId ? `?open=${encodeURIComponent(recordId)}` : '';
  chrome.tabs.create({ url: chrome.runtime.getURL(`album/album.html${query}`) });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_ALBUM) {
    openAlbum();
    return;
  }
  if (info.menuItemId === MENU_IMAGE && info.srcUrl) {
    const panelOpenPromise = openSidePanelNow(tab?.windowId);
    void handleSource({
      src: info.srcUrl,
      pageUrl: info.pageUrl || '',
      pageTitle: tab?.title || '',
      captureTabId: tab?.id
    }, tab?.windowId, panelOpenPromise);
  }
});

// ---------- 消息路由 ----------

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // sidePanel.open 必须直接发生在用户点击触发的消息监听栈中，不能放在任何 await 后。
  if (msg?.type === 'ir.openPanel') {
    const windowId = sender.tab?.windowId;
    const panelOpenPromise = openSidePanelNow(windowId);
    void handleSource({ ...msg.payload, captureTabId: sender.tab?.id }, windowId, panelOpenPromise)
      .then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ ok: false, error: errText(e) }));
    return true;
  }
  (async () => {
    const windowId = messageWindowId(msg?.payload, sender);
    switch (msg?.type) {
      case 'ir.getPending':
        return { ok: true, source: await getPending(windowId) };
      case 'ir.reverse':
        return await doReverse({ ...msg.payload, windowId });
      case 'ir.job.reverse':
        return await runWindowJob(
          'reverse',
          windowId,
          (update) => reverseAndPersist({ ...msg.payload, windowId }, update),
          {
            sourceKey: msg.payload?.sourceRequestId || msg.payload?.sourceTs || null,
            label: 'reverse',
            stage: '正在反推提示词'
          },
          { sessionKind: 'reverseJob', allowSupersede: true }
        );
      case 'ir.generate':
        return await doGenerate({ ...msg.payload, windowId });
      case 'ir.edit':
        return await doEdit(msg.payload);
      case 'ir.job.generate':
        return await runWindowJob(
          'generate',
          windowId,
          (update, control) => generateAndSave({ ...msg.payload, windowId }, update, control),
          { sourceKey: msg.payload?.sourceSnapshot?.requestId || msg.payload?.sourceSnapshot?.ts || null, label: 'generate' }
        );
      case 'ir.job.edit':
        return await runWindowJob(
          'edit',
          windowId,
          (update, control) => editAndSave({ ...msg.payload, windowId }, update, control),
          {
            sourceKey: msg.payload?.sourceSnapshot?.requestId || msg.payload?.sourceSnapshot?.ts || null,
            label: msg.payload?.albumMeta?.kind === 'replacement' ? 'replacement' : 'generate'
          }
        );
      case 'ir.job.group':
        return await runWindowJob(
          'group',
          windowId,
          (update, control) => generateGroupAndSave({ ...msg.payload, windowId }, update, control),
          { sourceKey: msg.payload?.sourceSnapshot?.requestId || msg.payload?.sourceSnapshot?.ts || null, label: 'group' }
        );
      case 'ir.job.cancel':
        return await cancelWindowJob(windowId);
      case 'ir.getJob':
        return { ok: true, job: await getWindowSession('job', windowId) };
      case 'ir.getReverseJob':
        return { ok: true, job: await getWindowSession('reverseJob', windowId) };
      case 'ir.startRegionCapture':
        return await startRegionCapture(windowId);
      case 'ir.captureRegion':
        try {
          return await captureSelectedRegion(msg.payload, sender.tab);
        } catch (error) {
          await recordCaptureFailure(error, sender.tab?.windowId);
          throw error;
        }
      case 'ir.submitRegionCapture':
        try {
          return await submitSelectedRegion(msg.payload, sender.tab);
        } catch (error) {
          await recordCaptureFailure(error, sender.tab?.windowId);
          throw error;
        }
      case 'ir.setMagicButtonVisible':
        return await setMagicButtonVisible(Boolean(msg.payload?.visible));
      case 'ir.getUiPrefs': {
        const { uiPrefs = {} } = await chrome.storage.local.get('uiPrefs');
        const settings = await loadSettings();
        const language = resolveLanguage(settings.language, [chrome.i18n?.getUILanguage?.() || navigator.language]);
        return { ok: true, visible: uiPrefs.magicButtonVisible !== false, language };
      }
      case 'ir.openAlbum':
        openAlbum(msg.payload?.recordId || '');
        return { ok: true };
      case 'ir.openOptions':
        await chrome.runtime.openOptionsPage();
        return { ok: true };
      case 'ir.test':
        return { ok: true, result: await testConnection(msg.payload.cfg) };
      case 'ir.listModels':
        return { ok: true, models: await listModels(msg.payload.cfg) };
      default:
        return { ok: false, error: '未知消息类型' };
    }
  })()
    .then((r) => sendResponse(r ?? { ok: true }))
    .catch((e) => sendResponse({ ok: false, error: errText(e) }));
  return true; // 异步响应
});

// ---------- 来源图片处理 ----------

async function getPending(windowId) {
  return getWindowSession('pendingSource', windowId);
}

async function recordCaptureFailure(error, windowId) {
  await setWindowSession('captureFeedback', windowId, {
    ok: false,
    error: errText(error),
    ts: Date.now()
  }).catch(() => {});
}

function openSidePanelNow(windowId) {
  if (windowId == null || !chrome.sidePanel) return Promise.reject(new Error('当前浏览器不支持侧边栏'));
  try {
    return chrome.sidePanel.open({ windowId });
  } catch (error) {
    return Promise.reject(error);
  }
}

async function handleSource(payload, windowId, panelOpenPromise = null) {
  if (!payload?.src) return;
  windowId = normalizedWindowId(windowId);
  if (windowId == null) throw new Error('无法确定来源图片所在窗口');

  const requestId = crypto.randomUUID();
  activeSourceRequestIds.set(windowId, requestId);

  // 先打开侧边栏（保持用户手势链），失败则退化为弹出窗口。
  // 从侧边栏主动截屏时面板已经打开，避免再次打开造成重复窗口。
  if (!payload.skipOpen) {
    try {
      await (panelOpenPromise || openSidePanelNow(windowId));
    } catch {
      try {
        await chrome.windows.create({
          url: chrome.runtime.getURL(`panel/panel.html?windowId=${windowId}`),
          type: 'popup',
          width: 440,
          height: 740
        });
      } catch { /* 忽略 */ }
    }
  }

  if (activeSourceRequestIds.get(windowId) !== requestId) return;

  const pending = {
    requestId,
    sourceAssetId: `source:${requestId}`,
    src: payload.src,
    previewUrl: payload.previewUrl || payload.dataUrl || payload.src,
    pageUrl: payload.pageUrl || '',
    pageTitle: payload.pageTitle || '',
    ts: Date.now(),
    status: 'loading',
    needsReverse: true
  };
  await Promise.all([
    setWindowSession('pendingSource', windowId, pending),
    removeWindowSession('panelTask', windowId)
  ]);
  if (activeSourceRequestIds.get(windowId) !== requestId) return;

  try {
    if (payload.alreadyNormalized && payload.dataUrl) {
      const { previewUrl: _previewUrl, ...settledSource } = pending;
      await Promise.all([
        setWindowSession('pendingSource', windowId, {
          ...settledSource,
          status: 'ready',
          dataUrl: payload.dataUrl,
          width: payload.sourceWidth,
          height: payload.sourceHeight,
          mime: payload.mime || 'image/png'
        }),
        setWindowSession('captureFeedback', windowId, {
          ok: true,
          width: payload.sourceWidth,
          height: payload.sourceHeight,
          ts: Date.now()
        })
      ]);
      return;
    }
    let blob;
    if (!payload.dataUrl && payload.captureTabId != null) {
      const captured = await chrome.tabs.sendMessage(payload.captureTabId, {
        type: 'ir.captureImage',
        src: payload.src
      }).catch(() => null);
      if (captured?.ok && captured.dataUrl) {
        payload.dataUrl = captured.dataUrl;
        payload.sourceWidth = captured.width;
        payload.sourceHeight = captured.height;
      }
    }
    if (payload.dataUrl) {
      // blob: 图片由内容脚本在页面内捕获后以 dataURL 传来
      blob = await blobFromDataUrl(payload.dataUrl);
    } else {
      const resp = await fetch(payload.src, { credentials: 'include' });
      if (!resp.ok) throw new Error('抓取图片失败 HTTP ' + resp.status);
      blob = await resp.blob();
    }
    if (!/^image\//.test(blob.type)) {
      throw new Error('目标不是图片（' + (blob.type || '未知类型') + '），可能被站点防盗链保护');
    }
    const norm = await normalizeImageBlob(blob, 2048);
    if (activeSourceRequestIds.get(windowId) !== requestId) return;
    const { previewUrl: _previewUrl, ...settledSource } = pending;
    await setWindowSession('pendingSource', windowId, {
      ...settledSource,
      status: 'ready',
      dataUrl: norm.dataUrl,
      width: payload.sourceWidth || norm.width,
      height: payload.sourceHeight || norm.height,
      mime: norm.mime
    });
  } catch (e) {
    if (activeSourceRequestIds.get(windowId) !== requestId) return;
    const { previewUrl: _previewUrl, ...settledSource } = pending;
    await setWindowSession('pendingSource', windowId, {
      ...settledSource,
      status: 'error',
      error: errText(e)
    });
  }
}

async function startRegionCapture(windowId) {
  const query = windowId == null ? { active: true, currentWindow: true } : { active: true, windowId };
  const [tab] = await chrome.tabs.query(query);
  if (!tab?.id || !tab.windowId) throw new Error('未找到当前网页标签');
  if (!/^https?:\/\//i.test(tab.url || '')) {
    throw new Error('当前页面不支持截图，请在普通 HTTP/HTTPS 网页中使用');
  }
  const message = { type: 'ir.startRegionCapture' };
  const response = await sendToContentWithInjection(tab, message);
  if (!response?.ok) throw new Error(response?.error || '无法进入框选模式');
  return { ok: true };
}

async function sendToContentWithInjection(tab, message) {
  try {
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch (error) {
    const missingReceiver = /Receiving end does not exist|Could not establish connection/i.test(errText(error));
    if (!missingReceiver) throw error;
    if (!/^https?:\/\//i.test(tab.url || '')) throw error;
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content.js']
      });
    } catch (injectError) {
      throw new Error('当前页面不允许加载网页按钮：' + errText(injectError));
    }
    return await chrome.tabs.sendMessage(tab.id, message);
  }
}

async function captureSelectedRegion(payload, tab) {
  if (!tab?.windowId) throw new Error('未找到需要截图的网页');
  const rect = payload?.rect;
  const viewportWidth = Number(payload?.viewportWidth);
  const viewportHeight = Number(payload?.viewportHeight);
  if (!rect || !viewportWidth || !viewportHeight || rect.width < 10 || rect.height < 10) {
    throw new Error('截图区域无效，请重新框选');
  }

  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
  return { ok: true, dataUrl };
}

async function submitSelectedRegion(payload, tab) {
  if (!tab?.windowId) throw new Error('未找到需要截图的网页');
  if (!/^data:image\/(png|jpeg|webp);base64,/i.test(payload?.dataUrl || '')) {
    throw new Error('裁切后的截图数据无效');
  }
  const width = Math.round(Number(payload?.width));
  const height = Math.round(Number(payload?.height));
  if (!width || !height) throw new Error('裁切后的截图尺寸无效');
  await handleSource({
    src: payload.dataUrl,
    dataUrl: payload.dataUrl,
    previewUrl: payload.dataUrl,
    sourceWidth: width,
    sourceHeight: height,
    mime: payload.mime || 'image/png',
    alreadyNormalized: true,
    pageUrl: tab.url || '',
    pageTitle: `${tab.title || '当前页面'}（区域截图）`,
    skipOpen: true
  }, tab.windowId);
  return { ok: true, width, height };
}

async function setMagicButtonVisible(visible) {
  await chrome.storage.local.set({ uiPrefs: { magicButtonVisible: visible } });
  const tabs = await chrome.tabs.query({});
  const message = { type: 'ir.magicVisibility', visible };
  const activeTabs = tabs.filter((tab) => tab.active && tab.id != null && /^https?:\/\//i.test(tab.url || ''));
  const passiveTabs = tabs.filter((tab) => !activeTabs.includes(tab) && tab.id != null);
  let delivered = 0;
  for (const tab of activeTabs) {
    try {
      const response = visible
        ? await sendToContentWithInjection(tab, message)
        : await chrome.tabs.sendMessage(tab.id, message);
      if (response?.ok) delivered += 1;
    } catch { /* 当前页面不可注入时保留全局偏好，页面重新加载后会读取 */ }
  }
  await Promise.all(passiveTabs.map((tab) => chrome.tabs.sendMessage(tab.id, message).catch(() => null)));
  return { ok: true, visible, delivered };
}

// ---------- 反推 ----------

async function doReverse({ sourceRequestId, sourceTs, selection, windowId } = {}) {
  if (!await hasPrivacyConsent()) {
    return { ok: false, error: '请先阅读并同意隐私说明' };
  }
  const source = await getPending(windowId);
  if (!source || source.status !== 'ready') {
    return { ok: false, error: '没有可用的来源图片' };
  }
  if ((sourceRequestId && source.requestId !== sourceRequestId) ||
      (sourceTs != null && source.ts !== sourceTs)) {
    return { ok: false, stale: true, error: '来源图片已切换' };
  }
  const s = await loadSettings();
  const language = resolveLanguage(s.language, [chrome.i18n?.getUILanguage?.() || navigator.language]);
  const cfg = resolveModelConfig(s, 'vision', selection);
  const baseUrlError = apiBaseUrlError(cfg.baseUrl);
  if (baseUrlError) return { ok: false, error: baseUrlError };
  if (!cfg.apiKey) {
    return { ok: false, error: '尚未配置反推模型 API Key，请前往设置页填写' };
  }
  if (!cfg.baseUrl || !cfg.model) {
    return { ok: false, error: '反推模型的 Base URL / 模型名未配置完整' };
  }
  // 识图请求使用较小副本控制消息体；相同来源的 2048px 副本仍保留给图生图。
  const visionBlob = await blobFromDataUrl(source.dataUrl);
  const visionInput = await normalizeImageBlob(visionBlob, 1024);
  const r = await reversePromptFromImage({ cfg, dataUrl: visionInput.dataUrl, language });
  const current = await getPending(windowId);
  if (!current ||
      (source.requestId && current.requestId !== source.requestId) ||
      current.ts !== source.ts) {
    return { ok: false, stale: true, error: '来源图片已切换' };
  }
  return {
    ok: true,
    sourceRequestId: source.requestId,
    sourceTs: source.ts,
    provider: providerLabel(cfg),
    model: cfg.model,
    ...r
  };
}

// ---------- 生成 ----------

async function doGenerate({ prompt, ratio, selection, sourceRequestId, sourceTs, sourceDataUrl = '', windowId }) {
  if (!await hasPrivacyConsent()) {
    return { ok: false, error: '请先阅读并同意隐私说明' };
  }
  if (!prompt || !prompt.trim()) {
    return { ok: false, error: '提示词为空' };
  }
  const s = await loadSettings();
  const cfg = resolveModelConfig(s, 'image', selection);
  const baseUrlError = apiBaseUrlError(cfg.baseUrl);
  if (baseUrlError) return { ok: false, error: baseUrlError };
  if (!cfg.apiKey) {
    return { ok: false, error: '尚未配置生图模型 API Key，请前往设置页填写' };
  }
  if (!cfg.baseUrl || !cfg.model) {
    return { ok: false, error: '生图模型的 Base URL / 模型名未配置完整' };
  }
  const size = s.sizeMap?.[ratio] || s.sizeMap?.['1:1'] || '1024x1024';
  const quality = s.imageQuality || 'low';
  const resolution = s.imageResolution || '1k';
  let r;
  if (cfg.apiType === 'atlascloud-image-v1') {
    r = await generateAtlasCloudImage({
      cfg,
      prompt: prompt.trim(),
      ratio,
      size,
      quality,
      resolution
    });
  } else if (cfg.apiType === 'runninghub-v2') {
    let resolvedSourceDataUrl = sourceDataUrl;
    if (runningHubNeedsSource(cfg.model)) {
      if (!resolvedSourceDataUrl) {
        const source = await getPending(windowId);
        if (!source || source.status !== 'ready') {
          return { ok: false, error: '该 RunningHUB 模型需要来源图片，请先点击网页图片上的魔法按钮' };
        }
        if ((sourceRequestId && source.requestId !== sourceRequestId) ||
            (sourceTs != null && source.ts !== sourceTs)) {
          return { ok: false, stale: true, error: '来源图片已切换，请重新生成' };
        }
        resolvedSourceDataUrl = source.dataUrl;
      }
    }
    r = await generateRunningHubImage({
      cfg,
      prompt: prompt.trim(),
      ratio,
      sourceDataUrl: resolvedSourceDataUrl,
      resolution
    });
  } else if (cfg.apiType === 'runninghub-workflow-v2') {
    r = await generateRunningHubWorkflowImage({
      cfg,
      prompt: prompt.trim(),
      ratio,
      size
    });
  } else {
    r = await generateImageFromPrompt({ cfg, prompt: prompt.trim(), size, quality });
  }
  return {
    ok: true,
    ...r,
    ratio,
    size,
    provider: providerLabel(cfg),
    model: cfg.model
  };
}

function supportsAtlasCloudEditModel(model) {
  return /^(google\/nano-banana-2-lite\/edit|openai\/gpt-image-2\/edit)$/i.test(String(model || ''));
}

async function doEdit({ prompt, ratio, selection, sourceDataUrl, referenceDataUrl = '' } = {}) {
  if (!await hasPrivacyConsent()) return { ok: false, error: '请先阅读并同意隐私说明' };
  if (!prompt?.trim()) return { ok: false, error: '编辑说明为空' };
  const s = await loadSettings();
  const cfg = resolveModelConfig(s, 'image', selection);
  const error = apiBaseUrlError(cfg.baseUrl);
  if (error) return { ok: false, error };
  if (!cfg.apiKey || !cfg.model) return { ok: false, error: '图生图模型配置不完整' };
  const size = s.sizeMap?.[ratio] || s.sizeMap?.['1:1'] || '1024x1024';
  const quality = s.imageQuality || 'low';
  const resolution = s.imageResolution || '1k';
  let r;
  if (cfg.apiType === 'atlascloud-image-v1') {
    if (!supportsAtlasCloudEditModel(cfg.model)) {
      return { ok: false, error: '请选择 AtlasCloud 的 google/nano-banana-2-lite/edit 或 openai/gpt-image-2/edit 模型' };
    }
    r = await generateAtlasCloudImageEdit({
      cfg,
      prompt: prompt.trim(),
      sourceDataUrl,
      referenceDataUrl,
      size,
      ratio,
      quality,
      resolution
    });
  } else if (cfg.apiType === 'runninghub-v2') {
    if (!runningHubNeedsSource(cfg.model)) {
      return { ok: false, error: '请选择 RunningHUB 的 image-to-image 或 edit 模型' };
    }
    r = await generateRunningHubImage({ cfg, prompt: prompt.trim(), ratio, sourceDataUrl, referenceDataUrl, resolution });
  } else if (cfg.apiType === 'runninghub-workflow-v2') {
    return { ok: false, error: '当前 RunningHUB 工作流不支持角色替换，请选择图生图或 edit 模型' };
  } else if (cfg.preset === 'modelscope') {
    return { ok: false, error: '当前 ModelScope 适配仅支持文生图，请选择支持 /images/edits 的模型' };
  } else if (cfg.preset === 'agnes') {
    r = await generateAgnesImageEdit({
      cfg,
      prompt: prompt.trim(),
      sourceDataUrl,
      referenceDataUrl,
      size,
      ratio
    });
  } else if (cfg.preset === 'zenmux') {
    r = await generateZenMuxImageEdit({
      cfg,
      prompt: prompt.trim(),
      sourceDataUrl,
      referenceDataUrl,
      size,
      quality
    });
  } else {
    r = await generateImageEdit({ cfg, prompt: prompt.trim(), sourceDataUrl, referenceDataUrl, size, quality });
  }
  return { ok: true, ...r, ratio, size, provider: providerLabel(cfg), model: cfg.model };
}

// ---------- 可恢复的后台生成任务 ----------

function sourceAssetIdOf(source, fallback = '') {
  if (source?.sourceAssetId) return String(source.sourceAssetId);
  const identity = source?.requestId || source?.ts || fallback;
  return identity ? `source:${identity}` : '';
}

async function saveGeneratedRecord(resp, {
  prompt,
  source,
  sourcePrompt = '',
  promptZh = '',
  explanationLanguage = '',
  sourceAssetId = '',
  albumMeta = {}
}) {
  const imageResponse = await fetch(resp.dataUrl);
  if (!imageResponse.ok) throw new Error(`生成结果读取失败 HTTP ${imageResponse.status}`);
  const blob = await imageResponse.blob();
  if (!/^image\//i.test(blob.type || '')) throw new Error('生成接口返回的不是有效图片');

  let sourceBlob = null;
  if (source?.dataUrl) {
    const sourceResponse = await fetch(source.dataUrl);
    if (sourceResponse.ok) sourceBlob = await sourceResponse.blob();
  }
  const recordId = crypto.randomUUID();
  await addRecordWithSource({
    id: recordId,
    createdAt: Date.now(),
    prompt,
    sourcePrompt: sourcePrompt || prompt,
    promptZh: promptZh || '',
    explanationLanguage: explanationLanguage || '',
    provider: resp.provider,
    model: resp.model,
    width: resp.width,
    height: resp.height,
    ratio: resp.ratio,
    size: resp.size,
    srcUrl: source?.src || '',
    pageUrl: source?.pageUrl || '',
    blob,
    ...albumMeta
  }, sourceBlob, sourceBlob ? sourceAssetId : '');
  return recordId;
}

async function runWindowJob(type, windowId, executor, initial = {}, {
  sessionKind = 'job',
  allowSupersede = false
} = {}) {
  if (windowId == null) return { ok: false, error: '无法确定当前浏览器窗口' };
  const registryKey = `${sessionKind}:${windowId}`;
  if (runningJobs.has(registryKey) && !allowSupersede) {
    return { ok: false, error: '当前窗口已有后台任务进行中，请等待完成' };
  }
  const jobId = crypto.randomUUID();
  let state = {
    id: jobId,
    type,
    status: 'running',
    startedAt: Date.now(),
    updatedAt: Date.now(),
    completed: 0,
    total: type === 'group' ? 0 : 1,
    recordIds: [],
    ...initial
  };
  const isCurrent = () => runningJobs.get(registryKey)?.id === jobId;
  const isCancelled = () => isCurrent() && runningJobs.get(registryKey)?.cancelRequested === true;
  const checkpoint = () => {
    if (!isCancelled()) return;
    const error = new Error('任务已停止');
    error.code = 'JOB_CANCELLED';
    throw error;
  };
  const update = async (patch = {}) => {
    state = { ...state, ...patch, id: jobId, type, updatedAt: Date.now() };
    if (!isCurrent()) return false;
    await setWindowSession(sessionKind, windowId, state);
    return true;
  };
  runningJobs.set(registryKey, { id: jobId, type, cancelRequested: false });
  await update();
  try {
    const result = await executor(update, { isCancelled, checkpoint });
    const cancelled = Boolean(result.cancelled || isCancelled());
    await update({
      status: cancelled ? 'cancelled' : 'completed',
      finishedAt: Date.now(),
      cancelledAt: cancelled ? Date.now() : undefined,
      completed: Array.isArray(result.recordIds)
        ? result.recordIds.length
        : (state.completed ?? (cancelled ? 0 : 1)),
      total: result.total ?? state.total ?? 1,
      recordIds: result.recordIds || state.recordIds,
      lastRecordId: result.lastRecordId || result.albumRecordId || state.lastRecordId || ''
    });
    return { ok: true, jobId, ...result, cancelled };
  } catch (error) {
    if (error?.code === 'JOB_CANCELLED') {
      await update({
        status: 'cancelled',
        finishedAt: Date.now(),
        cancelledAt: Date.now(),
        stage: '任务已停止'
      });
      return {
        ok: true,
        cancelled: true,
        jobId,
        recordIds: state.recordIds || [],
        lastRecordId: state.lastRecordId || ''
      };
    }
    await update({ status: 'failed', finishedAt: Date.now(), error: errText(error) });
    return {
      ok: false,
      jobId,
      error: errText(error),
      recordIds: state.recordIds || [],
      lastRecordId: state.lastRecordId || ''
    };
  } finally {
    if (isCurrent()) runningJobs.delete(registryKey);
  }
}

async function cancelWindowJob(windowId) {
  if (windowId == null) return { ok: false, error: '无法确定当前浏览器窗口' };
  const registryKey = `job:${windowId}`;
  const active = runningJobs.get(registryKey);
  if (!active) return { ok: false, error: '当前没有可停止的任务' };
  runningJobs.set(registryKey, { ...active, cancelRequested: true });
  const state = await getWindowSession('job', windowId);
  if (state?.status === 'running') {
    await setWindowSession('job', windowId, {
      ...state,
      cancelRequested: true,
      stage: '正在停止任务',
      updatedAt: Date.now()
    });
  }
  return { ok: true, requested: true };
}

async function persistReversePanelTask(windowId, resp) {
  const existing = await getWindowSession('panelTask', windowId);
  const sameSource = Boolean(existing) && (
    (resp.sourceRequestId && existing.sourceRequestId === resp.sourceRequestId) ||
    (!resp.sourceRequestId && existing.sourceTs === resp.sourceTs)
  );
  await setWindowSession('panelTask', windowId, {
    ...(sameSource ? existing : {}),
    sourceRequestId: resp.sourceRequestId || '',
    sourceTs: resp.sourceTs,
    prompt: resp.promptEn || '',
    sourcePrompt: resp.promptEn || '',
    promptZh: resp.promptZh || '',
    explanationLanguage: resp.explanationLanguage || '',
    updatedAt: Date.now()
  });
}

async function reverseAndPersist(payload, update) {
  const resp = await doReverse(payload);
  if (!resp?.ok) throw new Error(resp?.error || '反推失败');
  const active = await update({
    stage: '反推完成',
    sourceKey: resp.sourceRequestId || resp.sourceTs || null,
    sourceRequestId: resp.sourceRequestId || '',
    sourceTs: resp.sourceTs,
    promptEn: resp.promptEn || '',
    promptZh: resp.promptZh || '',
    explanationLanguage: resp.explanationLanguage || '',
    provider: resp.provider || '',
    model: resp.model || ''
  });
  if (active) await persistReversePanelTask(payload.windowId, resp);
  return { ...resp, total: 1 };
}

async function generateAndSave(payload, update, control) {
  const source = payload.sourceSnapshot ? { ...payload.sourceSnapshot } : null;
  control.checkpoint();
  await update({
    stage: '正在调用生图模型',
    total: 1,
    sourceKey: source?.requestId || source?.ts || null,
    label: 'generate'
  });
  const resp = await doGenerate({
    ...payload,
    sourceDataUrl: payload.sourceDataUrl || '',
    sourceRequestId: source?.requestId,
    sourceTs: source?.ts
  });
  if (!resp?.ok) throw new Error(resp?.error || '生成失败');
  await update({ stage: '正在保存到相册' });
  const albumRecordId = await saveGeneratedRecord(resp, {
    prompt: payload.prompt,
    source,
    sourcePrompt: payload.sourcePrompt,
    promptZh: payload.promptZh,
    explanationLanguage: payload.explanationLanguage,
    sourceAssetId: sourceAssetIdOf(source),
    albumMeta: payload.albumMeta
  });
  return {
    ...resp,
    albumRecordId,
    recordIds: [albumRecordId],
    lastRecordId: albumRecordId,
    total: 1,
    cancelled: control.isCancelled()
  };
}

async function editAndSave(payload, update, control) {
  const source = payload.sourceSnapshot ? { ...payload.sourceSnapshot } : null;
  if (!source?.dataUrl) throw new Error('图生图缺少来源图片');
  control.checkpoint();
  await update({
    stage: payload.jobLabel || '正在编辑图片',
    total: 1,
    sourceKey: source?.requestId || source?.ts || null,
    label: payload.albumMeta?.kind === 'replacement' ? 'replacement' : 'generate'
  });
  const resp = await doEdit({
    prompt: payload.prompt,
    ratio: payload.ratio,
    selection: payload.selection,
    sourceDataUrl: source.dataUrl,
    referenceDataUrl: payload.referenceDataUrl || ''
  });
  if (!resp?.ok) throw new Error(resp?.error || '图片编辑失败');
  await update({ stage: '正在保存到相册' });
  const albumRecordId = await saveGeneratedRecord(resp, {
    prompt: payload.prompt,
    source,
    sourcePrompt: payload.sourcePrompt,
    promptZh: payload.promptZh,
    explanationLanguage: payload.explanationLanguage,
    sourceAssetId: sourceAssetIdOf(source),
    albumMeta: payload.albumMeta
  });
  return {
    ...resp,
    albumRecordId,
    recordIds: [albumRecordId],
    lastRecordId: albumRecordId,
    total: 1,
    cancelled: control.isCancelled()
  };
}

async function generateGroupAndSave(payload, update, control) {
  const count = [2, 4, 6, 8].includes(Number(payload.count)) ? Number(payload.count) : 4;
  const source = payload.sourceSnapshot ? { ...payload.sourceSnapshot } : null;
  const useImageEdit = Boolean(payload.useImageEdit);
  if (useImageEdit && !source?.dataUrl) throw new Error('缺少组图来源大图');
  const recordIds = [];
  const groupId = payload.groupId || crypto.randomUUID();
  let first = null;
  await update({
    total: count,
    completed: 0,
    recordIds,
    sourceKey: source?.requestId || source?.ts || null,
    label: 'group',
    stage: useImageEdit ? `正在基于当前大图生成主体锚点 1/${count}` : `正在使用文生图生成第 1/${count} 张`
  });

  for (let index = 0; index < count; index += 1) {
    if (control.isCancelled()) break;
    const number = index + 1;
    if (index > 0) {
      await update({
        stage: useImageEdit
          ? `正在基于主体锚点生成第 ${number}/${count} 张`
          : `正在使用文生图生成第 ${number}/${count} 张`
      });
    }
    const variationPrompt = index === 0
      ? payload.prompt
      : useImageEdit
        ? `${payload.prompt}\n\n以参考图中的主体为唯一身份锚点，严格保持同一人物、角色或物品的身份特征、脸型、五官、发型、服装核心特征和整体画风一致。这是同一组作品的第 ${number} 张，仅允许在动作、表情、机位或构图上做自然的小幅变化；不得更换主体，不得增加或删除主要角色。`
        : `${payload.prompt}\n\n这是同一主题组图的第 ${number} 张。保持主体类型、核心外观、服装、环境、光线、色彩和整体画风尽量一致，仅对动作、表情、机位或构图做自然的小幅变化；不得增加或删除主要角色。`;
    const resp = useImageEdit
      ? await doEdit({
          prompt: variationPrompt,
          ratio: payload.ratio,
          selection: payload.editSelection,
          sourceDataUrl: index === 0 ? source.dataUrl : first.dataUrl
        })
      : await doGenerate({
          prompt: variationPrompt,
          ratio: payload.ratio,
          selection: payload.initialSelection,
          sourceDataUrl: '',
          windowId: payload.windowId
        });
    if (!resp?.ok) throw new Error(`第 ${number} 张失败：${resp?.error || '未知错误'}`);
    if (!first) first = resp;
    const recordSource = useImageEdit && index > 0
      ? { ...source, dataUrl: first.dataUrl, src: '' }
      : source;
    const sourceAssetId = useImageEdit && index > 0
      ? `group:${groupId}:anchor`
      : sourceAssetIdOf(source, groupId);
    const albumRecordId = await saveGeneratedRecord(resp, {
      prompt: payload.prompt,
      source: recordSource,
      sourcePrompt: payload.sourcePrompt,
      promptZh: payload.promptZh,
      explanationLanguage: payload.explanationLanguage,
      sourceAssetId,
      albumMeta: {
        kind: 'group-item',
        groupId,
        groupIndex: number,
        groupCount: count,
        groupAnchor: useImageEdit && index === 0,
        groupMode: useImageEdit ? 'image-edit' : 'text-to-image'
      }
    });
    recordIds.push(albumRecordId);
    await update({ completed: number, recordIds: [...recordIds], lastRecordId: albumRecordId });
    if (control.isCancelled()) break;
  }
  return {
    recordIds,
    lastRecordId: recordIds.at(-1),
    total: count,
    useImageEdit,
    cancelled: control.isCancelled()
  };
}

async function recoverInterruptedJobs() {
  const values = await chrome.storage.session.get(null).catch(() => ({}));
  const updates = {};
  for (const [key, value] of Object.entries(values)) {
    if (!/^ir\.window\.\d+\.(?:job|reverseJob)$/.test(key) || value?.status !== 'running') continue;
    const isReverse = key.endsWith('.reverseJob');
    updates[key] = {
      ...value,
      status: 'failed',
      finishedAt: Date.now(),
      updatedAt: Date.now(),
      error: isReverse
        ? '浏览器后台反推任务曾意外中断，请重新反推'
        : '浏览器后台任务曾意外中断；已经生成的图片仍保留在相册中，请重新发起剩余任务'
    };
  }
  if (Object.keys(updates).length) await chrome.storage.session.set(updates);
}

void recoverInterruptedJobs();
