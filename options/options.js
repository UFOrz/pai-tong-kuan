// 设置页：多平台配置、模型获取、能力启用、默认模型与尺寸映射

import { PRESETS, RATIOS, listModelChoices, loadSettings, saveSettings } from '../lib/settings.js';
import { localizeDocument, resolveLanguage, t } from '../lib/i18n.js';

const $ = (id) => document.getElementById(id);
const sizeInputIds = { '1:1': 'size11', '3:2': 'size32', '2:3': 'size23', '16:9': 'size169', '9:16': 'size916' };
let state = null;
let toastTimer = 0;
let activePlatformId = '';
let currentLanguage = 'zh';
const platformStatus = new Map();
const ui = (key, vars = {}) => t(key, vars, currentLanguage);
const presetLabel = (presetId) => ui(PRESETS[presetId]?.label || '自定义平台');
const platformDisplayName = (platform) => {
  const originalPresetLabel = PRESETS[platform.preset]?.label;
  return platform.name === originalPresetLabel ? presetLabel(platform.preset) : (platform.name || ui('未命名平台'));
};

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]));

function showToast(text) {
  $('toast').textContent = text;
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($('toast').hidden = true), 2400);
}

function newPlatform() {
  return {
    id: crypto.randomUUID(), preset: 'custom', name: ui('新平台'), baseUrl: '', apiKey: '',
    models: [], visionModels: [], imageModels: [], imageEditModels: []
  };
}

function newPresetPlatform(presetId) {
  const preset = PRESETS[presetId];
  const visionModels = [...(preset.visionModels || [])];
  const imageModels = [...(preset.imageModels || [])];
  const imageEditModels = [...(preset.imageEditModels || [])];
  const disabledModels = [...(preset.disabledModels || [])];
  return {
    id: crypto.randomUUID(),
    preset: presetId,
    name: preset.label,
    baseUrl: preset.baseUrl,
    apiKey: '',
    models: [...new Set([...visionModels, ...imageModels, ...disabledModels])],
    visionModels,
    imageModels,
    imageEditModels
  };
}

function modelRows(platform) {
  if (!platform.models.length) return `<div class="model-empty">${esc(ui('尚未获取模型，可自动获取或手动添加。'))}</div>`;
  const visibleModels = state.showDisabledModels
    ? platform.models
    : platform.models.filter((model) => platform.visionModels.includes(model) || platform.imageModels.includes(model));
  if (!visibleModels.length) return `<div class="model-empty">${esc(ui('未启用的模型已隐藏，可打开上方开关查看。'))}</div>`;
  return visibleModels.map((model) => {
    const enabled = platform.visionModels.includes(model) || platform.imageModels.includes(model);
    return `
    <div class="model-row${enabled ? '' : ' disabled-model'}" data-model="${esc(model)}">
      <span title="${esc(model)}">${esc(model)}</span>
      <label><input type="checkbox" data-capability="vision" ${platform.visionModels.includes(model) ? 'checked' : ''}/> ${esc(ui('反推'))}</label>
      <label><input type="checkbox" data-capability="image" ${platform.imageModels.includes(model) ? 'checked' : ''}/> ${esc(ui('生图'))}</label>
      <button class="model-remove" type="button" title="${esc(ui('移除模型'))}" aria-label="${esc(ui('移除模型'))}">×</button>
    </div>`;
  }).join('');
}

function appendPlatformNavItem(list, platform) {
  const item = document.createElement('button');
  item.className = 'platform-nav-item' + (platform.id === activePlatformId ? ' active' : '');
  item.type = 'button';
  item.dataset.id = platform.id;
  item.setAttribute('role', 'option');
  item.setAttribute('aria-selected', String(platform.id === activePlatformId));
  const summary = presetLabel(platform.preset);
  item.innerHTML = `
    <span class="platform-nav-main"><b>${esc(platformDisplayName(platform))}</b><small>${esc(summary)}</small></span>
    <span class="platform-nav-count"><i>${esc(ui('反 {count}', { count: platform.visionModels.length }))}</i><i>${esc(ui('图 {count}', { count: platform.imageModels.length }))}</i></span>`;
  item.addEventListener('click', () => {
    activePlatformId = platform.id;
    renderPlatforms();
  });
  list.appendChild(item);
}

function appendNavGroupTitle(list, text) {
  const title = document.createElement('div');
  title.className = 'platform-nav-group';
  title.textContent = text;
  list.appendChild(title);
}

function renderPlatformNav() {
  const list = $('platformList');
  list.innerHTML = '';
  if (!state.platforms.length) {
    list.innerHTML = `<div class="platform-empty">${esc(ui('尚未添加接口'))}<br><small>${esc(ui('从右上角选择模板或自定义接口'))}</small></div>`;
    return;
  }
  appendNavGroupTitle(list, ui('已添加接口'));
  state.platforms.forEach((platform) => appendPlatformNavItem(list, platform));
}

