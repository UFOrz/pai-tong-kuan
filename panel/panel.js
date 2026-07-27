// 侧边栏面板：来源图片 → 反推提示词 → 生成同款图片 → 自动存入相册

import { listModelChoices, loadSettings, requiresSourceImage, saveSettings, supportsImageEdit } from '../lib/settings.js';
import { getById, addCharacter, getCharacters, getCharacterById, removeCharacters } from '../lib/db.js';
import {
  normalizedWindowId,
  scopedSessionKey,
  shouldAutoReverse,
  shouldRenderSurpriseSessionTask,
  sourceKey
} from '../lib/task-state.js';
import { grantPrivacyConsent, hasPrivacyConsent } from '../lib/privacy.js';
import { explanationLabel, localizeDocument, localizeRuntimeError, resolveLanguage, t } from '../lib/i18n.js';

const $ = (id) => document.getElementById(id);

const DEFAULT_REPLACE_INSTRUCTION = `Perform a highly photorealistic person replacement.

Image roles:
- Image 1: The base image to edit. It defines the final composition, scene, and clothing.
- Image 2: The identity and appearance reference. Use it only for the replacement person's face and physical characteristics.

Editing requirements:
Completely replace the person in Image 1 with the person from Image 2. The final person must clearly preserve the identity and appearance of the person in Image 2, including:
- Face shape, facial features, eyes, eyebrows, nose, and lips
- Skin tone, hairstyle, hair color, and hairline
- Apparent age, demeanor, and recognizable facial characteristics
- Height proportions, shoulder width, waist-to-hip ratio, limb build, and overall body shape

Clothing requirements:
Preserve all clothing, footwear, and accessories worn by the person in Image 1.
Do not change the clothing's style, color, material, pattern, neckline, sleeve design, or coordination.
Refit the clothing naturally to the actual body shape of the person in Image 2, with realistic fabric folds, tension, occlusion, and weight distribution.
Do not copy any clothing from Image 2.

Must remain unchanged:
- Preserve the original pose, action, gestures, gaze direction, and expression state of the person in Image 1
- Preserve the composition, subject position, subject size, and body orientation of Image 1
- Preserve the background, environment, props, and their positions in Image 1
- Preserve the camera angle, perceived focal length, depth of field, and crop of Image 1
- Preserve the original light direction, shadows, color temperature, exposure, and overall color palette of Image 1
- Preserve every element in Image 1 except the person's identity, appearance, hair, skin tone, and physical characteristics

Integration requirements:
Make the person from Image 2 appear naturally present in the scene from Image 1.
Accurately match the lighting, skin highlights, shadows, perspective, sharpness, grain, and imaging characteristics of Image 1.
The face, head, neck, and body must connect naturally and must not look like a pasted face swap.
Preserve realistic skin texture. The final result should look like a real photograph rather than an AI-generated composite.

Only permitted changes:
The identity, facial appearance, hair, skin tone, and physical characteristics of the person in Image 1.

Prohibited:
Do not change the clothing design, pose, or background. Do not add or remove objects.
Do not beautify the subject into a different person, blend the facial features of the two people, or retain facial features from the person in Image 1.
Do not produce duplicate faces, malformed fingers, distorted limbs, abnormal head-to-body proportions, plastic-looking skin, excessive skin smoothing,
collage-like edges, text, or watermarks.`;

const els = {
  secPrivacy: $('secPrivacy'),
  secEmpty: $('secEmpty'),
  secSource: $('secSource'),
  secPrompt: $('secPrompt'),
  secGen: $('secGen'),
  secResult: $('secResult'),
  secReplace: $('secReplace'),
  secBatch: $('secBatch'),
  srcImg: $('srcImg'),
  srcPlaceholder: $('srcPlaceholder'),
  srcStatus: $('srcStatus'),
  srcMeta: $('srcMeta'),
  btnReverse: $('btnReverse'),
  btnCopyPrompt: $('btnCopyPrompt'),
  reverseLoading: $('reverseLoading'),
  reverseDone: $('reverseDone'),
  reverseError: $('reverseError'),
  surpriseNotice: $('surpriseNotice'),
  surpriseProfile: $('surpriseProfile'),
  surpriseAiLoading: $('surpriseAiLoading'),
  visionModelLabel: $('visionModelLabel'),
  taPrompt: $('taPrompt'),
  zhNote: $('zhNote'),
  selVisionModel: $('selVisionModel'),
  selRatio: $('selRatio'),
  selImageModel: $('selImageModel'),
  sizeHint: $('sizeHint'),
  modelHint: $('modelHint'),
  btnGenerate: $('btnGenerate'),
  genProgress: $('genProgress'),
  genText: $('genText'),
  genDone: $('genDone'),
  genError: $('genError'),
  replaceProgress: $('replaceProgress'),
  replaceProgressText: $('replaceProgressText'),
  replaceDone: $('replaceDone'),
  replaceError: $('replaceError'),
  btnCancelGroup: $('btnCancelGroup'),
  resImg: $('resImg'),
  resMeta: $('resMeta'),
  btnDownload: $('btnDownload'),
  btnRegen: $('btnRegen'),
  btnGoAlbum: $('btnGoAlbum'),
  saveState: $('saveState'),
  toast: $('toast')
};

let source = null;          // 当前来源图片（pendingSource）
let reversedPrompt = '';    // 最近一次反推得到的原文
let reversedPromptZh = '';  // 最近一次反推得到的中文解读
let reversedPromptLanguage = '';
let currentLanguage = 'zh';
let settings = null;
let lastResult = null;      // 最近一次生成结果
let lastAlbumRecordId = ''; // 当前结果在相册中的记录 ID
let reversing = false;
let generating = false;
let toastTimer = 0;
let reverseSeq = 0;
let restoredResultUrl = '';
let taskWriteChain = Promise.resolve();
let settingsWriteChain = Promise.resolve();
let taskPersistTimer = 0;
let privacyConsentGranted = false;
let characters = [];
let selectedCharacterId = '';
let currentWindowId = null;
const jobPreviewUrls = new Map();
const renderedJobRecordIds = new Set();
let visibleJobState = null;
let visibleJobTimer = 0;
let visibleReverseJobState = null;
let visibleReverseJobTimer = 0;
let regionCaptureActive = false;
let surpriseMode = false;
let surpriseGenerating = false;
let currentSurpriseProfile = '';
let currentSurpriseProfileLabel = '';
let currentSurpriseExplanation = '';
const ui = (key, vars = {}) => t(key, vars, currentLanguage);

$('replaceInstruction').value = DEFAULT_REPLACE_INSTRUCTION;

function choiceValue(selection) {
  return selection?.platformId && selection?.model
    ? JSON.stringify([selection.platformId, selection.model])
    : '';
}

function selectedModel(select) {
  try {
    const [platformId, model] = JSON.parse(select.value);
    return { platformId, model };
  } catch {
    return { platformId: '', model: '' };
  }
}

function populateModelSelect(select, type) {
  const choices = listModelChoices(settings, type);
  select.innerHTML = '';
  for (const choice of choices) {
    const option = document.createElement('option');
    option.value = choiceValue(choice);
    option.textContent = choice.label;
    select.appendChild(option);
  }
  select.disabled = choices.length === 0;
  if (!choices.length) {
    const option = document.createElement('option');
    option.textContent = ui(type === 'vision' ? '未启用反推模型' : '未启用生图模型');
    select.appendChild(option);
  } else {
    select.value = choiceValue(settings.defaults?.[type]);
    if (!select.value) select.selectedIndex = 0;
  }
}

function resetDefaultModels() {
  if (!settings) return;
  for (const [select, type] of [[els.selVisionModel, 'vision'], [els.selImageModel, 'image']]) {
    const value = choiceValue(settings.defaults?.[type]);
    if ([...select.options].some((option) => option.value === value)) select.value = value;
  }
  updateHints();
}

function saveDefaultModel(type, select) {
  const selection = selectedModel(select);
  if (!selection.platformId || !selection.model) return settingsWriteChain;
  const appliesToNextSurprise =
    type === 'vision' &&
    surpriseMode &&
    surpriseGenerating;
  settings = {
    ...settings,
    defaults: { ...(settings?.defaults || {}), [type]: selection }
  };
  settingsWriteChain = settingsWriteChain.then(async () => {
    const latest = await loadSettings();
    latest.defaults = { ...(latest.defaults || {}), [type]: selection };
    await saveSettings(latest);
    settings = latest;
  }).then(() => {
    showToast(ui(appliesToNextSurprise
      ? '已保存为默认反推模型，将在下次惊喜生成时生效'
      : type === 'vision' ? '已设为默认反推模型' : '已设为默认生图模型'));
  }).catch((error) => {
    showToast(ui('保存默认模型失败：{error}', { error: error?.message || error }));
  });
  return settingsWriteChain;
}

function send(msg) {
  const payload = { ...(msg?.payload || {}) };
  if (currentWindowId != null) payload.windowId = currentWindowId;
  return chrome.runtime.sendMessage({ ...msg, payload });
}

function windowSessionKey(kind) {
  return scopedSessionKey(kind, currentWindowId);
}

