// 相册页：历史生成图片的浏览、搜索、批量下载（ZIP）、批量删除、灯箱详情

import {
  addCharacterFromAlbumUnique,
  countAll,
  getAllRecordIds,
  getById,
  getCharacterByAlbumRecordId,
  getPage,
  getRecordsByIds,
  getSourceBlob,
  removeMany
} from '../lib/db.js';
import { detectImageFileType, normalizeImageMime } from '../lib/image-file.js';
import { buildZip, blobToU8, writeZipStream } from '../lib/zip.js';
import { scopedSessionKey } from '../lib/task-state.js';
import { paginationItems } from '../lib/pagination.js';
import { explanationLabel, localizeDocument, resolveLanguage, t } from '../lib/i18n.js';
import { loadSettings } from '../lib/settings.js';

const $ = (id) => document.getElementById(id);

const els = {
  grid: $('grid'),
  empty: $('empty'),
  emptyTitle: $('emptyTitle'),
  emptyDesc: $('emptyDesc'),
  countTag: $('countTag'),
  searchInput: $('searchInput'),
  btnDownloadAll: $('btnDownloadAll'),
  downloadProgress: $('downloadProgress'),
  downloadProgressText: $('downloadProgressText'),
  downloadProgressPercent: $('downloadProgressPercent'),
  downloadProgressBar: $('downloadProgressBar'),
  btnCancelDownload: $('btnCancelDownload'),
  btnSelectAll: $('btnSelectAll'),
  btnDownloadSel: $('btnDownloadSel'),
  btnDeleteSel: $('btnDeleteSel'),
  btnOptions: $('btnOptions'),
  pager: $('pager'),
  btnPrevPage: $('btnPrevPage'),
  btnNextPage: $('btnNextPage'),
  pageNumbers: $('pageNumbers'),
  pageInfo: $('pageInfo'),
  selBar: $('selBar'),
  selCount: $('selCount'),
  lightbox: $('lightbox'),
  lbBackdrop: $('lbBackdrop'),
  lbClose: $('lbClose'),
  lbImgBox: $('lbImgBox'),
  lbCompareStage: $('lbCompareStage'),
  lbImg: $('lbImg'),
  lbSourceImg: $('lbSourceImg'),
  lbCompareSource: $('lbCompareSource'),
  lbCompareDivider: $('lbCompareDivider'),
  lbResultLabel: $('lbResultLabel'),
  lbCompareToggle: $('lbCompareToggle'),
  lbAddCharacter: $('lbAddCharacter'),
  lbPrev: $('lbPrev'),
  lbNext: $('lbNext'),
  lbPrompt: $('lbPrompt'),
  lbCopy: $('lbCopy'),
  lbPromptZhBox: $('lbPromptZhBox'),
  lbPromptZh: $('lbPromptZh'),
  lbProvider: $('lbProvider'),
  lbModel: $('lbModel'),
  lbSize: $('lbSize'),
  lbRatio: $('lbRatio'),
  lbTime: $('lbTime'),
  lbSrcRow: $('lbSrcRow'),
  lbSrc: $('lbSrc'),
  lbPageRow: $('lbPageRow'),
  lbPage: $('lbPage'),
  lbDownload: $('lbDownload'),
  lbDelete: $('lbDelete'),
  lbRegenerate: $('lbRegenerate'),
  lbReplace: $('lbReplace'),
  lbGenerateGroup: $('lbGenerateGroup'),
  lbGroupCount: $('lbGroupCount'),
  confirmDialog: $('confirmDialog'),
  confirmBackdrop: $('confirmBackdrop'),
  confirmMessage: $('confirmMessage'),
  confirmCancel: $('confirmCancel'),
  confirmAccept: $('confirmAccept'),
  toast: $('toast')
};

let records = [];        // 全部记录
let filtered = [];       // 搜索过滤后
const selected = new Set();
const objectUrls = new Map(); // id -> objectURL
const sourceObjectUrls = new Map(); // id -> 原图 objectURL
let currentLbId = null;
let toastTimer = 0;
let comparisonReady = false;
let comparisonEnabled = false;
let characterButtonSeq = 0;
let confirmResolver = null;
let confirmReturnFocus = null;
const PAGE_SIZE = 48;
const ZIP_BATCH_SIZE = 20;
const STREAM_READ_BATCH_SIZE = 8;
let pageOffset = 0;
let hasMore = false;
let totalRecords = 0;
let totalAlbumRecords = 0;
let downloadingAll = false;
let downloadController = null;
let downloadProgressTimer = 0;
let albumWindowId = null;
let searchTimer = 0;
let pageLoadSeq = 0;
let currentLanguage = 'zh';
const ui = (key, vars = {}) => t(key, vars, currentLanguage);