function renderPlatforms() {
  if (!state.platforms.some((platform) => platform.id === activePlatformId)) {
    activePlatformId = state.platforms[0]?.id || '';
  }
  renderPlatformNav();
  const detail = $('platformDetail');
  detail.innerHTML = '';
  const platform = state.platforms.find((item) => item.id === activePlatformId);
  if (platform) {
    const preset = PRESETS[platform.preset];
    const getKeyUrl = preset?.getKeyUrl || '';
    const platformLabel = preset ? presetLabel(platform.preset) : platformDisplayName(platform);
    const affiliateDisclosure = ui('通过此链接注册，插件开发者可能获得平台推广奖励，不影响您的使用价格。您也可以直接访问平台官网注册。');
    const getKeyLabel = preset?.affiliateLink
      ? ui('前往 {platform} 获取 API Key（推广链接）', { platform: platformLabel })
      : ui('前往 {platform} 获取 API Key', { platform: platformLabel });
    const getKeyLink = getKeyUrl
      ? `<span class="get-key-wrap">
          <a class="get-key-link" data-affiliate="${preset.affiliateLink ? 'true' : 'false'}" href="${esc(getKeyUrl)}" target="_blank" rel="noopener noreferrer"${preset.affiliateLink ? ` aria-describedby="getKeyDisclosure" aria-label="${esc(getKeyLabel)}"` : ` title="${esc(getKeyLabel)}"`}>Get Key</a>
          ${preset.affiliateLink ? `<span class="get-key-disclosure" id="getKeyDisclosure" role="tooltip">${esc(affiliateDisclosure)}</span>` : ''}
        </span>`
      : '';
    const card = document.createElement('article');
    card.className = 'platform-card';
    card.dataset.id = platform.id;
    card.innerHTML = `
      <div class="platform-title">
        <span class="platform-index">${esc(platformDisplayName(platform).slice(0, 1) || 'P')}</span>
        <input data-field="name" value="${esc(platformDisplayName(platform))}" aria-label="${esc(ui('平台名称'))}" />
        <span class="preset-chip">${esc(presetLabel(platform.preset))}</span>
        <button class="btn mini danger remove-platform" type="button">${esc(ui('删除平台'))}</button>
      </div>
      <div class="platform-grid">
        <label>Base URL<input data-field="baseUrl" list="builtinBaseUrls" value="${esc(platform.baseUrl)}" placeholder="${esc(ui('选择内置接口或输入 {url}', { url: 'https://api.example.com/v1' }))}" /></label>
        <div class="key-field">
          <div class="key-field-label"><span>API Key</span>${getKeyLink}</div>
          <span><input data-field="apiKey" type="password" value="${esc(platform.apiKey)}" placeholder="sk-..." aria-label="API Key"/><button class="btn mini key-toggle" type="button">${esc(ui('显示'))}</button></span>
        </div>
      </div>
      <div class="platform-actions">
        <button class="btn fetch-models" type="button">${esc(ui('自动获取模型'))}</button>
        <input class="manual-model" placeholder="${esc(ui('手动输入模型名称'))}" />
        <button class="btn add-model" type="button">${esc(ui('添加'))}</button>
        <span class="platform-status">${esc(platformStatus.get(platform.id) || '')}</span>
      </div>
      <div class="model-head">
        <span>${esc(ui('模型名称与启用能力'))}</span>
        <label class="model-filter-toggle"><input class="show-disabled-models" type="checkbox" ${state.showDisabledModels ? 'checked' : ''}/> ${esc(ui('显示未启用模型'))}</label>
      </div>
      <div class="model-list">${modelRows(platform)}</div>`;
    bindPlatformCard(card, platform);
    detail.appendChild(card);
  }
  renderDefaults();
  localizeDocument(currentLanguage);
}

function addModel(platform, model) {
  const value = String(model || '').trim();
  if (!value || platform.models.includes(value)) return false;
  platform.models.push(value);
  platform.models.sort((a, b) => a.localeCompare(b));
  return true;
}