async function getWindowSession(kind) {
  const key = windowSessionKey(kind);
  if (!key) return null;
  const values = await chrome.storage.session.get(key);
  return values[key] || null;
}

async function setWindowSession(kind, value) {
  const key = windowSessionKey(kind);
  if (!key) throw new Error('无法确定当前浏览器窗口');
  await chrome.storage.session.set({ [key]: value });
}

async function removeWindowSession(kind) {
  const key = windowSessionKey(kind);
  if (key) await chrome.storage.session.remove(key);
}

function sendQuietly(msg) {
  void send(msg).catch((e) => showToast(ui('操作失败：{error}', { error: e?.message || e })));
}

function showToast(text) {
  const content = String(text ?? '');
  els.toast.textContent = content;
  els.toast.hidden = false;
  clearTimeout(toastTimer);
  const duration = Math.min(6500, Math.max(2200, 1800 + content.length * 55));
  toastTimer = setTimeout(() => (els.toast.hidden = true), duration);
}

function show(el, yes = true) { el.hidden = !yes; }

function localizedJobStage(stage = '') {
  const patterns = [
    [/^正在基于当前大图生成主体锚点 (\d+)\/(\d+)$/, '正在基于当前大图生成主体锚点 {current}/{total}'],
    [/^正在基于主体锚点生成第 (\d+)\/(\d+) 张$/, '正在基于主体锚点生成第 {current}/{total} 张'],
    [/^正在使用文生图生成第 (\d+)\/(\d+) 张$/, '正在使用文生图生成第 {current}/{total} 张'],
    [/^当前模型不支持图生图，正在使用文生图生成第 (\d+)\/(\d+) 张$/, '当前模型不支持图生图，正在使用文生图生成第 {current}/{total} 张']
  ];
  for (const [pattern, key] of patterns) {
    const match = stage.match(pattern);
    if (match) return ui(key, { current: match[1], total: match[2] });
  }
  return ui(stage);
}

function setCancelControls(activeKind = '', cancelRequested = false) {
  show(els.btnCancelGroup, activeKind === 'group');
  els.btnCancelGroup.disabled = cancelRequested;
}

async function cancelGroupJob() {
  els.btnCancelGroup.disabled = true;
  try {
    const response = await send({ type: 'ir.job.cancel' });
    if (!response?.ok) {
      showToast(ui(response?.error || '当前没有可停止的任务'));
      els.btnCancelGroup.disabled = false;
      return;
    }
    $('batchStatus').textContent = ui('正在停止任务…');
    showToast(ui('已请求停止任务；当前已提交的图片仍会完成并保存'));
  } catch (error) {
    showToast(ui('停止任务失败：{error}', { error: error?.message || error }));
    els.btnCancelGroup.disabled = false;
  }
}

function setReplacePanel(visible) {
  show(els.secReplace, visible);
  $('btnShowReplace').setAttribute('aria-expanded', String(visible));
}