function recordExplanationVisible(rec) {
  const language = rec.explanationLanguage || (rec.promptZh ? 'zh' : '');
  return currentLanguage !== 'en' && language === currentLanguage && Boolean(rec.promptZh);
}

function showToast(text) {
  els.toast.textContent = text;
  els.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (els.toast.hidden = true), 2400);
}

function requestDeleteConfirmation(message) {
  if (confirmResolver) confirmResolver(false);
  confirmReturnFocus = document.activeElement;
  els.confirmMessage.textContent = message;
  els.confirmDialog.hidden = false;
  queueMicrotask(() => els.confirmCancel.focus());
  return new Promise((resolve) => {
    confirmResolver = resolve;
  });
}

function closeDeleteConfirmation(accepted) {
  if (els.confirmDialog.hidden) return;
  els.confirmDialog.hidden = true;
  const resolve = confirmResolver;
  confirmResolver = null;
  resolve?.(accepted);
  if (confirmReturnFocus?.isConnected) confirmReturnFocus.focus();
  confirmReturnFocus = null;
}

function fmtTime(ts) {
  const locale = { zh: 'zh-CN', en: 'en-US', ja: 'ja-JP', ko: 'ko-KR' }[currentLanguage];
  return new Date(ts).toLocaleString(locale, { hour12: false });
}

function fileNameOf(rec, idx, ext = 'png') {
  const d = new Date(rec.createdAt);
  const pad = (n) => String(n).padStart(2, '0');
  const stamp =
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  const suffix = idx > 0 ? `_${idx + 1}` : '';
  return `拍同款_${stamp}${suffix}.${ext}`;
}

function urlOf(rec) {
  if (!objectUrls.has(rec.id)) {
    objectUrls.set(rec.id, URL.createObjectURL(rec.blob));
  }
  return objectUrls.get(rec.id);
}

async function sourceUrlOf(rec) {
  const sourceBlob = await getSourceBlob(rec);
  if (sourceBlob) {
    if (!sourceObjectUrls.has(rec.id)) {
      sourceObjectUrls.set(rec.id, URL.createObjectURL(sourceBlob));
    }
    return sourceObjectUrls.get(rec.id);
  }
  if (rec.srcUrl && !rec.srcUrl.startsWith('blob:')) return rec.srcUrl;
  return '';
}

function revokePageUrls() {
  for (const url of objectUrls.values()) URL.revokeObjectURL(url);
  for (const url of sourceObjectUrls.values()) URL.revokeObjectURL(url);
  objectUrls.clear();
  sourceObjectUrls.clear();
}

// ---------- 渲染 ----------

function applyFilter() {
  filtered = records;
  renderGrid();
}

function renderGrid() {
  els.grid.innerHTML = '';
  els.empty.hidden = filtered.length > 0;
  if (!filtered.length) {
    const isSearchEmpty = Boolean(els.searchInput.value.trim());
    els.emptyTitle.textContent = t(isSearchEmpty ? '未找到匹配作品' : '相册还是空的', {}, currentLanguage);
    els.emptyDesc.textContent = isSearchEmpty
      ? t('可以尝试搜索其他提示词、中文解读、模型或平台名称。', {}, currentLanguage)
      : t('在网页图片上悬停并点击魔法按钮，生成同款图片后会自动保存到这里。', {}, currentLanguage);
  }
  els.countTag.textContent = totalRecords ? t('共 {count} 张', { count: totalRecords }, currentLanguage) : '';

  for (const rec of filtered) {
    const card = document.createElement('div');
    card.className = 'card' + (selected.has(rec.id) ? ' selected' : '');
    card.dataset.id = rec.id;

    const img = document.createElement('img');
    img.className = 'thumb';
    img.loading = 'lazy';
    img.src = urlOf(rec);
    img.alt = rec.prompt || '';

    const check = document.createElement('div');
    check.className = 'check';
    check.textContent = '✓';
    check.title = t('选择', {}, currentLanguage);
    check.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSelect(rec.id, card);
    });

    const tag = document.createElement('div');
    tag.className = 'ratio-tag';
    tag.textContent = rec.kind === 'group-item'
      ? t('组图 {index}/{count}', { index: rec.groupIndex, count: rec.groupCount }, currentLanguage)
      : (rec.ratio || '');

    const foot = document.createElement('div');
    foot.className = 'foot';
    const p = document.createElement('div');
    p.className = 'p';
    p.textContent = rec.prompt || t('(无提示词)', {}, currentLanguage);
    p.title = rec.prompt || '';
    const zh = recordExplanationVisible(rec) ? document.createElement('div') : null;
    if (zh) {
      zh.className = 'zh';
      zh.textContent = rec.promptZh;
      zh.title = rec.promptZh;
    }
    const m = document.createElement('div');
    m.className = 'm';
    m.textContent = `${fmtTime(rec.createdAt)} · ${rec.model || ''}`;
    foot.append(p);
    if (zh) foot.append(zh);
    foot.append(m);

    card.append(img, check, tag, foot);
    card.addEventListener('click', () => openLightbox(rec.id));
    els.grid.appendChild(card);
  }
  updateSelUI();
  updatePager();
}