function bindPlatformCard(card, platform) {
  card.querySelectorAll('[data-field]').forEach((input) => {
    input.addEventListener('input', () => {
      platform[input.dataset.field] = input.value;
      if (input.dataset.field === 'name') renderPlatformNav();
    });
  });
  card.querySelector('[data-field="baseUrl"]').addEventListener('change', (e) => {
    const presetId = Object.keys(PRESETS).find((id) => id !== 'custom' && PRESETS[id].baseUrl === e.target.value);
    if (!presetId) {
      if (platform.preset !== 'custom') {
        platform.models = [];
        platform.visionModels = [];
        platform.imageModels = [];
        platform.imageEditModels = [];
      }
      platform.preset = 'custom';
      return renderPlatforms();
    }
    const preset = PRESETS[presetId];
    platform.preset = presetId;
    platform.name = preset.label;
    platform.models = [...new Set([
      ...(preset.visionModels || []),
      ...(preset.imageModels || []),
      ...(preset.disabledModels || [])
    ])];
    platform.visionModels = [...(preset.visionModels || [])];
    platform.imageModels = [...(preset.imageModels || [])];
    platform.imageEditModels = [...(preset.imageEditModels || [])];
    renderPlatforms();
  });
  card.querySelector('.show-disabled-models').addEventListener('change', (e) => {
    state.showDisabledModels = e.target.checked;
    renderPlatforms();
  });
  card.querySelector('.key-toggle').addEventListener('click', (e) => {
    const input = card.querySelector('[data-field="apiKey"]');
    input.type = input.type === 'password' ? 'text' : 'password';
    e.currentTarget.textContent = ui(input.type === 'password' ? '显示' : '隐藏');
  });
  card.querySelector('.fetch-models').addEventListener('click', async (e) => {
    if (!platform.baseUrl || (!platform.apiKey && platform.preset !== 'apimart')) {
      showToast(ui('请先填写 Base URL 和 API Key'));
      return;
    }
    e.currentTarget.disabled = true;
    platformStatus.set(platform.id, ui('正在获取…'));
    e.currentTarget.textContent = ui('获取中…');
    try {
      const resp = await chrome.runtime.sendMessage({
        type: 'ir.listModels', payload: {
          cfg: { preset: platform.preset, baseUrl: platform.baseUrl, apiKey: platform.apiKey }
        }
      });
      if (!resp?.ok) throw new Error(resp?.error || ui('获取失败'));
      let added = 0;
      for (const model of resp.models || []) if (addModel(platform, model)) added += 1;
      if (platform.preset === 'openrouter' && Array.isArray(resp.imageEditModels)) {
        platform.imageEditModels = [...new Set(resp.imageEditModels.filter((model) => platform.models.includes(model)))];
      }
      platformStatus.set(platform.id, ui('已获取 {total} 个，新增 {added} 个', { total: resp.models?.length || 0, added }));
    } catch (error) {
      platformStatus.set(platform.id, ui('获取失败：{error}', { error: error?.message || error }));
    }
    renderPlatforms();
  });
  card.querySelector('.add-model').addEventListener('click', () => {
    const input = card.querySelector('.manual-model');
    if (addModel(platform, input.value)) renderPlatforms(); else showToast(ui('请输入新的模型名称'));
  });
  card.querySelector('.model-list').addEventListener('change', (e) => {
    const capability = e.target.dataset.capability;
    if (!capability) return;
    const model = e.target.closest('.model-row')?.dataset.model;
    const key = capability === 'vision' ? 'visionModels' : 'imageModels';
    platform[key] = e.target.checked
      ? [...new Set([...platform[key], model])]
      : platform[key].filter((item) => item !== model);
    renderPlatforms();
  });
  card.querySelector('.model-list').addEventListener('click', (e) => {
    if (!e.target.classList.contains('model-remove')) return;
    const model = e.target.closest('.model-row')?.dataset.model;
    platform.models = platform.models.filter((item) => item !== model);
    platform.visionModels = platform.visionModels.filter((item) => item !== model);
    platform.imageModels = platform.imageModels.filter((item) => item !== model);
    platform.imageEditModels = (platform.imageEditModels || []).filter((item) => item !== model);
    renderPlatforms();
  });
  card.querySelector('.remove-platform').addEventListener('click', (e) => {
    if (e.currentTarget.dataset.armed !== 'true') {
      e.currentTarget.dataset.armed = 'true';
      e.currentTarget.textContent = ui('再次点击删除');
      setTimeout(() => { if (e.currentTarget?.isConnected) { e.currentTarget.dataset.armed = ''; e.currentTarget.textContent = ui('删除平台'); } }, 1800);
      return;
    }
    state.platforms = state.platforms.filter((item) => item.id !== platform.id);
    activePlatformId = state.platforms[0]?.id || '';
    renderPlatforms();
  });
}

function choiceValue(choice) { return JSON.stringify([choice.platformId, choice.model]); }
function parseChoice(value) { try { const [platformId, model] = JSON.parse(value); return { platformId, model }; } catch { return { platformId: '', model: '' }; } }

function renderDefaultSelect(type) {
  const select = $(type === 'vision' ? 'defaultVision' : 'defaultImage');
  const choices = listModelChoices(state, type);
  const current = choiceValue(state.defaults[type] || {});
  select.innerHTML = choices.length
    ? choices.map((choice) => `<option value="${esc(choiceValue(choice))}"${choiceValue(choice) === current ? ' selected' : ''}>${esc(choice.label)}</option>`).join('')
    : `<option value="">${esc(ui('尚未启用模型'))}</option>`;
  select.disabled = !choices.length;
  if (choices.length && !choices.some((choice) => choiceValue(choice) === current)) {
    state.defaults[type] = { platformId: choices[0].platformId, model: choices[0].model };
    select.value = choiceValue(choices[0]);
  }
}

