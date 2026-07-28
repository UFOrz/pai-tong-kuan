// 面板任务的纯状态判断，独立于 DOM，便于覆盖任务生命周期回归。

export function sourceKey(source) {
  return source?.requestId || source?.sourceRequestId || source?.ts || source?.sourceTs || null;
}

export function shouldAutoReverse(source, becameReady) {
  return Boolean(becameReady && source?.needsReverse);
}

export function shouldRenderSurpriseSessionTask(
  task,
  { surpriseGenerating = false, lastAlbumRecordId = '' } = {}
) {
  if (!task?.active) return false;
  if (task.status === 'running') return !surpriseGenerating;
  if (task.status === 'failed') return surpriseGenerating;
  if (!task.prompt) return false;
  if (surpriseGenerating) return true;
  const incomingRecordId = task.albumRecordId || '';
  return Boolean(incomingRecordId && incomingRecordId !== lastAlbumRecordId);
}

const SESSION_PREFIX = 'ir.window';

export function normalizedWindowId(windowId) {
  if (windowId == null) return null;
  if (typeof windowId === 'string' && !windowId.trim()) return null;
  const value = Number(windowId);
  return Number.isInteger(value) && value >= 0 ? value : null;
}

export function scopedSessionKey(kind, windowId) {
  const id = normalizedWindowId(windowId);
  if (!kind || id == null) return '';
  return `${SESSION_PREFIX}.${id}.${kind}`;
}

export function belongsToWindowStorageKey(key, kind, windowId) {
  return key === scopedSessionKey(kind, windowId);
}

export function interruptedSessionPatch(key, value, now = Date.now()) {
  if (!value || typeof value !== 'object') return null;

  if (/^ir\.window\.\d+\.pendingSource$/.test(key) && value.status === 'loading') {
    const patch = {
      ...value,
      status: 'error',
      needsReverse: false,
      error: '图片读取因浏览器后台中断，请重新点击魔法按钮或重新截图',
      updatedAt: now
    };
    if (/^data:/i.test(String(patch.src || ''))) patch.src = '';
    if (/^data:/i.test(String(patch.previewUrl || ''))) delete patch.previewUrl;
    delete patch.dataUrl;
    return patch;
  }

  if (!/^ir\.window\.\d+\.(?:job|reverseJob|surpriseJob)$/.test(key) ||
      value.status !== 'running') {
    return null;
  }

  const isReverse = key.endsWith('.reverseJob');
  const isSurprise = key.endsWith('.surpriseJob');
  return {
    ...value,
    status: 'failed',
    finishedAt: now,
    updatedAt: now,
    error: isReverse
      ? '浏览器后台反推任务曾意外中断，请重新反推'
      : isSurprise
        ? '浏览器后台惊喜提示词任务曾意外中断，请重新生成'
        : '浏览器后台任务曾意外中断；已经生成的图片仍保留在相册中，请重新发起剩余任务'
  };
}

export function recoverInterruptedGenerationJobs(value, now = Date.now()) {
  if (!Array.isArray(value)) return null;
  let changed = false;
  const jobs = value.map((job) => {
    if (!job || typeof job !== 'object' || job.status !== 'running') return job;
    changed = true;
    return {
      ...job,
      status: 'failed',
      finishedAt: now,
      updatedAt: now,
      error: '浏览器后台生图任务曾意外中断；已经生成的图片仍保留在相册中，请重新发起任务'
    };
  });
  return changed ? jobs : null;
}