function updatePager() {
  const page = Math.floor(pageOffset / PAGE_SIZE) + 1;
  const totalPages = Math.ceil(totalRecords / PAGE_SIZE);
  els.pager.hidden = totalPages <= 1;
  els.btnPrevPage.disabled = page <= 1;
  els.btnNextPage.disabled = page >= totalPages;
  els.pageInfo.textContent = t(
    els.searchInput.value.trim() ? '搜索结果，第 {page} 页，共 {total} 页' : '第 {page} 页，共 {total} 页',
    { page, total: totalPages }, currentLanguage
  );
  els.pageNumbers.replaceChildren();
  const maxItems = window.innerWidth <= 520 ? 5 : 7;
  paginationItems(page, totalPages, maxItems).forEach((item, index) => {
    if (item === 'ellipsis') {
      const ellipsis = document.createElement('span');
      ellipsis.className = 'page-ellipsis';
      ellipsis.textContent = '…';
      ellipsis.setAttribute('aria-hidden', 'true');
      ellipsis.dataset.position = String(index);
      els.pageNumbers.appendChild(ellipsis);
      return;
    }
    const button = document.createElement('button');
    button.className = 'page-number';
    button.type = 'button';
    button.textContent = String(item);
    button.dataset.page = String(item);
    button.setAttribute('aria-label', t('第 {page} 页，共 {total} 页', { page: item, total: totalPages }, currentLanguage));
    if (item === page) button.setAttribute('aria-current', 'page');
    els.pageNumbers.appendChild(button);
  });
}

function toggleSelect(id, cardEl) {
  if (selected.has(id)) selected.delete(id);
  else selected.add(id);
  cardEl?.classList.toggle('selected', selected.has(id));
  updateSelUI();
}