function renderDefaults() { renderDefaultSelect('vision'); renderDefaultSelect('image'); }

function collectSettings() {
  const sizeMap = {};
  for (const ratio of RATIOS) sizeMap[ratio] = $(sizeInputIds[ratio]).value.trim();
  return {
    presetRevision: state.presetRevision,
    language: $('interfaceLanguage').value,
    platforms: state.platforms,
    defaults: state.defaults,
    showDisabledModels: state.showDisabledModels,
    sizeMap,
    defaultRatio: $('defaultRatio').value,
    imageQuality: $('imageQuality').value,
    imageResolution: $('imageResolution').value
  };
}

function applySettingsToForm(settings) {
  state = settings;
  $('interfaceLanguage').value = state.language || 'auto';
  currentLanguage = resolveLanguage(state.language);
  activePlatformId = state.platforms[0]?.id || '';
  for (const ratio of RATIOS) $(sizeInputIds[ratio]).value = state.sizeMap?.[ratio] || '';
  $('defaultRatio').value = state.defaultRatio || '1:1';
  $('imageQuality').value = state.imageQuality || 'low';
  $('imageResolution').value = state.imageResolution || '1k';
  renderPlatforms();
  localizeDocument(currentLanguage);
}

function settingsExportName() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `pai-tong-kuan-settings-${stamp}.json`;
}

function downloadSettingsFile(settings) {
  const payload = {
    format: 'pai-tong-kuan-settings',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = settingsExportName();
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function importedSettingsFrom(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(ui('配置文件格式无效'));
  }
  if (value.format && value.format !== 'pai-tong-kuan-settings') {
    throw new Error(ui('不是拍同款配置文件'));
  }
  const imported = value.settings && typeof value.settings === 'object' ? value.settings : value;
  if (!Array.isArray(imported.platforms) || !imported.defaults || typeof imported.defaults !== 'object') {
    throw new Error(ui('配置文件缺少平台或默认模型信息'));
  }
  return imported;
}

$('defaultVision').addEventListener('change', (e) => { state.defaults.vision = parseChoice(e.target.value); });
$('defaultImage').addEventListener('change', (e) => { state.defaults.image = parseChoice(e.target.value); });
$('interfaceLanguage').addEventListener('change', (e) => {
  state.language = e.target.value;
  currentLanguage = resolveLanguage(state.language);
  renderPlatforms();
  localizeDocument(currentLanguage);
});
$('btnAddPlatform').addEventListener('click', () => {
  const presetId = $('addPlatformPreset').value;
  const platform = presetId === 'custom' ? newPlatform() : newPresetPlatform(presetId);
  state.platforms.push(platform);
  activePlatformId = platform.id;
  renderPlatforms();
});
$('btnSave').addEventListener('click', async () => {
  try {
    await saveSettings(collectSettings());
    $('savedTag').hidden = false;
    setTimeout(() => ($('savedTag').hidden = true), 2000);
  } catch (error) {
    showToast(error?.message || String(error));
  }
});
$('btnExportSettings').addEventListener('click', () => {
  downloadSettingsFile(collectSettings());
  showToast(ui('配置已导出，请妥善保管其中的 API Key'));
});
$('btnImportSettings').addEventListener('click', () => $('settingsImportFile').click());
$('settingsImportFile').addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showToast(ui('导入失败：{error}', { error: ui('配置文件过大') }));
    return;
  }
  try {
    const imported = importedSettingsFrom(JSON.parse(await file.text()));
    if (!window.confirm(ui('导入配置将覆盖当前设置，是否继续？'))) return;
    await saveSettings(imported);
    applySettingsToForm(await loadSettings());
    showToast(ui('配置导入成功'));
  } catch (error) {
    const message = error instanceof SyntaxError ? ui('配置文件不是有效的 JSON') : (error?.message || String(error));
    showToast(ui('导入失败：{error}', { error: message }));
  }
});
$('btnAlbum').addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL('album/album.html') }));

(async function init() {
  const presetOptions = Object.entries(PRESETS).filter(([id]) => id !== 'custom');
  $('addPlatformPreset').insertAdjacentHTML('beforeend', presetOptions.map(([id, preset]) =>
    `<option value="${esc(id)}">${esc(preset.label)}</option>`).join(''));
  $('builtinBaseUrls').innerHTML = presetOptions.map(([, preset]) =>
    `<option value="${esc(preset.baseUrl)}">${esc(preset.label)}</option>`).join('');
  applySettingsToForm(await loadSettings());
})();