function setReplaceAvailable(available) {
  const button = $('btnShowReplace');
  const key = available ? '替换角色/物品' : '惊喜模式下不可用';
  button.setAttribute('aria-disabled', String(!available));
  button.setAttribute('aria-label', ui(key));
  button.dataset.tooltip = ui(key);
  if (!available) setReplacePanel(false);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function renderPrivacyRequired() {
  show(els.secPrivacy, true);
  show(els.secEmpty, false);
  show(els.secSource, false);
  show(els.secPrompt, false);
  show(els.secGen, false);
  show(els.secResult, false);
  setReplacePanel(false);
  show(els.secBatch, false);
}

function revokeRestoredResultUrl() {
  if (!restoredResultUrl) return;
  URL.revokeObjectURL(restoredResultUrl);
  restoredResultUrl = '';
}

function clearJobPreviewUrls() {
  for (const url of jobPreviewUrls.values()) URL.revokeObjectURL(url);
  jobPreviewUrls.clear();
  renderedJobRecordIds.clear();
}

function setPromptLoadingLabel(key) {
  const spinner = document.createElement('span');
  spinner.className = 'spinner';
  els.reverseLoading.replaceChildren(spinner, document.createTextNode(ui(key)));
}

function setSurpriseButtonsDisabled(disabled) {
  for (const id of ['btnSurprise', 'btnSurprise2', 'btnSurpriseAgain']) {
    $(id).disabled = Boolean(disabled);
  }
}

function setSurpriseModelState() {
  const label = ui('AI反推模型');
  els.visionModelLabel.setAttribute('aria-label', label);
  els.visionModelLabel.dataset.tooltip = label;
  els.visionModelLabel.querySelector('.field-label-text').textContent = label;
  els.selVisionModel.disabled = !els.selVisionModel.value;
}

function resetTaskUI() {
  revokeRestoredResultUrl();
  visibleJobState = null;
  clearInterval(visibleJobTimer);
  visibleJobTimer = 0;
  visibleReverseJobState = null;
  clearInterval(visibleReverseJobTimer);
  visibleReverseJobTimer = 0;
  reversedPrompt = '';
  reversedPromptZh = '';
  reversedPromptLanguage = '';
  surpriseMode = false;
  surpriseGenerating = false;
  currentSurpriseProfile = '';
  currentSurpriseProfileLabel = '';
  currentSurpriseExplanation = '';
  lastResult = null;
  lastAlbumRecordId = '';
  els.taPrompt.value = '';
  els.taPrompt.placeholder = ui('反推得到的提示词会显示在这里，可以直接编辑');
  els.resImg.removeAttribute('src');
  show(els.zhNote, false);
  show(els.secResult, false);
  show(els.saveState, false);
  show(els.genDone, false);
  show(els.genError, false);
  show(els.genProgress, false);
  show(els.reverseDone, false);
  show(els.reverseError, false);
  show(els.reverseLoading, false);
  show(els.surpriseAiLoading, false);
  setPromptLoadingLabel('正在反推提示词…');
  setSurpriseButtonsDisabled(false);
  setSurpriseModelState();
  setReplaceAvailable(true);
  els.secPrompt.classList.remove('surprise-active');
  show(els.surpriseNotice, false);
  setReplacePanel(false);
  show(els.replaceProgress, false);
  show(els.replaceDone, false);
  show(els.replaceError, false);
  show(els.secBatch, false);
  clearJobPreviewUrls();
  resetDefaultModels();
}

function persistTask(patch = {}) {
  const taskSource = source;
  if (!taskSource || taskSource.status !== 'ready') return taskWriteChain;
  const expectedKey = sourceKey(taskSource);
  if (surpriseMode) {
    taskWriteChain = taskWriteChain.then(async () => {
      if (!surpriseMode || sourceKey(source) !== expectedKey) return;
      const existing = await getWindowSession('surpriseTask');
      await setWindowSession('surpriseTask', {
        ...(existing || {}),
        active: true,
        status: 'ready',
        sourceRequestId: taskSource.requestId,
        sourceTs: taskSource.ts,
        prompt: els.taPrompt.value,
        sourcePrompt: reversedPrompt || els.taPrompt.value,
        explanation: currentSurpriseExplanation,
        profile: currentSurpriseProfile,
        profileLabel: currentSurpriseProfileLabel,
        ratio: els.selRatio.value,
        updatedAt: Date.now(),
        ...patch
      });
    }).catch(() => {});
    return taskWriteChain;
  }
  taskWriteChain = taskWriteChain.then(async () => {
    if (sourceKey(source) !== expectedKey) return;
    const existing = await getWindowSession('panelTask');
    const sameTask = sourceKey(existing) === expectedKey ? existing : {};
    const panelTask = {
      ...sameTask,
      sourceRequestId: taskSource.requestId || '',
      sourceTs: taskSource.ts,
      prompt: els.taPrompt.value,
      sourcePrompt: reversedPrompt,
      promptZh: reversedPromptZh,
      explanationLanguage: reversedPromptLanguage,
      ratio: els.selRatio.value,
      updatedAt: Date.now(),
      ...patch
    };
    delete panelTask.visionSelection;
    delete panelTask.imageSelection;
    if (sourceKey(source) === expectedKey) {
      await setWindowSession('panelTask', panelTask);
    }
  }).catch(() => {});
  return taskWriteChain;
}

async function restoreTask(taskSource) {
  const expectedKey = sourceKey(taskSource);
  const reverseJob = await getWindowSession('reverseJob');
  if (sourceKey(source) !== expectedKey) return;
  if (reverseJob?.sourceKey === expectedKey && reverseJob.status !== 'completed') {
    renderBackgroundReverseJob(reverseJob);
    return;
  }
  const panelTask = await getWindowSession('panelTask');
  if (sourceKey(source) !== expectedKey || sourceKey(panelTask) !== expectedKey) return;

  reversedPrompt = panelTask.sourcePrompt || '';
  reversedPromptZh = panelTask.promptZh || '';
  reversedPromptLanguage = panelTask.explanationLanguage || (reversedPromptZh ? 'zh' : '');
  els.taPrompt.value = panelTask.prompt || reversedPrompt;
  els.taPrompt.placeholder = ui('可以直接编辑提示词');
  show(els.reverseDone, Boolean(els.taPrompt.value));
  if (reversedPromptZh && reversedPromptLanguage === currentLanguage && currentLanguage !== 'en') {
    els.zhNote.textContent = explanationLabel(currentLanguage) + '：' + reversedPromptZh;
    show(els.zhNote, true);
  }
  if ([...els.selRatio.options].some((o) => o.value === panelTask.ratio)) {
    els.selRatio.value = panelTask.ratio;
    updateHints();
  }
  updateHints();

  if (!panelTask.albumRecordId) return;
  const rec = await getById(panelTask.albumRecordId);
  if (!rec || sourceKey(source) !== expectedKey) return;
  revokeRestoredResultUrl();
  restoredResultUrl = URL.createObjectURL(rec.blob);
  lastResult = {
    dataUrl: restoredResultUrl,
    mime: rec.blob?.type || 'image/png',
    provider: rec.provider,
    model: rec.model,
    width: rec.width,
    height: rec.height,
    ratio: rec.ratio,
    size: rec.size
  };
  lastAlbumRecordId = rec.id;
  els.resImg.src = restoredResultUrl;
  els.resMeta.textContent =
    `${rec.provider || ''} · ${rec.model || ''} · ${rec.width}×${rec.height} · ${rec.ratio || ''}`;
  show(els.secResult, true);
  show(els.genDone, true);
  show(els.saveState, true);
}

async function consumeNewSourceAndReverse(s) {
  const expectedKey = sourceKey(s);
  const consumed = { ...s, needsReverse: false };
  source = consumed;
  try {
    await setWindowSession('pendingSource', consumed);
  } catch { /* 即使状态写入失败，本次用户点击仍继续处理 */ }
  if (sourceKey(source) === expectedKey) await autoReverse();
}

// ---------- 来源图片 ----------

async function refreshPending() {
  try {
    const resp = await send({ type: 'ir.getPending' });
    if (resp?.ok && resp.source) applySource(resp.source);
    else renderEmpty();
  } catch (e) {
    renderEmpty();
    showToast(ui('读取图片状态失败：{error}', { error: e?.message || e }));
  }
}

function renderSurpriseLoading(task = {}) {
  resetTaskUI();
  const ts = Number(task.sourceTs || task.updatedAt || Date.now());
  const requestId = task.sourceRequestId || `surprise:${crypto.randomUUID()}`;
  source = { requestId, ts, status: 'loading', surprise: true };
  surpriseMode = true;
  surpriseGenerating = true;
  currentSurpriseProfile = 'ai';
  currentSurpriseProfileLabel = 'AI 随机创作';
  els.secPrompt.classList.add('surprise-active');
  setSurpriseModelState();
  setReplaceAvailable(false);
  els.surpriseProfile.textContent = `${ui(currentSurpriseProfileLabel)} · ${ui('不使用参考图')}`;
  els.taPrompt.value = '';
  els.taPrompt.placeholder = ui('AI惊喜提示词生成中…');
  show(els.surpriseNotice, true);
  show(els.secEmpty, false);
  show(els.secSource, false);
  show(els.secPrompt, true);
  show(els.secGen, false);
  show(els.surpriseAiLoading, true);
  setSurpriseButtonsDisabled(true);
}

function renderSurpriseFailure(task = {}) {
  renderSurpriseLoading(task);
  surpriseGenerating = false;
  show(els.surpriseAiLoading, false);
  setSurpriseModelState();
  els.taPrompt.placeholder = '';
  els.reverseError.textContent = ui('生成惊喜提示词失败：{error}', {
    error: task.error || ui('未知错误')
  });
  show(els.reverseError, true);
  setSurpriseButtonsDisabled(false);
}

async function renderSurpriseTask(task, { restoreResult = true } = {}) {
  if (!task?.prompt) return false;
  const ts = Number(task.sourceTs || task.updatedAt || Date.now());
  const requestId = task.sourceRequestId || `surprise:${crypto.randomUUID()}`;
  const preserveVisibleResult =
    surpriseMode &&
    !surpriseGenerating &&
    sourceKey(source) === requestId;
  if (!preserveVisibleResult) resetTaskUI();
  source = { requestId, ts, status: 'ready', surprise: true };
  surpriseMode = true;
  surpriseGenerating = false;
  currentSurpriseProfile = task.profile || '';
  currentSurpriseProfileLabel = task.profileLabel || 'AI 随机创作';
  currentSurpriseExplanation = task.explanation || '';
  reversedPrompt = task.sourcePrompt || task.prompt;
  reversedPromptZh = currentLanguage === 'zh' ? currentSurpriseExplanation : '';
  reversedPromptLanguage = reversedPromptZh ? 'zh' : '';
  els.taPrompt.value = task.prompt;
  els.taPrompt.placeholder = ui('可以直接编辑提示词');
  els.secPrompt.classList.add('surprise-active');
  setSurpriseModelState();
  setReplaceAvailable(false);
  els.surpriseProfile.textContent = `${ui(currentSurpriseProfileLabel)} · ${ui('不使用参考图')}`;
  show(els.surpriseNotice, true);
  show(els.secEmpty, false);
  show(els.secSource, false);
  show(els.secPrompt, true);
  show(els.secGen, true);
  if ([...els.selRatio.options].some((option) => option.value === task.ratio)) {
    els.selRatio.value = task.ratio;
  }
  updateHints();
  if (reversedPromptZh) {
    els.zhNote.textContent = explanationLabel('zh') + '：' + reversedPromptZh;
    show(els.zhNote, true);
  }
  if (restoreResult && task.albumRecordId) {
    const record = await getById(task.albumRecordId).catch(() => null);
    if (record && surpriseMode && sourceKey(source) === requestId) {
      await showSavedRecord(record, true);
    }
  }
  return true;
}

async function refreshWorkspace() {
  const surpriseTask = await getWindowSession('surpriseTask').catch(() => null);
  if (surpriseTask?.active) {
    if (surpriseTask.status === 'running') {
      renderSurpriseLoading(surpriseTask);
      return;
    }
    if (surpriseTask.status === 'failed') {
      renderSurpriseFailure(surpriseTask);
      return;
    }
    if (surpriseTask.prompt) {
      await renderSurpriseTask(surpriseTask);
      return;
    }
  }
  await refreshPending();
}

async function createSurprisePrompt() {
  if (!privacyConsentGranted) {
    renderPrivacyRequired();
    return;
  }
  if (generating || reversing || surpriseGenerating) {
    showToast(ui('当前已有生成任务进行中'));
    return;
  }
  const surpriseSelectionSnapshot = selectedModel(els.selVisionModel);
  const task = {
    active: true,
    sourceRequestId: `surprise:${crypto.randomUUID()}`,
    sourceTs: Date.now(),
    status: 'running',
    profile: 'ai',
    profileLabel: 'AI 随机创作',
    ratio: els.selRatio.value,
    updatedAt: Date.now()
  };
  renderSurpriseLoading(task);
  await setWindowSession('surpriseTask', task).catch(() => {});
  try {
    const resp = await send({
      type: 'ir.job.surprise',
      payload: {
        sourceRequestId: task.sourceRequestId,
        sourceTs: task.sourceTs,
        ratio: task.ratio,
        selection: surpriseSelectionSnapshot
      }
    });
    if (!resp?.ok) throw new Error(resp?.error || ui('生成惊喜提示词失败'));
    const readyTask = resp.task || await getWindowSession('surpriseTask');
    if (!readyTask?.prompt) throw new Error(ui('反推模型未返回随机提示词'));
    if (sourceKey(source) !== task.sourceRequestId) return;
    await renderSurpriseTask(readyTask, { restoreResult: false });
    const imageSelection = selectedModel(els.selImageModel);
    const imageChoice = listModelChoices(settings, 'image').find((item) =>
      item.platformId === imageSelection.platformId && item.model === imageSelection.model);
    showToast(ui(requiresSourceImage(imageChoice)
      ? '惊喜模式需要文生图模型，请切换到支持文生图的模型'
      : '惊喜提示词已生成'));
    els.taPrompt.focus({ preventScroll: true });
    els.secPrompt.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (error) {
    const failedTask = {
      ...task,
      status: 'failed',
      error: error?.message || String(error),
      updatedAt: Date.now()
    };
    await setWindowSession('surpriseTask', failedTask).catch(() => {});
    if (sourceKey(source) === task.sourceRequestId) renderSurpriseFailure(failedTask);
  }
}

function applySource(s) {
  const isNew = sourceKey(source) !== sourceKey(s);
  const becameReady = s.status === 'ready' && (isNew || source?.status !== 'ready');
  if (isNew) {
    if (surpriseMode) void removeWindowSession('surpriseTask');
    reverseSeq += 1; // 让旧图片仍在等待的反推响应失效
    reversing = false;
    resetTaskUI();
    els.btnReverse.disabled = false;
  }
  source = s;
  show(els.secEmpty, false);
  show(els.secSource, true);

  els.srcMeta.textContent = s.pageTitle || s.pageUrl || '';
  if (s.status === 'loading') {
    els.srcImg.removeAttribute('src');
    show(els.srcImg, false);
    show(els.srcPlaceholder, true);
    if (s.previewUrl) {
      const loadingSourceKey = sourceKey(s);
      els.srcImg.onload = () => {
        if (sourceKey(source) !== loadingSourceKey || source?.status !== 'loading') return;
        show(els.srcPlaceholder, false);
        show(els.srcImg, true);
      };
      els.srcImg.onerror = () => {
        if (sourceKey(source) !== loadingSourceKey || source?.status !== 'loading') return;
        show(els.srcImg, false);
        show(els.srcPlaceholder, true);
      };
      els.srcImg.src = s.previewUrl;
    }
    els.srcStatus.textContent = ui('正在处理当前页面图片…');
    els.srcStatus.classList.remove('err');
    show(els.secPrompt, false);
    show(els.secGen, false);
    show(els.secResult, false);
  } else if (s.status === 'error') {
    els.srcImg.onload = null;
    els.srcImg.onerror = null;
    els.srcImg.removeAttribute('src');
    show(els.srcImg, false);
    show(els.srcPlaceholder, false);
    els.srcStatus.textContent = ui('图片获取失败：{error}', { error: s.error || ui('未知错误') });
    els.srcStatus.classList.add('err');
    show(els.secPrompt, false);
    show(els.secGen, false);
  } else {
    els.srcImg.onload = null;
    els.srcImg.onerror = null;
    els.srcImg.src = s.dataUrl;
    show(els.srcPlaceholder, false);
    show(els.srcImg, true);
    els.srcStatus.textContent = ui('原图尺寸 {width}×{height}', { width: s.width, height: s.height });
    els.srcStatus.classList.remove('err');
    show(els.secPrompt, true);
    show(els.secGen, true);
    show(els.secResult, !!lastResult);
    if (shouldAutoReverse(s, becameReady)) {
      void consumeNewSourceAndReverse(s);
    } else if (becameReady) {
      void restoreTask(s).catch((e) => showToast(ui('恢复上次任务失败：{error}', { error: e?.message || e })));
    }
  }
}

function renderEmpty() {
  source = null;
  surpriseMode = false;
  els.secPrompt.classList.remove('surprise-active');
  show(els.surpriseNotice, false);
  show(els.secEmpty, true);
  show(els.secSource, false);
  show(els.secPrompt, false);
  show(els.secGen, false);
  show(els.secResult, false);
  setReplacePanel(false);
  show(els.secBatch, false);
}

// 面板已打开时，用户又点击了新图片 → 监听 session 存储变化
chrome.storage.session.onChanged.addListener((changes) => {
  const pendingChange = changes[windowSessionKey('pendingSource')];
  const actionChange = changes[windowSessionKey('albumAction')];
  const feedbackChange = changes[windowSessionKey('captureFeedback')];
  const jobChange = changes[windowSessionKey('job')];
  const reverseJobChange = changes[windowSessionKey('reverseJob')];
  const surpriseChange = changes[windowSessionKey('surpriseTask')];
  if (pendingChange?.newValue) applySource(pendingChange.newValue);
  if (actionChange?.newValue) void handleAlbumAction().catch((e) => showToast(e?.message || e));
  if (feedbackChange?.newValue) {
    regionCaptureActive = false;
    const feedback = feedbackChange.newValue;
    if (!feedback.cancelled) {
      showToast(feedback.ok
        ? ui('区域截图完成：{width}×{height}', { width: feedback.width, height: feedback.height })
        : ui('区域截图失败：{error}', { error: localizeRuntimeError(feedback.error, currentLanguage) }));
    }
  }
  if (jobChange?.newValue) renderBackgroundJob(jobChange.newValue);
  if (reverseJobChange?.newValue) renderBackgroundReverseJob(reverseJobChange.newValue);
  if (surpriseChange?.newValue?.active &&
      surpriseMode &&
      sourceKey(source) === surpriseChange.newValue.sourceRequestId) {
    const task = surpriseChange.newValue;
    if (!shouldRenderSurpriseSessionTask(task, { surpriseGenerating, lastAlbumRecordId })) return;
    if (task.status === 'running') renderSurpriseLoading(task);
    else if (task.status === 'failed') renderSurpriseFailure(task);
    else if (task.prompt) void renderSurpriseTask(task);
  }
});

// 设置页或侧边栏保存后即时刷新，并始终采用最新的全局默认模型。
chrome.storage.local.onChanged.addListener((changes) => {
  if (!changes.settings) return;
  void loadSettings().then((nextSettings) => {
    settings = nextSettings;
    currentLanguage = resolveLanguage(settings.language);
    localizeDocument(currentLanguage);
    if (surpriseMode) {
      els.surpriseProfile.textContent = `${ui(currentSurpriseProfileLabel)} · ${ui('不使用参考图')}`;
    }
    setSurpriseModelState();
    setReplaceAvailable(!surpriseMode);
    show(els.zhNote, Boolean(reversedPromptZh && reversedPromptLanguage === currentLanguage && currentLanguage !== 'en'));
    populateModelSelect(els.selVisionModel, 'vision');
    populateModelSelect(els.selImageModel, 'image');
    updateHints();
  }).catch(() => {});
});

// ---------- 反推 ----------

async function autoReverse() {
  if (!privacyConsentGranted) { renderPrivacyRequired(); return; }
  if (reversing) return;
  if (!source || source.status !== 'ready') return;
  const sourceRequestId = source.requestId;
  const sourceTs = source.ts;
  const currentSourceKey = sourceKey(source);
  const opId = ++reverseSeq;
  reversing = true;
  reversedPrompt = '';
  reversedPromptZh = '';
  reversedPromptLanguage = '';
  els.taPrompt.value = '';
  els.taPrompt.placeholder = ui('正在反推提示词…');
  show(els.zhNote, false);
  show(els.reverseDone, false);
  show(els.reverseError, false);
  show(els.reverseLoading, true);
  els.btnReverse.disabled = true;
  try {
    const resp = await send({
      type: 'ir.job.reverse',
      payload: { sourceRequestId, sourceTs, selection: selectedModel(els.selVisionModel) }
    });
    if (opId !== reverseSeq || sourceKey(source) !== currentSourceKey || resp?.stale) return;
    // 无论成功失败，先停止转圈
    show(els.reverseLoading, false);
    if (resp?.ok) {
      reversedPrompt = resp.promptEn || '';
      reversedPromptZh = resp.promptZh || '';
      reversedPromptLanguage = resp.explanationLanguage || (reversedPromptZh ? currentLanguage : '');
      els.taPrompt.value = reversedPrompt;
      if (resp.promptZh && currentLanguage !== 'en') {
        els.zhNote.textContent = explanationLabel(currentLanguage) + '：' + resp.promptZh;
        show(els.zhNote, true);
      }
      els.taPrompt.placeholder = ui('可以直接编辑提示词');
      show(els.reverseDone, true);
      void persistTask();
    } else {
      els.taPrompt.placeholder = '';
      els.reverseError.textContent = ui('反推失败：{error}', { error: resp?.error || ui('未知错误') });
      show(els.reverseError, true);
    }
  } catch (e) {
    if (opId === reverseSeq && sourceKey(source) === currentSourceKey) {
      els.taPrompt.placeholder = '';
      els.reverseError.textContent = ui('反推失败：{error}', { error: e?.message || e });
      show(els.reverseError, true);
    }
  } finally {
    if (opId === reverseSeq) {
      reversing = false;
      show(els.reverseLoading, false);
      els.btnReverse.disabled = false;
    }
  }
}

function applyReverseResult(result) {
  reversedPrompt = result.promptEn || '';
  reversedPromptZh = result.promptZh || '';
  reversedPromptLanguage = result.explanationLanguage || (reversedPromptZh ? currentLanguage : '');
  els.taPrompt.value = reversedPrompt;
  els.taPrompt.placeholder = ui('可以直接编辑提示词');
  if (reversedPromptZh && reversedPromptLanguage === currentLanguage && currentLanguage !== 'en') {
    els.zhNote.textContent = explanationLabel(currentLanguage) + '：' + reversedPromptZh;
    show(els.zhNote, true);
  } else {
    show(els.zhNote, false);
  }
  show(els.reverseDone, true);
}

function updateVisibleReverseJobClock() {
  const job = visibleReverseJobState;
  if (!job || job.status !== 'running') return;
  const elapsed = Math.max(0, Math.round((Date.now() - job.startedAt) / 1000));
  els.taPrompt.placeholder = ui('正在反推提示词，已等待 {seconds} 秒…', { seconds: elapsed });
}

function setVisibleReverseJobState(job) {
  visibleReverseJobState = job;
  clearInterval(visibleReverseJobTimer);
  visibleReverseJobTimer = 0;
  if (job?.status === 'running') {
    updateVisibleReverseJobClock();
    visibleReverseJobTimer = setInterval(updateVisibleReverseJobClock, 1000);
  }
}

function renderBackgroundReverseJob(job) {
  if (!job || (job.sourceKey && job.sourceKey !== sourceKey(source))) return;
  setVisibleReverseJobState(job);
  if (job.status === 'running') {
    reversing = true;
    reversedPrompt = '';
    reversedPromptZh = '';
    els.taPrompt.value = '';
    show(els.zhNote, false);
    show(els.reverseDone, false);
    show(els.reverseError, false);
    show(els.reverseLoading, true);
    els.btnReverse.disabled = true;
    updateVisibleReverseJobClock();
    return;
  }

  reversing = false;
  show(els.reverseLoading, false);
  els.btnReverse.disabled = false;
  if (job.status === 'completed') {
    applyReverseResult(job);
  } else if (job.status === 'failed') {
    reversedPrompt = '';
    reversedPromptZh = '';
    els.taPrompt.value = '';
    els.taPrompt.placeholder = '';
    show(els.zhNote, false);
    show(els.reverseDone, false);
    els.reverseError.textContent = ui('反推失败：{error}', { error: job.error || ui('未知错误') });
    show(els.reverseError, true);
  }
}

// ---------- 生成 ----------

function updateHints() {
  if (!settings) return;
  const ratio = els.selRatio.value;
  const size = settings.sizeMap?.[ratio] || '';
  let note = '';
  const ratioParts = ratio.split(':').map(Number);
  const sizeParts = size.split('x').map(Number);
  if (ratioParts.every(Number.isFinite) && sizeParts.every(Number.isFinite)) {
    const wanted = ratioParts[0] / ratioParts[1];
    const actual = sizeParts[0] / sizeParts[1];
    if (Math.abs(wanted - actual) / wanted > 0.03) note = ui('（近似值）');
  }
  els.sizeHint.textContent = size ? `${ui('尺寸')} ${size}${note}` : '';
  const choice = listModelChoices(settings, 'image').find((item) =>
    choiceValue(item) === els.selImageModel.value);
  els.modelHint.textContent = choice ? `${ui('默认生图')}：${choice.platformName} · ${choice.model}` : ui('尚未启用生图模型');
}

async function generate() {
  if (!privacyConsentGranted) { renderPrivacyRequired(); return; }
  const prompt = els.taPrompt.value.trim();
  if (!prompt) { showToast(ui('请先反推或输入提示词')); return; }
  if (generating) return;
  const surpriseSnapshot = surpriseMode;
  const sourceSnapshot = source ? { ...source } : null;
  const sourcePromptSnapshot = reversedPrompt || prompt;
  const promptZhSnapshot = reversedPromptZh;
  const explanationLanguageSnapshot = reversedPromptLanguage;
  const imageSelection = selectedModel(els.selImageModel);
  const imageChoice = listModelChoices(settings, 'image').find((item) =>
    item.platformId === imageSelection.platformId && item.model === imageSelection.model);
  if (surpriseSnapshot && requiresSourceImage(imageChoice)) {
    showToast(ui('惊喜模式需要文生图模型，请切换到支持文生图的模型'));
    return;
  }
  const useSourceImage = !surpriseSnapshot && requiresSourceImage(imageChoice);
  if (useSourceImage && !sourceSnapshot?.dataUrl) {
    showToast(ui('当前生图模型需要来源图片，请先选择图片'));
    return;
  }
  void persistTask();
  generating = true;

  els.btnGenerate.disabled = true;
  show(els.genDone, false);
  show(els.genError, false);
  // 点击生成后才显示转圈动画
  show(els.genProgress, true);
  const t0 = Date.now();
  const timer = setInterval(() => {
    els.genText.textContent = ui('正在生成，已等待 {seconds} 秒…', { seconds: Math.round((Date.now() - t0) / 1000) });
  }, 1000);

  try {
    const resp = useSourceImage
      ? await send({ type: 'ir.job.edit', payload: {
          prompt,
          ratio: els.selRatio.value,
          selection: imageSelection,
          sourceSnapshot,
          sourcePrompt: sourcePromptSnapshot,
          promptZh: promptZhSnapshot,
          explanationLanguage: explanationLanguageSnapshot,
          jobLabel: '正在生成同款图片'
        }})
      : await send({ type: 'ir.job.generate', payload: {
          prompt,
          ratio: els.selRatio.value,
          selection: imageSelection,
          sourceSnapshot,
          sourcePrompt: sourcePromptSnapshot,
          promptZh: promptZhSnapshot,
          explanationLanguage: explanationLanguageSnapshot,
          albumMeta: surpriseSnapshot ? {
            kind: 'surprise',
            surpriseProfile: currentSurpriseProfile
          } : undefined
        }});
    // 接口返回后立刻停止转圈
    clearInterval(timer);
    show(els.genProgress, false);
    const sourceChanged = sourceKey(source) !== sourceKey(sourceSnapshot);
    if (!resp?.ok) {
      if (sourceChanged) {
        showToast(ui('上一张图片生成失败：{error}', { error: resp?.error || ui('未知错误') }));
        return;
      }
      els.genError.textContent = ui('生成失败：{error}', { error: resp?.error || ui('未知错误') });
      show(els.genError, true);
      return;
    }
    if (resp.cancelled && !resp.dataUrl) {
      showToast(ui('任务已停止'));
      return;
    }
    if (sourceChanged) {
      showToast(ui('上一张图片的生成已完成，已保存到相册'));
      return;
    }
    revokeRestoredResultUrl();
    lastResult = resp;
    els.resImg.src = resp.dataUrl;
    els.resMeta.textContent =
      `${resp.provider} · ${resp.model} · ${resp.width}×${resp.height} · ${resp.ratio}`;
    show(els.secResult, true);
    show(els.saveState, Boolean(resp.albumRecordId));
    show(els.genDone, true);
    lastAlbumRecordId = resp.albumRecordId || '';
    if (lastAlbumRecordId) void persistTask({ albumRecordId: lastAlbumRecordId });
    if (resp.cancelled) showToast(ui('任务已停止，当前已完成的图片已保存'));
    els.resImg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    els.genError.textContent = ui('生成失败：{error}', { error: e?.message || e });
    show(els.genError, true);
  } finally {
    clearInterval(timer);
    generating = false;
    els.btnGenerate.disabled = false;
    show(els.genProgress, false);
  }
}

// ---------- 截屏 / 角色替换 / 批量 ----------

async function capturePage() {
  showToast(ui('请在网页中拖动框选截图区域，按 Esc 可取消'));
  regionCaptureActive = true;
  const resp = await send({ type: 'ir.startRegionCapture' }).catch((error) => ({
    ok: false,
    error: error?.message || String(error)
  }));
  if (!resp?.ok) {
    regionCaptureActive = false;
    showToast(ui('无法开始截图：{error}', {
      error: localizeRuntimeError(resp?.error || '请确认当前是普通网页', currentLanguage)
    }));
  }
}

async function cancelRegionCaptureFromPanel() {
  if (!regionCaptureActive) return;
  regionCaptureActive = false;
  const resp = await send({ type: 'ir.cancelRegionCapture' }).catch((error) => ({
    ok: false,
    error: error?.message || String(error)
  }));
  if (!resp?.ok) {
    showToast(ui('取消截图失败：{error}', {
      error: localizeRuntimeError(resp?.error, currentLanguage)
    }));
  }
}

async function refreshCharacters() {
  const nextCharacters = await getCharacters();
  for (const item of characters) {
    if (item._url) URL.revokeObjectURL(item._url);
  }
  characters = nextCharacters;
  if (!characters.some((item) => item.id === selectedCharacterId)) selectedCharacterId = characters[0]?.id || '';
  renderCharacterManager();
  renderCharacterPicker();
}

function characterUrl(item) {
  if (!item._url) item._url = URL.createObjectURL(item.blob);
  return item._url;
}

async function saveCharacter(item) {
  const { _url, ...record } = item;
  await addCharacter(record);
}

function renderCharacterPicker() {
  const picker = $('characterPicker');
  picker.innerHTML = characters.length
    ? ''
    : `<button class="btn ghost" id="emptyAddCharacter" type="button">${ui('＋ 先添加角色或物品')}</button>`;
  for (const item of characters) {
    const button = document.createElement('button');
    button.className = 'character-choice' + (item.id === selectedCharacterId ? ' selected' : '');
    button.type = 'button';
    button.innerHTML = `<img alt=""><span></span>`;
    const image = button.querySelector('img');
    image.src = characterUrl(item);
    button.querySelector('span').textContent = item.name || ui('未命名素材');
    button.title = item.id === selectedCharacterId
      ? ui('再次点击查看大图')
      : ui('选择 {name}', { name: item.name || ui('素材') });
    button.addEventListener('click', () => {
      if (selectedCharacterId === item.id) {
        openCharacterPreview(item);
        return;
      }
      selectedCharacterId = item.id;
      renderCharacterPicker();
    });
    picker.appendChild(button);
  }
  picker.querySelector('#emptyAddCharacter')?.addEventListener('click', openCharacterManager);
}

function renderCharacterManager() {
  const list = $('characterList');
  list.innerHTML = characters.length ? '' : `<p class="feature-desc">${ui('还没有素材，点击上方添加图片。')}</p>`;
  for (const item of characters) {
    const card = document.createElement('article');
    card.className = 'character-item';
    card.innerHTML = `<button class="character-thumb" type="button" title="${ui('查看大图')}" aria-label="${ui('查看素材大图')}"><img alt=""></button><footer><input aria-label="${ui('素材名称')}"><button type="button" title="${ui('删除')}">×</button></footer>`;
    const previewButton = card.querySelector('.character-thumb');
    const image = card.querySelector('.character-thumb img');
    const nameInput = card.querySelector('footer input');
    const deleteButton = card.querySelector('footer button');
    image.src = characterUrl(item);
    image.alt = item.name || ui('角色或物品素材');
    previewButton.addEventListener('click', () => openCharacterPreview(item));
    nameInput.value = item.name || '';
    nameInput.addEventListener('change', async (e) => {
      item.name = e.target.value.trim() || ui('未命名素材');
      await saveCharacter(item);
      renderCharacterPicker();
    });
    deleteButton.addEventListener('click', async () => {
      await removeCharacters([item.id]);
      URL.revokeObjectURL(item._url || '');
      await refreshCharacters();
    });
    list.appendChild(card);
  }
}

function openCharacterPreview(item) {
  const name = item.name || ui('未命名素材');
  $('characterPreviewImg').src = characterUrl(item);
  $('characterPreviewImg').alt = name;
  $('characterPreviewName').textContent = name;
  $('characterPreviewDialog').hidden = false;
  queueMicrotask(() => $('characterPreviewClose').focus());
}

function closeCharacterPreview() {
  $('characterPreviewDialog').hidden = true;
  $('characterPreviewImg').removeAttribute('src');
}

function openCharacterManager() { $('characterDialog').hidden = false; void refreshCharacters(); }
function closeCharacterManager() { closeCharacterPreview(); $('characterDialog').hidden = true; }

async function replaceCharacter() {
  if (generating) return showToast(ui('当前已有生成任务进行中'));
  if (!source?.dataUrl) return showToast(ui('请先选择需要修改的图片'));
  const character = await getCharacterById(selectedCharacterId);
  if (!character) return openCharacterManager();
  const instruction = $('replaceInstruction').value.trim() || DEFAULT_REPLACE_INSTRUCTION;
  const sourceSnapshot = { ...source };
  const promptZhSnapshot = reversedPromptZh;
  const explanationLanguageSnapshot = reversedPromptLanguage;
  const selectionSnapshot = selectedModel(els.selImageModel);
  const button = $('btnReplaceGenerate');
  button.disabled = true;
  generating = true;
  els.btnGenerate.disabled = true;
  show(els.replaceDone, false);
  show(els.replaceError, false);
  show(els.replaceProgress, true);
  els.replaceProgressText.textContent = ui('正在替换角色或者物品…');
  const startedAt = Date.now();
  const progressTimer = setInterval(() => {
    els.replaceProgressText.textContent = ui('正在替换角色或者物品，已等待 {seconds} 秒…', {
      seconds: Math.round((Date.now() - startedAt) / 1000)
    });
  }, 1000);
  try {
    const resp = await send({ type: 'ir.job.edit', payload: {
      prompt: instruction,
      ratio: els.selRatio.value,
      selection: selectionSnapshot,
      sourceSnapshot,
      sourcePrompt: instruction,
      promptZh: promptZhSnapshot,
      explanationLanguage: explanationLanguageSnapshot,
      referenceDataUrl: await blobToDataUrl(character.blob),
      albumMeta: { kind: 'replacement', characterId: character.id },
      jobLabel: '正在替换角色或者物品'
    }});
    if (!resp?.ok) throw new Error(resp?.error || '替换失败');
    if (resp.cancelled && !resp.dataUrl) {
      showToast(ui('任务已停止'));
      return;
    }
    if (sourceKey(source) !== sourceKey(sourceSnapshot)) {
      showToast(ui('上一张图片的替换已完成，已保存到相册'));
      return;
    }
    presentSavedResult(resp, '角色/物品替换', false);
    show(els.replaceDone, true);
    if (resp.cancelled) showToast(ui('任务已停止，当前已完成的图片已保存'));
  } catch (error) {
    els.replaceError.textContent = ui('替换失败：{error}', { error: error?.message || error });
    show(els.replaceError, true);
  } finally {
    clearInterval(progressTimer);
    button.disabled = false;
    generating = false;
    els.btnGenerate.disabled = false;
    show(els.replaceProgress, false);
  }
}

function presentSavedResult(resp, label = '生成', showGenerationDone = true) {
  lastResult = resp;
  els.resImg.src = resp.dataUrl;
  els.resMeta.textContent = `${resp.provider} · ${resp.model} · ${resp.width}×${resp.height} · ${resp.ratio}`;
  show(els.secResult, true);
  show(els.genDone, showGenerationDone);
  show(els.saveState, Boolean(resp.albumRecordId));
  lastAlbumRecordId = resp.albumRecordId || '';
  if (lastAlbumRecordId) void persistTask({ albumRecordId: lastAlbumRecordId });
  showToast(ui('{label}完成，已保存到相册', { label: ui(label) }));
  els.secResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function groupEditSelection() {
  const choices = listModelChoices(settings, 'image');
  const current = selectedModel(els.selImageModel);
  const hasKey = (item) => Boolean(settings.platforms.find((platform) => platform.id === item.platformId)?.apiKey);
  const currentChoice = choices.find((item) =>
    item.platformId === current.platformId && item.model === current.model);
  if (currentChoice && supportsImageEdit(currentChoice) && hasKey(currentChoice)) return currentChoice;
  return null;
}

function appendGroupPreview(rec, index, count) {
  if (!rec || renderedJobRecordIds.has(rec.id)) return;
  renderedJobRecordIds.add(rec.id);
  const figure = document.createElement('figure');
  figure.className = 'batch-result';
  figure.tabIndex = 0;
  figure.setAttribute('role', 'button');
  figure.setAttribute('aria-label', ui('在相册中查看组图第 {index} 张，共 {count} 张', { index, count }));
  figure.title = ui('点击在相册中查看大图');
  const openInAlbum = () => sendQuietly({ type: 'ir.openAlbum', payload: { recordId: rec.id } });
  figure.addEventListener('click', openInAlbum);
  figure.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openInAlbum();
  });
  const img = document.createElement('img');
  const url = URL.createObjectURL(rec.blob);
  jobPreviewUrls.set(rec.id, url);
  img.src = url;
  img.alt = ui('组图第 {index} 张，共 {count} 张', { index, count });
  const label = document.createElement('figcaption');
  label.textContent = `${index}/${count}`;
  figure.append(img, label);
  $('batchResults').appendChild(figure);
}

function showLatestGroupResult(rec) {
  if (!rec) return;
  const url = jobPreviewUrls.get(rec.id) || URL.createObjectURL(rec.blob);
  if (!jobPreviewUrls.has(rec.id)) jobPreviewUrls.set(rec.id, url);
  lastResult = {
    dataUrl: url,
    mime: rec.blob?.type || 'image/png',
    provider: rec.provider,
    model: rec.model,
    width: rec.width,
    height: rec.height,
    ratio: rec.ratio,
    size: rec.size
  };
  lastAlbumRecordId = rec.id;
  els.resImg.src = url;
  els.resMeta.textContent = `${rec.provider} · ${rec.model} · ${rec.width}×${rec.height} · ${rec.ratio}`;
  show(els.secResult, true);
  show(els.genDone, true);
  show(els.saveState, true);
}

async function loadJobRecords(recordIds) {
  const records = await Promise.all((recordIds || []).map((id) => getById(id).catch(() => null)));
  return records.filter(Boolean);
}

async function showSavedRecord(rec, showGenerationDone = true) {
  if (!rec) return;
  revokeRestoredResultUrl();
  restoredResultUrl = URL.createObjectURL(rec.blob);
  lastResult = {
    dataUrl: restoredResultUrl,
    mime: rec.blob?.type || 'image/png',
    provider: rec.provider,
    model: rec.model,
    width: rec.width,
    height: rec.height,
    ratio: rec.ratio,
    size: rec.size
  };
  lastAlbumRecordId = rec.id;
  els.resImg.src = restoredResultUrl;
  els.resMeta.textContent = `${rec.provider || ''} · ${rec.model || ''} · ${rec.width}×${rec.height} · ${rec.ratio || ''}`;
  show(els.secResult, true);
  show(els.genDone, showGenerationDone);
  show(els.saveState, true);
  void persistTask({ albumRecordId: rec.id });
}

function updateVisibleJobClock() {
  const job = visibleJobState;
  if (!job || job.status !== 'running') return;
  const elapsed = Math.max(0, Math.round((Date.now() - job.startedAt) / 1000));
  if (job.cancelRequested) {
    if (job.label === 'group') $('batchStatus').textContent = ui('正在停止任务…');
    else if (job.label === 'replacement') els.replaceProgressText.textContent = ui('正在停止任务…');
    else els.genText.textContent = ui('正在停止任务…');
    return;
  }
  if (job.label === 'group') {
    $('batchStatus').textContent = ui('正在生成组图，已等待 {seconds} 秒…', { seconds: elapsed });
  } else if (job.label === 'replacement') {
    els.replaceProgressText.textContent = ui('{stage}，已等待 {seconds} 秒…', {
      stage: localizedJobStage(job.stage || '正在替换角色或者物品'),
      seconds: elapsed
    });
  } else {
    els.genText.textContent = ui('正在生成，已等待 {seconds} 秒…', { seconds: elapsed });
  }
}

function setVisibleJobState(job) {
  visibleJobState = job;
  clearInterval(visibleJobTimer);
  visibleJobTimer = 0;
  if (job?.status === 'running') {
    updateVisibleJobClock();
    visibleJobTimer = setInterval(updateVisibleJobClock, 1000);
  }
}

async function renderBackgroundJob(job) {
  if (!job || (job.sourceKey && job.sourceKey !== sourceKey(source))) return;
  setVisibleJobState(job);
  const elapsed = Math.max(0, Math.round(((job.finishedAt || Date.now()) - job.startedAt) / 1000));
  if (job.label === 'group') {
    show(els.secBatch, true);
    $('batchStatus').classList.toggle('batch-running', job.status === 'running');
    const records = await loadJobRecords(job.recordIds || []);
    records.forEach((record, index) => appendGroupPreview(record, index + 1, job.total || records.length));
    if (job.status === 'running') {
      generating = true;
      els.btnGenerate.disabled = true;
      setCancelControls('group', Boolean(job.cancelRequested));
      $('batchStatus').textContent = ui('正在生成组图，已等待 {seconds} 秒…', { seconds: elapsed });
    } else if (job.status === 'completed') {
      generating = false;
      els.btnGenerate.disabled = false;
      showLatestGroupResult(records.at(-1));
      $('batchStatus').textContent = ui('{count} 张组图已完成并保存到相册；用时 {seconds} 秒。', {
        count: records.length,
        seconds: elapsed
      });
      setCancelControls('');
    } else if (job.status === 'cancelled') {
      generating = false;
      els.btnGenerate.disabled = false;
      if (records.length) showLatestGroupResult(records.at(-1));
      $('batchStatus').textContent = ui('任务已停止，已保留 {count} 张图片', { count: records.length });
      setCancelControls('');
    } else if (job.status === 'failed') {
      generating = false;
      els.btnGenerate.disabled = false;
      if (records.length) showLatestGroupResult(records.at(-1));
      $('batchStatus').textContent = ui('组图生成中断：{error}{saved}', {
        error: job.error || ui('未知错误'),
        saved: records.length ? ui('；已保留前 {count} 张。', { count: records.length }) : ''
      });
      setCancelControls('');
    }
    return;
  }

  const isReplacement = job.label === 'replacement';
  setCancelControls('');
  if (job.status === 'running') {
    generating = true;
    els.btnGenerate.disabled = true;
    if (isReplacement) {
      show(els.replaceProgress, true);
      els.replaceProgressText.textContent = ui('{stage}，已等待 {seconds} 秒…', {
        stage: localizedJobStage(job.stage || '正在替换角色或者物品'),
        seconds: elapsed
      });
    } else {
      show(els.genProgress, true);
      els.genText.textContent = ui('{stage}，已等待 {seconds} 秒…', {
        stage: localizedJobStage(job.stage || '正在生成'),
        seconds: elapsed
      });
    }
    return;
  }

  generating = false;
  els.btnGenerate.disabled = false;
  show(els.genProgress, false);
  show(els.replaceProgress, false);
  setCancelControls('');
  if (job.status === 'completed' && job.lastRecordId) {
    const rec = await getById(job.lastRecordId).catch(() => null);
    await showSavedRecord(rec, !isReplacement);
    if (isReplacement) show(els.replaceDone, true);
  } else if (job.status === 'failed') {
    const target = isReplacement ? els.replaceError : els.genError;
    target.textContent = ui('{action}失败：{error}', {
      action: ui(isReplacement ? '替换' : '生成'),
      error: job.error || ui('未知错误')
    });
    show(target, true);
  } else if (job.status === 'cancelled') {
    if (job.lastRecordId) {
      const rec = await getById(job.lastRecordId).catch(() => null);
      await showSavedRecord(rec, !isReplacement);
    }
    showToast(ui(job.lastRecordId ? '任务已停止，当前已完成的图片已保存' : '任务已停止'));
  }
}

async function generateGroup(requestedCount) {
  if (!privacyConsentGranted) { renderPrivacyRequired(); return; }
  const prompt = els.taPrompt.value.trim();
  if (!prompt) return showToast(ui('缺少原作品提示词'));
  if (generating) return showToast(ui('当前已有生成任务进行中'));

  const count = [2, 4, 6, 8].includes(Number(requestedCount)) ? Number(requestedCount) : 4;
  const initialSelection = selectedModel(els.selImageModel);
  const editSelection = groupEditSelection();
  const useImageEdit = Boolean(editSelection);
  const sourceSnapshot = source ? { ...source } : null;
  if (useImageEdit && !sourceSnapshot?.dataUrl) return showToast(ui('缺少组图来源大图，请从相册大图重新发起'));

  const sourcePromptSnapshot = reversedPrompt || prompt;
  const promptZhSnapshot = reversedPromptZh;
  const explanationLanguageSnapshot = reversedPromptLanguage;
  const ratio = els.selRatio.value;
  const startedAt = Date.now();
  let groupStage = useImageEdit
    ? ui('正在基于当前大图生成主体锚点 {current}/{total}', { current: 1, total: count })
    : ui('当前模型不支持图生图，正在使用文生图生成第 {current}/{total} 张', { current: 1, total: count });
  const elapsedSeconds = () => Math.round((Date.now() - startedAt) / 1000);
  const renderGroupProgress = () => {
    $('batchStatus').textContent = ui('{stage}，已等待 {seconds} 秒…', {
      stage: groupStage,
      seconds: elapsedSeconds()
    });
  };
  generating = true;
  els.btnGenerate.disabled = true;
  show(els.secBatch, true);
  show(els.genDone, false);
  clearJobPreviewUrls();
  clearInterval(visibleJobTimer);
  $('batchResults').innerHTML = '';
  $('batchStatus').classList.add('batch-running');
  setCancelControls('group');
  renderGroupProgress();
  const groupTimer = 0; // 后台 job 状态负责持续计时，关闭并重开侧边栏也能恢复。
  if (!useImageEdit) showToast(ui('当前模型不支持图生图，已自动切换为文生图组图'));
  els.secBatch.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  try {
    const response = await send({ type: 'ir.job.group', payload: {
      prompt,
      ratio,
      count,
      initialSelection,
      editSelection,
      useImageEdit,
      sourceSnapshot,
      sourcePrompt: sourcePromptSnapshot,
      promptZh: promptZhSnapshot,
      explanationLanguage: explanationLanguageSnapshot
    }});
    if (sourceKey(source) !== sourceKey(sourceSnapshot)) {
      const saved = response?.recordIds?.length || 0;
      showToast(response?.ok
        ? ui('上一张图片的 {count} 张组图已完成并保存到相册', { count: saved })
        : ui('上一张图片的组图已中断，已保留 {count} 张', { count: saved }));
      return;
    }
    const savedRecords = await loadJobRecords(response?.recordIds || []);
    savedRecords.forEach((record, index) => appendGroupPreview(record, index + 1, count));
    if (!response?.ok) throw new Error(response?.error || '组图生成失败');
    if (response.cancelled) {
      showLatestGroupResult(savedRecords.at(-1));
      $('batchStatus').textContent = ui('任务已停止，已保留 {count} 张图片', { count: savedRecords.length });
      showToast(ui('任务已停止，已保留 {count} 张图片', { count: savedRecords.length }));
      return;
    }
    showLatestGroupResult(savedRecords.at(-1));
    if (lastAlbumRecordId) void persistTask({ albumRecordId: lastAlbumRecordId });
    clearInterval(groupTimer);
    $('batchStatus').textContent = useImageEdit
      ? ui('{count} 张主体锚定组图已全部生成，并分别保存到相册；用时 {seconds} 秒。', { count, seconds: elapsedSeconds() })
      : ui('{count} 张文生图组图已全部生成，并分别保存到相册；用时 {seconds} 秒。', { count, seconds: elapsedSeconds() });
    showToast(ui('组图完成：已保存 {count} 张', { count }));
  } catch (error) {
    clearInterval(groupTimer);
    if (sourceKey(source) !== sourceKey(sourceSnapshot)) {
      showToast(ui('上一张图片的组图任务已结束，请到相册查看已保存结果'));
      return;
    }
    const job = await getWindowSession('job').catch(() => null);
    const savedRecords = await loadJobRecords(job?.recordIds || []);
    const saved = savedRecords.length;
    savedRecords.forEach((record, index) => appendGroupPreview(record, index + 1, count));
    if (savedRecords.length) {
      showLatestGroupResult(savedRecords.at(-1));
      if (lastAlbumRecordId) void persistTask({ albumRecordId: lastAlbumRecordId });
    }
    $('batchStatus').textContent = ui('组图生成中断（已等待 {seconds} 秒）：{error}{saved}', {
      seconds: elapsedSeconds(),
      error: error?.message || error,
      saved: saved ? ui('；已保留并保存前 {count} 张。', { count: saved }) : ''
    });
    showToast(saved
      ? ui('已保存前 {count} 张，后续生成失败', { count: saved })
      : ui('组图生成失败'));
  } finally {
    clearInterval(groupTimer);
    $('batchStatus').classList.remove('batch-running');
    generating = false;
    els.btnGenerate.disabled = false;
    setCancelControls('');
  }
}

async function handleAlbumAction() {
  const albumAction = await getWindowSession('albumAction');
  if (!albumAction?.recordId) return;
  await removeWindowSession('albumAction');
  const rec = await getById(albumAction.recordId);
  if (!rec) return showToast(ui('未找到相册作品'));
  const dataUrl = await blobToDataUrl(rec.blob);
  const prepared = { requestId: crypto.randomUUID(), ts: Date.now(), status: 'ready', needsReverse: false,
    src: rec.srcUrl || '', pageUrl: rec.pageUrl || '', pageTitle: '来自拍同款相册', dataUrl,
    width: rec.width, height: rec.height, mime: rec.blob.type || 'image/png', sourceAssetId: `record:${rec.id}` };
  await setWindowSession('pendingSource', prepared);
  applySource(prepared);
  els.taPrompt.value = rec.prompt || '';
  reversedPrompt = rec.sourcePrompt || rec.prompt || '';
  reversedPromptZh = rec.promptZh || '';
  reversedPromptLanguage = rec.explanationLanguage || (reversedPromptZh ? 'zh' : '');
  if ([...els.selRatio.options].some((item) => item.value === rec.ratio)) els.selRatio.value = rec.ratio;
  updateHints();
  if (albumAction.action === 'regenerate') await generate();
  else if (albumAction.action === 'replace') { setReplacePanel(true); await refreshCharacters(); els.secReplace.scrollIntoView({ behavior: 'smooth' }); }
  else if (albumAction.action === 'group') await generateGroup(Number(albumAction.count || 4));
}

function downloadCurrent() {
  if (!lastResult) return;
  const a = document.createElement('a');
  const ext = (lastResult.mime || 'image/png').split('/')[1] || 'png';
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  a.download =
    `拍同款_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.${ext}`;
  a.href = lastResult.dataUrl;
  a.click();
}

function openCurrentResultInAlbum() {
  if (!lastAlbumRecordId) {
    showToast(ui('这张图片还未保存到相册'));
    return;
  }
  sendQuietly({ type: 'ir.openAlbum', payload: { recordId: lastAlbumRecordId } });
}

// ---------- 事件绑定 ----------

els.btnReverse.addEventListener('click', autoReverse);
els.btnCopyPrompt.addEventListener('click', async () => {
  const text = els.taPrompt.value.trim();
  if (!text) return;
  await navigator.clipboard.writeText(text).catch(() => {});
  showToast(ui('提示词已复制'));
});
els.btnGenerate.addEventListener('click', generate);
els.btnRegen.addEventListener('click', generate);
els.btnCancelGroup.addEventListener('click', cancelGroupJob);
els.btnDownload.addEventListener('click', downloadCurrent);
els.resImg.addEventListener('click', openCurrentResultInAlbum);
els.resImg.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  openCurrentResultInAlbum();
});
$('btnCapture').addEventListener('click', capturePage);
$('btnCapture2').addEventListener('click', capturePage);
$('btnSurprise').addEventListener('click', createSurprisePrompt);
$('btnSurprise2').addEventListener('click', createSurprisePrompt);
$('btnSurpriseAgain').addEventListener('click', createSurprisePrompt);
$('btnMagicToggle').addEventListener('click', async (e) => {
  const button = e.currentTarget;
  const visible = button.getAttribute('aria-pressed') !== 'true';
  button.disabled = true;
  try {
    const resp = await send({ type: 'ir.setMagicButtonVisible', payload: { visible } });
    if (!resp?.ok) return showToast(resp?.error || ui('设置失败'));
    button.setAttribute('aria-pressed', String(resp.visible));
    button.classList.toggle('active', resp.visible);
    const actionLabel = ui(resp.visible ? '隐藏魔法按钮' : '显示魔法按钮');
    button.dataset.tooltip = actionLabel;
    button.setAttribute('aria-label', actionLabel);
    showToast(resp.visible
      ? ui(resp.delivered ? '网页魔法按钮已恢复' : '已开启；请在普通网页图片上移动鼠标')
      : ui('网页魔法按钮已隐藏'));
  } finally {
    button.disabled = false;
  }
});
$('btnCharacters').addEventListener('click', openCharacterManager);
$('btnOpenCharacters').addEventListener('click', openCharacterManager);
$('btnShowReplace').addEventListener('click', async () => {
  if (surpriseMode) {
    showToast(ui('惊喜模式没有参考图片，无法替换角色或物品。请先选择一张来源图片。'));
    return;
  }
  const visible = els.secReplace.hidden;
  setReplacePanel(visible);
  if (visible) {
    await refreshCharacters();
    els.secReplace.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});
$('btnReplaceGenerate').addEventListener('click', replaceCharacter);
$('characterClose').addEventListener('click', closeCharacterManager);
$('characterBackdrop').addEventListener('click', closeCharacterManager);
$('characterPreviewClose').addEventListener('click', closeCharacterPreview);
$('characterPreviewBackdrop').addEventListener('click', closeCharacterPreview);
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (regionCaptureActive) {
    event.preventDefault();
    event.stopPropagation();
    void cancelRegionCaptureFromPanel();
    return;
  }
  if (!$('characterPreviewDialog').hidden) closeCharacterPreview();
  else if (!$('characterDialog').hidden) closeCharacterManager();
});
$('characterFile').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  await addCharacter({
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    name: file.name.replace(/\.[^.]+$/, '') || ui('新素材'),
    blob: file
  });
  e.target.value = '';
  await refreshCharacters();
});
els.selRatio.addEventListener('change', () => {
  updateHints();
  void persistTask();
});
els.selVisionModel.addEventListener('change', () => {
  void saveDefaultModel('vision', els.selVisionModel);
  void persistTask();
});
els.selImageModel.addEventListener('change', () => {
  updateHints();
  void saveDefaultModel('image', els.selImageModel);
  void persistTask();
});
els.taPrompt.addEventListener('input', () => {
  clearTimeout(taskPersistTimer);
  taskPersistTimer = setTimeout(() => void persistTask(), 250);
});