function updateSelUI() {
  const n = selected.size;
  els.selBar.hidden = n === 0;
  els.selCount.textContent = n;
  els.btnSelectAll.disabled = downloadingAll;
  els.btnDownloadSel.disabled = downloadingAll || n === 0;
  els.btnDeleteSel.disabled = downloadingAll || n === 0;
  els.btnDownloadAll.disabled = downloadingAll || totalAlbumRecords === 0;
  els.btnDownloadAll.textContent = downloadingAll
    ? t('正在打包…', {}, currentLanguage)
    : t('下载整个相册（共 {count} 张）', { count: totalAlbumRecords }, currentLanguage);
  const visibleIds = filtered.map((r) => r.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  els.btnSelectAll.textContent = t(allSelected ? '取消全选' : '全选', {}, currentLanguage);
}

// ---------- 灯箱 ----------

function setIconButtonHint(button, key, { disabled = button.disabled, state } = {}) {
  const label = t(key, {}, currentLanguage);
  button.disabled = disabled;
  button.setAttribute('aria-label', label);
  button.dataset.tooltip = label;
  if (state) button.dataset.state = state;
}

function openLightbox(id) {
  const rec = records.find((r) => r.id === id);
  if (!rec) return;
  currentLbId = id;
  els.lbImg.src = urlOf(rec);
  void setupComparison(rec).catch(() => {
    if (currentLbId !== rec.id) return;
    setIconButtonHint(els.lbCompareToggle, '无法对比', { disabled: true });
  });
  void updateAddCharacterButton(rec.id);
  updateLightboxNav();
  els.lbPrompt.textContent = rec.prompt || t('(无提示词)', {}, currentLanguage);

  const showZh = recordExplanationVisible(rec);
  els.lbPromptZhBox.hidden = !showZh;
  if (showZh) {
    els.lbPromptZh.textContent = rec.promptZh;
    els.lbPromptZhBox.querySelector('.lb-label.small').textContent = explanationLabel(currentLanguage);
  }

  els.lbProvider.textContent = rec.provider || '-';
  els.lbModel.textContent = rec.model || '-';
  els.lbSize.textContent = rec.width && rec.height
    ? t('{width} × {height} 像素', { width: rec.width, height: rec.height }, currentLanguage)
    : '-';
  els.lbRatio.textContent = rec.ratio || '-';
  els.lbTime.textContent = fmtTime(rec.createdAt);
  els.lbSrcRow.hidden = !rec.srcUrl;
  if (rec.srcUrl) els.lbSrc.href = rec.srcUrl;
  els.lbPageRow.hidden = !rec.pageUrl;
  if (rec.pageUrl) {
    els.lbPage.href = rec.pageUrl;
    els.lbPage.textContent = rec.pageUrl.length > 60 ? rec.pageUrl.slice(0, 60) + '…' : rec.pageUrl;
  }

  els.lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
}

async function updateAddCharacterButton(recordId) {
  const requestSeq = ++characterButtonSeq;
  setIconButtonHint(els.lbAddCharacter, '添加到角色库', { disabled: false, state: 'default' });
  try {
    const existing = await getCharacterByAlbumRecordId(recordId);
    if (currentLbId !== recordId || requestSeq !== characterButtonSeq) return;
    if (existing) {
      setIconButtonHint(els.lbAddCharacter, '已在角色库', { disabled: true, state: 'success' });
    }
  } catch {
    // 查询状态失败不阻塞灯箱浏览，点击时仍会再次校验。
  }
}

function characterNameOf(rec) {
  const description = String(rec.promptZh || rec.prompt || '').replace(/\s+/g, ' ').trim();
  return description ? description.slice(0, 24) : `相册素材 ${fmtTime(rec.createdAt)}`;
}

async function addCurrentImageToCharacters() {
  const rec = records.find((item) => item.id === currentLbId);
  if (!rec) return;
  const requestSeq = ++characterButtonSeq;
  setIconButtonHint(els.lbAddCharacter, '正在添加到角色库…', { disabled: true, state: 'loading' });
  try {
    const existing = await getCharacterByAlbumRecordId(rec.id);
    if (existing) {
      if (currentLbId === rec.id && requestSeq === characterButtonSeq) {
        setIconButtonHint(els.lbAddCharacter, '已在角色库', { disabled: true, state: 'success' });
      }
      showToast(t('这张图片已经在角色与物品库中', {}, currentLanguage));
      return;
    }
    const inserted = await addCharacterFromAlbumUnique({
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      name: characterNameOf(rec),
      blob: rec.blob,
      albumRecordId: rec.id,
      prompt: rec.prompt || '',
      sourcePrompt: rec.sourcePrompt || '',
      promptZh: rec.promptZh || '',
      explanationLanguage: rec.explanationLanguage || (rec.promptZh ? 'zh' : ''),
      provider: rec.provider || '',
      model: rec.model || '',
      width: rec.width,
      height: rec.height,
      ratio: rec.ratio || ''
    });
    if (!inserted.created) {
      if (currentLbId === rec.id && requestSeq === characterButtonSeq) {
        setIconButtonHint(els.lbAddCharacter, '已在角色库', { disabled: true, state: 'success' });
      }
      showToast(t('这张图片已经在角色与物品库中', {}, currentLanguage));
      return;
    }
    if (currentLbId === rec.id && requestSeq === characterButtonSeq) {
      setIconButtonHint(els.lbAddCharacter, '已在角色库', { disabled: true, state: 'success' });
    }
    showToast(t('已添加到角色与物品库', {}, currentLanguage));
  } catch (error) {
    if (currentLbId === rec.id && requestSeq === characterButtonSeq) {
      setIconButtonHint(els.lbAddCharacter, '添加到角色库', { disabled: false, state: 'default' });
    }
    throw error;
  }
}

async function setupComparison(rec) {
  comparisonReady = false;
  comparisonEnabled = false;
  els.lbCompareStage.style.setProperty('--split', '50%');
  els.lbCompareStage.classList.remove('can-compare');
  els.lbCompareSource.hidden = true;
  els.lbCompareDivider.hidden = true;
  els.lbResultLabel.hidden = true;
  els.lbCompareToggle.classList.remove('active');
  els.lbCompareToggle.setAttribute('aria-pressed', 'false');
  setIconButtonHint(els.lbCompareToggle, '准备对比…', { disabled: true });
  els.lbSourceImg.removeAttribute('src');

  const sourceUrl = await sourceUrlOf(rec);
  if (currentLbId !== rec.id) return;
  if (!sourceUrl) {
    setIconButtonHint(els.lbCompareToggle, '无原图', { disabled: true });
    return;
  }
  const expectedId = rec.id;
  els.lbSourceImg.onload = () => {
    if (currentLbId !== expectedId) return;
    comparisonReady = true;
    setIconButtonHint(els.lbCompareToggle, '开启对比', { disabled: false });
  };
  els.lbSourceImg.onerror = () => {
    if (currentLbId !== expectedId) return;
    comparisonReady = false;
    setComparisonEnabled(false);
    setIconButtonHint(els.lbCompareToggle, '无法对比', { disabled: true });
  };
  els.lbSourceImg.src = sourceUrl;
}

function setComparisonEnabled(enabled) {
  comparisonEnabled = Boolean(enabled && comparisonReady);
  els.lbCompareSource.hidden = !comparisonEnabled;
  els.lbCompareDivider.hidden = !comparisonEnabled;
  els.lbResultLabel.hidden = !comparisonEnabled;
  els.lbCompareStage.classList.toggle('can-compare', comparisonEnabled);
  els.lbCompareToggle.classList.toggle('active', comparisonEnabled);
  els.lbCompareToggle.setAttribute('aria-pressed', String(comparisonEnabled));
  if (comparisonReady) {
    setIconButtonHint(els.lbCompareToggle, comparisonEnabled ? '关闭对比' : '开启对比', { disabled: false });
  }
}

function updateLightboxNav() {
  const index = filtered.findIndex((r) => r.id === currentLbId);
  els.lbPrev.disabled = index <= 0;
  els.lbNext.disabled = index < 0 || index >= filtered.length - 1;
}

function navigateLightbox(delta) {
  const index = filtered.findIndex((r) => r.id === currentLbId);
  const target = filtered[index + delta];
  if (target) openLightbox(target.id);
}

function closeLightbox() {
  els.lightbox.hidden = true;
  document.body.style.overflow = '';
  currentLbId = null;
}

// ---------- 下载 ----------

function downloadBlob(blob, name, revokeDelay = 10000) {
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), revokeDelay);
}

