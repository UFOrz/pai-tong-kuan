// 图片文件类型归一化：处理部分生图平台返回 application/octet-stream 的情况。

const MIME_TYPES = {
  'image/png': { mime: 'image/png', ext: 'png' },
  'image/jpeg': { mime: 'image/jpeg', ext: 'jpg' },
  'image/jpg': { mime: 'image/jpeg', ext: 'jpg' },
  'image/webp': { mime: 'image/webp', ext: 'webp' },
  'image/gif': { mime: 'image/gif', ext: 'gif' },
  'image/avif': { mime: 'image/avif', ext: 'avif' }
};

function ascii(bytes, start, length) {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

export function typeFromMime(mime) {
  return MIME_TYPES[String(mime || '').toLowerCase().split(';')[0].trim()] || null;
}

export async function detectImageFileType(blob) {
  const declared = typeFromMime(blob?.type);
  if (declared) return declared;
  const bytes = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
  if (bytes.length >= 8 && bytes[0] === 0x89 && ascii(bytes, 1, 3) === 'PNG') return MIME_TYPES['image/png'];
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return MIME_TYPES['image/jpeg'];
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') return MIME_TYPES['image/webp'];
  if (bytes.length >= 6 && (ascii(bytes, 0, 6) === 'GIF87a' || ascii(bytes, 0, 6) === 'GIF89a')) return MIME_TYPES['image/gif'];
  if (bytes.length >= 12 && ascii(bytes, 4, 4) === 'ftyp' && ['avif', 'avis'].includes(ascii(bytes, 8, 4))) return MIME_TYPES['image/avif'];
  return MIME_TYPES['image/png'];
}

export async function normalizeImageMime(blob) {
  const type = await detectImageFileType(blob);
  return blob.type === type.mime ? blob : new Blob([blob], { type: type.mime });
}