$('btnAlbum').addEventListener('click', () => sendQuietly({ type: 'ir.openAlbum' }));
$('btnAlbum2').addEventListener('click', () => sendQuietly({ type: 'ir.openAlbum' }));
els.btnGoAlbum.addEventListener('click', () => sendQuietly({ type: 'ir.openAlbum' }));
$('btnEmptyOptions').addEventListener('click', () => sendQuietly({ type: 'ir.openOptions' }));
$('btnOptions').addEventListener('click', () => sendQuietly({ type: 'ir.openOptions' }));
$('privacyConsentCheck').addEventListener('change', (e) => {
  $('btnPrivacyAgree').disabled = !e.target.checked;
});
$('btnPrivacyAgree').addEventListener('click', async () => {
  if (!$('privacyConsentCheck').checked) return;
  try {
    await grantPrivacyConsent();
    privacyConsentGranted = true;
    show(els.secPrivacy, false);
    await refreshWorkspace();
  } catch (error) {
    showToast(ui('保存授权失败：{error}', { error: error?.message || error }));
  }
});

// ---------- 初始化 ----------

async function resolvePanelWindowId() {
  const fromQuery = normalizedWindowId(new URLSearchParams(location.search).get('windowId'));
  if (fromQuery != null) return fromQuery;
  const current = await chrome.windows.getCurrent();
  const currentId = normalizedWindowId(current?.id);
  if (currentId == null) throw new Error('无法确定当前浏览器窗口');
  return currentId;
}

