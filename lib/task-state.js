// 面板任务的纯状态判断，独立于 DOM，便于覆盖任务生命周期回归。

export function sourceKey(source) {
  return source?.requestId || source?.sourceRequestId || source?.ts || source?.sourceTs || null;
}

export function shouldAutoReverse(source, becameReady) {
  return Boolean(becameReady && source?.needsReverse);
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