async function downloadRecords(list) {
  if (!list.length) return;
  if (list.length === 1) {
    const { ext } = await detectImageFileType(list[0].blob);
    downloadBlob(await normalizeImageMime(list[0].blob), fileNameOf(list[0], 0, ext));
    return;
  }
  showToast(ui('正在打包 {count} 张图片…', { count: list.length }));
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stem = `拍同款相册_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  const batchCount = Math.ceil(list.length / ZIP_BATCH_SIZE);
  if (batchCount > 1) showToast(ui('为降低内存占用，将下载 {count} 个 ZIP 分包；请允许多文件下载', { count: batchCount }));
  for (let start = 0; start < list.length; start += ZIP_BATCH_SIZE) {
    const batch = list.slice(start, start + ZIP_BATCH_SIZE);
    const usedNames = new Set();
    const entries = [];
    for (const rec of batch) {
      const { ext } = await detectImageFileType(rec.blob);
      let name = fileNameOf(rec, 0, ext);
      let i = 1;
      while (usedNames.has(name)) name = fileNameOf(rec, i++, ext);
      usedNames.add(name);
      entries.push({ name, data: await blobToU8(rec.blob) });
    }
    const part = Math.floor(start / ZIP_BATCH_SIZE) + 1;
    const suffix = batchCount > 1 ? `_第${part}部分_共${batchCount}部分` : '';
    downloadBlob(buildZip(entries), `${stem}${suffix}.zip`, 2000);
    if (part < batchCount) await new Promise((resolve) => setTimeout(resolve, 2200));
  }
}

function albumZipFileName() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `拍同款相册_${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}.zip`;
}

function updateDownloadProgress(completed, total, key = '正在打包第 {current}/{total} 张图片…') {
  const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  els.downloadProgress.hidden = false;
  els.downloadProgressText.textContent = ui(key, { current: completed, total });
  els.downloadProgressPercent.textContent = `${percent}%`;
  els.downloadProgressBar.style.width = `${percent}%`;
}

function hideDownloadProgress(delay = 0) {
  clearTimeout(downloadProgressTimer);
  downloadProgressTimer = setTimeout(() => {
    if (!downloadingAll) els.downloadProgress.hidden = true;
  }, delay);
}

function downloadErrorMessage(error) {
  const message = error?.message || String(error);
  return [
    'ZIP 文件超过 4GB，请减少相册图片后重试',
    'ZIP 文件数量超过 65535 个'
  ].includes(message) ? ui(message) : message;
}

async function* albumZipEntries(recordIds, signal) {
  const usedNames = new Set();
  for (let start = 0; start < recordIds.length; start += STREAM_READ_BATCH_SIZE) {
    if (signal.aborted) throw new DOMException('Download cancelled', 'AbortError');
    const batch = await getRecordsByIds(recordIds.slice(start, start + STREAM_READ_BATCH_SIZE));
    if (!batch.length) throw new Error(ui('读取相册图片失败'));
    for (const rec of batch) {
      if (signal.aborted) throw new DOMException('Download cancelled', 'AbortError');
      const { ext } = await detectImageFileType(rec.blob);
      let name = fileNameOf(rec, 0, ext);
      let duplicateIndex = 1;
      while (usedNames.has(name)) name = fileNameOf(rec, duplicateIndex++, ext);
      usedNames.add(name);
      yield { name, blob: rec.blob, date: new Date(rec.createdAt) };
    }
  }
}

async function downloadAllFallback(recordIds, fileName, signal) {
  const total = recordIds.length;
  const batchCount = Math.ceil(total / ZIP_BATCH_SIZE);
  if (batchCount > 1) {
    showToast(ui('为降低内存占用，将下载 {count} 个 ZIP 分包；请允许多文件下载', { count: batchCount }));
  }
  const stem = fileName.replace(/\.zip$/i, '');
  let completed = 0;
  for (let part = 0; part < batchCount; part += 1) {
    if (signal.aborted) throw new DOMException('Download cancelled', 'AbortError');
    const start = part * ZIP_BATCH_SIZE;
    const batch = await getRecordsByIds(recordIds.slice(start, start + ZIP_BATCH_SIZE));
    if (!batch.length) throw new Error(ui('读取相册图片失败'));
    const usedNames = new Set();
    const entries = [];
    for (const rec of batch) {
      if (signal.aborted) throw new DOMException('Download cancelled', 'AbortError');
      const { ext } = await detectImageFileType(rec.blob);
      let name = fileNameOf(rec, 0, ext);
      let duplicateIndex = 1;
      while (usedNames.has(name)) name = fileNameOf(rec, duplicateIndex++, ext);
      usedNames.add(name);
      entries.push({ name, data: await blobToU8(rec.blob) });
      completed += 1;
      updateDownloadProgress(completed, total);
    }
    const suffix = batchCount > 1 ? `_第${part + 1}部分_共${batchCount}部分` : '';
    downloadBlob(buildZip(entries), `${stem}${suffix}.zip`, 2000);
    if (part + 1 < batchCount) await new Promise((resolve) => setTimeout(resolve, 2200));
  }
}

async function downloadAllRecords({ fileHandlePromise = null, fileName }) {
  const signal = downloadController.signal;
  let writable = null;
  try {
    const recordIds = await getAllRecordIds();
    const total = recordIds.length;
    if (!total) throw new Error(ui('相册中没有可下载的图片'));
    totalAlbumRecords = total;
    updateDownloadProgress(0, total, '正在准备 {total} 张图片…');

    if (fileHandlePromise) {
      const fileHandle = await fileHandlePromise;
      if (signal.aborted) throw new DOMException('Download cancelled', 'AbortError');
      writable = await fileHandle.createWritable();
      await writeZipStream(albumZipEntries(recordIds, signal), writable, {
        signal,
        total,
        onProgress: ({ completed }) => updateDownloadProgress(completed, total)
      });
      await writable.close();
      writable = null;
    } else {
      await downloadAllFallback(recordIds, fileName, signal);
    }
    updateDownloadProgress(total, total, '已完成 {total} 张图片的打包');
    showToast(ui(fileHandlePromise ? '全部图片已保存到一个 ZIP 文件' : '全部图片已开始下载'));
    hideDownloadProgress(1600);
  } catch (error) {
    if (writable) await writable.abort().catch(() => {});
    if (error?.name === 'AbortError') {
      showToast(ui('已取消下载'));
      hideDownloadProgress(500);
    } else {
      showToast(ui('全部下载失败：{error}', { error: downloadErrorMessage(error) }));
      hideDownloadProgress(1800);
    }
  } finally {
    downloadingAll = false;
    downloadController = null;
    els.btnCancelDownload.disabled = false;
    els.btnCancelDownload.textContent = ui('取消下载');
    updateSelUI();
  }
}

function startDownloadAll() {
  if (downloadingAll) return;
  if (!totalAlbumRecords) {
    showToast(ui('相册中没有可下载的图片'));
    return;
  }
  const fileName = albumZipFileName();
  let fileHandlePromise = null;
  if (typeof window.showSaveFilePicker === 'function') {
    // 文件选择器必须在用户点击事件的同步调用链中打开，否则浏览器会拒绝。
    try {
      fileHandlePromise = window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{ description: 'ZIP', accept: { 'application/zip': ['.zip'] } }]
      });
    } catch (error) {
      showToast(ui('无法打开保存窗口：{error}', { error: error?.message || String(error) }));
      return;
    }
  }
  downloadingAll = true;
  downloadController = new AbortController();
  els.btnCancelDownload.disabled = false;
  els.btnCancelDownload.textContent = ui('取消下载');
  updateSelUI();
  updateDownloadProgress(0, totalAlbumRecords, '请选择 ZIP 文件的保存位置…');
  void downloadAllRecords({ fileHandlePromise, fileName });
}

// ---------- 删除 ----------

async function deleteRecords(ids) {
  await removeMany(ids);
  for (const id of ids) {
    selected.delete(id);
    const url = objectUrls.get(id);
    if (url) { URL.revokeObjectURL(url); objectUrls.delete(id); }
    const sourceUrl = sourceObjectUrls.get(id);
    if (sourceUrl) { URL.revokeObjectURL(sourceUrl); sourceObjectUrls.delete(id); }
  }
  records = records.filter((r) => !ids.includes(r.id));
  [totalRecords, totalAlbumRecords] = await Promise.all([
    countAll(els.searchInput.value.trim()),
    countAll('')
  ]);
  if (!records.length && pageOffset > 0) {
    await loadPage(Math.max(0, pageOffset - PAGE_SIZE));
    return;
  }
  applyFilter();
}

// ---------- 事件 ----------

els.btnSelectAll.addEventListener('click', () => {
  const visibleIds = filtered.map((r) => r.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  if (allSelected) visibleIds.forEach((id) => selected.delete(id));
  else visibleIds.forEach((id) => selected.add(id));
  renderGrid();
});

els.btnDownloadSel.addEventListener('click', () => {
  const list = records.filter((r) => selected.has(r.id));
  downloadRecords(list);
});

els.btnDownloadAll.addEventListener('click', () => {
  startDownloadAll();
});

els.btnCancelDownload.addEventListener('click', () => {
  if (!downloadController || downloadController.signal.aborted) return;
  els.btnCancelDownload.disabled = true;
  els.btnCancelDownload.textContent = ui('正在取消…');
  els.downloadProgressText.textContent = ui('正在取消下载…');
  downloadController.abort();
});

els.btnDeleteSel.addEventListener('click', async () => {
  const n = selected.size;
  if (!n) return;
  if (!await requestDeleteConfirmation(ui('确定删除选中的 {count} 张图片吗？此操作不可恢复。', { count: n }))) return;
  await deleteRecords([...selected]);
  showToast(ui('已删除 {count} 张图片', { count: n }));
});

els.btnOptions.addEventListener('click', async () => {
  const resp = await chrome.runtime.sendMessage({ type: 'ir.openOptions' }).catch((e) => ({
    ok: false,
    error: e?.message || String(e)
  }));
  if (!resp?.ok) showToast(ui('打开设置失败：{error}', { error: resp?.error || ui('未知错误') }));
});

els.searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => void loadPage(0), 220);
});

els.btnPrevPage.addEventListener('click', () => {
  if (pageOffset > 0) void loadPage(Math.max(0, pageOffset - PAGE_SIZE));
});
els.btnNextPage.addEventListener('click', () => {
  if (hasMore) void loadPage(pageOffset + PAGE_SIZE);
});
els.pageNumbers.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-page]');
  if (!button || button.getAttribute('aria-current') === 'page') return;
  const page = Number(button.dataset.page);
  if (Number.isInteger(page) && page > 0) void loadPage((page - 1) * PAGE_SIZE);
});

let compactPager = window.innerWidth <= 520;
window.addEventListener('resize', () => {
  const nextCompact = window.innerWidth <= 520;
  if (nextCompact === compactPager) return;
  compactPager = nextCompact;
  updatePager();
});

els.lbClose.addEventListener('click', closeLightbox);
els.lbBackdrop.addEventListener('click', closeLightbox);
document.addEventListener('keydown', (e) => {
  if (!els.confirmDialog.hidden) {
    if (e.key === 'Escape') closeDeleteConfirmation(false);
    return;
  }
  if (els.lightbox.hidden) return;
  if (e.key === 'Escape') closeLightbox();
  else if (e.key === 'ArrowLeft') { e.preventDefault(); navigateLightbox(-1); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); navigateLightbox(1); }
});

els.lbPrev.addEventListener('click', () => navigateLightbox(-1));
els.lbNext.addEventListener('click', () => navigateLightbox(1));
els.lbCompareToggle.addEventListener('click', () => {
  if (comparisonReady) setComparisonEnabled(!comparisonEnabled);
});
els.lbAddCharacter.addEventListener('click', () => {
  void addCurrentImageToCharacters().catch((error) => {
    showToast(ui('添加到角色库失败：{error}', { error: error?.message || error }));
  });
});
els.lbImgBox.addEventListener('pointermove', (e) => {
  if (els.lbCompareSource.hidden) return;
  const rect = els.lbImgBox.getBoundingClientRect();
  const percent = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
  els.lbCompareStage.style.setProperty('--split', `${percent}%`);
});

els.lbCopy.addEventListener('click', async () => {
  const rec = records.find((r) => r.id === currentLbId);
  if (!rec) return;
  await navigator.clipboard.writeText(rec.prompt || '').catch(() => {});
  showToast(t('提示词已复制', {}, currentLanguage));
});

els.lbDownload.addEventListener('click', () => {
  const rec = records.find((r) => r.id === currentLbId);
  if (rec) downloadRecords([rec]);
});

els.lbDelete.addEventListener('click', async () => {
  const rec = records.find((r) => r.id === currentLbId);
  if (!rec) return;
  if (!await requestDeleteConfirmation(t('确定删除这张图片吗？此操作不可恢复。', {}, currentLanguage))) return;
  closeLightbox();
  await deleteRecords([rec.id]);
  showToast(t('已删除', {}, currentLanguage));
});

async function openPanelAction(action, extra = {}) {
  const rec = records.find((item) => item.id === currentLbId);
  if (!rec) return;
  const payload = { action, recordId: rec.id, ...extra, ts: Date.now() };
  if (albumWindowId == null) return showToast(ui('尚未取得当前窗口信息，请稍后重试'));
  const actionKey = scopedSessionKey('albumAction', albumWindowId);
  try {
    // 必须在点击事件的同步调用链内触发；经过 runtime.sendMessage 或任何 await 后
    // Chrome 会丢失 user gesture，导致 sidePanel.open() 被拒绝。
    const openPromise = chrome.sidePanel.open({ windowId: albumWindowId });
    const storePromise = chrome.storage.session.set({ [actionKey]: payload });
    await Promise.all([openPromise, storePromise]);
    showToast(ui(action === 'regenerate' ? '已在侧边栏开始生成' : '已发送到侧边栏处理'));
  } catch (error) {
    // 不支持 sidePanel 或浏览器拒绝打开时，退化为扩展弹窗；任务已直接写入会话存储。
    try {
      await chrome.storage.session.set({ [actionKey]: payload });
      await chrome.windows.create({
        url: chrome.runtime.getURL(`panel/panel.html?windowId=${albumWindowId}`),
        type: 'popup', width: 440, height: 740
      });
      showToast(ui('已在独立窗口中打开'));
    } catch (fallbackError) {
      showToast(ui('打开侧边栏失败：{error}', {
        error: fallbackError?.message || error?.message || ui('未知错误')
      }));
    }
  }
}

els.lbRegenerate.addEventListener('click', () => openPanelAction('regenerate'));
els.lbReplace.addEventListener('click', () => openPanelAction('replace'));
els.lbGenerateGroup.addEventListener('click', () => openPanelAction('group', { count: Number(els.lbGroupCount.value) }));

els.confirmCancel.addEventListener('click', () => closeDeleteConfirmation(false));
els.confirmAccept.addEventListener('click', () => closeDeleteConfirmation(true));
els.confirmBackdrop.addEventListener('click', () => closeDeleteConfirmation(false));

// ---------- 初始化 ----------

async function loadPage(offset = 0, requestedId = '') {
  const requestSeq = ++pageLoadSeq;
  const query = els.searchInput.value.trim();
  const [{ records: pageRecords, hasMore: nextPage }, total, albumTotal] = await Promise.all([
    getPage({ offset, limit: PAGE_SIZE, query }),
    countAll(query),
    countAll('')
  ]);
  if (requestSeq !== pageLoadSeq) return;
  let nextRecords = pageRecords;
  if (requestedId && !nextRecords.some((rec) => rec.id === requestedId)) {
    const requested = await getById(requestedId);
    if (requestSeq !== pageLoadSeq) return;
    if (requested) nextRecords = [requested, ...nextRecords];
  }
  closeLightbox();
  revokePageUrls();
  selected.clear();
  records = nextRecords;
  pageOffset = Math.max(0, offset);
  hasMore = nextPage;
  totalRecords = total;
  totalAlbumRecords = albumTotal;
  applyFilter();
  window.scrollTo({ top: 0, behavior: 'auto' });
  if (requestedId && records.some((rec) => rec.id === requestedId)) openLightbox(requestedId);
}

(async function init() {
  const settings = await loadSettings();
  currentLanguage = resolveLanguage(settings.language);
  localizeDocument(currentLanguage);
  const currentWindow = await chrome.windows.getCurrent();
  albumWindowId = currentWindow?.id;
  const requestedId = new URLSearchParams(location.search).get('open');
  await loadPage(0, requestedId || '');
})();

chrome.storage.local.onChanged.addListener((changes) => {
  if (!changes.settings) return;
  void loadSettings().then((settings) => {
    currentLanguage = resolveLanguage(settings.language);
    localizeDocument(currentLanguage);
    renderGrid();
    if (currentLbId) openLightbox(currentLbId);
  });
});

window.addEventListener('pagehide', () => {
  clearTimeout(searchTimer);
  clearTimeout(downloadProgressTimer);
  downloadController?.abort();
  revokePageUrls();
});