(async function init() {
  try {
    currentWindowId = await resolvePanelWindowId();
    settings = await loadSettings();
    currentLanguage = resolveLanguage(settings.language);
    localizeDocument(currentLanguage);
    populateModelSelect(els.selVisionModel, 'vision');
    populateModelSelect(els.selImageModel, 'image');
    els.selRatio.value = settings.defaultRatio || '1:1';
    updateHints();
    const prefs = await send({ type: 'ir.getUiPrefs' });
    const magicVisible = prefs?.visible !== false;
    $('btnMagicToggle').setAttribute('aria-pressed', String(magicVisible));
    $('btnMagicToggle').classList.toggle('active', magicVisible);
    const magicActionLabel = ui(magicVisible ? '隐藏魔法按钮' : '显示魔法按钮');
    $('btnMagicToggle').dataset.tooltip = magicActionLabel;
    $('btnMagicToggle').setAttribute('aria-label', magicActionLabel);
    privacyConsentGranted = await hasPrivacyConsent();
    if (!privacyConsentGranted) {
      renderPrivacyRequired();
      return;
    }
    await refreshWorkspace();
    await refreshCharacters();
    await handleAlbumAction();
    const reverseJob = await getWindowSession('reverseJob');
    if (reverseJob) renderBackgroundReverseJob(reverseJob);
    const job = await getWindowSession('job');
    if (job) await renderBackgroundJob(job);
  } catch (e) {
    renderEmpty();
    showToast(ui('初始化失败：{error}', { error: e?.message || e }));
  }
})();

window.addEventListener('pagehide', () => {
  clearTimeout(taskPersistTimer);
  clearInterval(visibleJobTimer);
  clearInterval(visibleReverseJobTimer);
  void persistTask();
  revokeRestoredResultUrl();
  clearJobPreviewUrls();
  for (const item of characters) {
    if (item._url) URL.revokeObjectURL(item._url);
  }
});
