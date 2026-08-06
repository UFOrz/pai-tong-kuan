// EchoShot 下载图片元数据：PNG 使用 iTXt，JPEG/WebP 使用 XMP。
// 只在下载副本中写入，不修改相册保存的原始 Blob。

export const ECHOSHOT_METADATA_SCHEMA = 'echoshot/1';

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: false });
const MAX_IMAGE_BYTES = 128 * 1024 * 1024;
const MAX_METADATA_BYTES = 256 * 1024;
const MAX_PROMPT_BYTES = 12 * 1024;
const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const XMP_HEADER = 'http://ns.adobe.com/xap/1.0/\0';
const XMP_NAMESPACE = 'https://github.com/UFOrz/EchoShot/ns/1.0/';
const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const AVIF_ECHOSHOT_UUID = new Uint8Array([
  0x83, 0x6f, 0xa6, 0x20, 0x37, 0x42, 0x4e, 0x3b,
  0x91, 0x8a, 0xe0, 0x12, 0x17, 0x27, 0x2a, 0xa1
]);

function concatBytes(parts) {
  const length = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
}

function ascii(bytes, offset, length) {
  let output = '';
  for (let index = offset; index < offset + length; index += 1) {
    output += String.fromCharCode(bytes[index]);
  }
  return output;
}

function u16be(value) {
  return new Uint8Array([(value >>> 8) & 0xff, value & 0xff]);
}

function u32be(value) {
  return new Uint8Array([
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff
  ]);
}

function u32le(value) {
  return new Uint8Array([
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff
  ]);
}

function readU16be(bytes, offset) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function readU32be(bytes, offset) {
  return (
    bytes[offset] * 0x1000000 +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3]
  ) >>> 0;
}

function readU32le(bytes, offset) {
  return (
    bytes[offset] +
    (bytes[offset + 1] << 8) +
    (bytes[offset + 2] << 16) +
    bytes[offset + 3] * 0x1000000
  ) >>> 0;
}

function writeU24le(bytes, offset, value) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
}

function bytesEqual(bytes, expected, offset = 0) {
  if (offset + expected.length > bytes.length) return false;
  for (let index = 0; index < expected.length; index += 1) {
    if (bytes[offset + index] !== expected[index]) return false;
  }
  return true;
}

function encodeBase64(bytes) {
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index];
    const hasB = index + 1 < bytes.length;
    const hasC = index + 2 < bytes.length;
    const b = hasB ? bytes[index + 1] : 0;
    const c = hasC ? bytes[index + 2] : 0;
    output += BASE64[a >>> 2];
    output += BASE64[((a & 0x03) << 4) | (b >>> 4)];
    output += hasB ? BASE64[((b & 0x0f) << 2) | (c >>> 6)] : '=';
    output += hasC ? BASE64[c & 0x3f] : '=';
  }
  return output;
}

function decodeBase64(value) {
  const clean = String(value || '').replace(/\s+/g, '');
  if (!clean || clean.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) {
    throw new Error('EchoShot 图片元数据编码无效');
  }
  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  const output = new Uint8Array((clean.length / 4) * 3 - padding);
  let offset = 0;
  for (let index = 0; index < clean.length; index += 4) {
    const a = BASE64.indexOf(clean[index]);
    const b = BASE64.indexOf(clean[index + 1]);
    const c = clean[index + 2] === '=' ? 0 : BASE64.indexOf(clean[index + 2]);
    const d = clean[index + 3] === '=' ? 0 : BASE64.indexOf(clean[index + 3]);
    const packed = (a << 18) | (b << 12) | (c << 6) | d;
    if (offset < output.length) output[offset++] = (packed >>> 16) & 0xff;
    if (offset < output.length) output[offset++] = (packed >>> 8) & 0xff;
    if (offset < output.length) output[offset++] = packed & 0xff;
  }
  return output;
}

function truncateUtf8(value, maxBytes = MAX_PROMPT_BYTES) {
  const text = String(value || '').trim();
  if (encoder.encode(text).byteLength <= maxBytes) return text;
  let low = 0;
  let high = text.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (encoder.encode(text.slice(0, middle)).byteLength <= maxBytes) low = middle;
    else high = middle - 1;
  }
  let output = text.slice(0, low);
  if (/[\uD800-\uDBFF]$/.test(output)) output = output.slice(0, -1);
  return output;
}

function cleanString(value, maxBytes = 4096) {
  return truncateUtf8(value, maxBytes);
}

export function buildEchoShotMetadata(record = {}, { displayModel = '', version = '' } = {}) {
  const prompt = truncateUtf8(record.prompt || record.requestPrompt || '');
  const requestPrompt = truncateUtf8(record.requestPrompt || prompt);
  const rawModel = cleanString(record.model, 2048);
  const shownModel = cleanString(displayModel || rawModel, 2048);
  const createdAt = Number(record.createdAt);
  const metadata = {
    schema: ECHOSHOT_METADATA_SCHEMA,
    software: 'EchoShot · 拍同款',
    prompt,
    provider: cleanString(record.provider, 2048),
    model: rawModel,
    ratio: cleanString(record.ratio, 128)
  };
  if (requestPrompt && requestPrompt !== prompt) metadata.requestPrompt = requestPrompt;
  if (shownModel && shownModel !== rawModel) metadata.modelAlias = shownModel;
  if (version) metadata.version = cleanString(version, 64);
  if (cleanString(record.size, 128)) metadata.size = cleanString(record.size, 128);
  if (Number.isFinite(Number(record.width)) && Number(record.width) > 0) metadata.width = Number(record.width);
  if (Number.isFinite(Number(record.height)) && Number(record.height) > 0) metadata.height = Number(record.height);
  if (Number.isFinite(createdAt) && createdAt > 0) metadata.createdAt = new Date(createdAt).toISOString();
  if (record.kind) metadata.kind = cleanString(record.kind, 128);
  if (Number.isInteger(Number(record.groupIndex))) metadata.groupIndex = Number(record.groupIndex);
  if (Number.isInteger(Number(record.groupCount))) metadata.groupCount = Number(record.groupCount);
  return metadata;
}

function normalizedMetadata(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (value.schema !== ECHOSHOT_METADATA_SCHEMA) return null;
  const metadata = buildEchoShotMetadata({
    ...value,
    createdAt: value.createdAt ? Date.parse(value.createdAt) : undefined
  }, {
    displayModel: value.modelAlias,
    version: value.version
  });
  metadata.schema = ECHOSHOT_METADATA_SCHEMA;
  return metadata;
}

function metadataJson(metadata) {
  const normalized = normalizedMetadata({ schema: ECHOSHOT_METADATA_SCHEMA, ...metadata });
  if (!normalized) throw new Error('EchoShot 图片元数据无效');
  const bytes = encoder.encode(JSON.stringify(normalized));
  if (bytes.byteLength > MAX_METADATA_BYTES) throw new Error('EchoShot 图片元数据过大');
  return { normalized, bytes, text: decoder.decode(bytes) };
}

function parseMetadataJson(bytes) {
  if (!bytes?.byteLength || bytes.byteLength > MAX_METADATA_BYTES) return null;
  try {
    return normalizedMetadata(JSON.parse(decoder.decode(bytes)));
  } catch {
    return null;
  }
}

export function promptFromEchoShotMetadata(metadata) {
  return String(metadata?.prompt || metadata?.requestPrompt || '').trim();
}

export function promptFromImageGenerationMetadata(metadata) {
  return String(metadata?.prompt || metadata?.requestPrompt || '').trim();
}

// ---------- PNG iTXt ----------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let value = 0; value < 256; value += 1) {
    let crc = value;
    for (let bit = 0; bit < 8; bit += 1) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    table[value] = crc >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = encoder.encode(type);
  return concatBytes([u32be(data.byteLength), typeBytes, data, u32be(crc32(concatBytes([typeBytes, data])))]);
}

function pngITXtData(jsonBytes) {
  return concatBytes([
    encoder.encode('EchoShot'),
    new Uint8Array([0, 0, 0, 0, 0]),
    jsonBytes
  ]);
}

function pngITXtMetadata(data) {
  const keywordEnd = data.indexOf(0);
  if (keywordEnd < 1 || ascii(data, 0, keywordEnd) !== 'EchoShot') return null;
  let offset = keywordEnd + 1;
  if (offset + 2 > data.length) return null;
  const compressed = data[offset] === 1;
  offset += 2;
  const languageEnd = data.indexOf(0, offset);
  if (languageEnd < 0) return null;
  offset = languageEnd + 1;
  const translatedEnd = data.indexOf(0, offset);
  if (translatedEnd < 0 || compressed) return null;
  return parseMetadataJson(data.slice(translatedEnd + 1));
}

function parsePngChunks(bytes) {
  if (!bytesEqual(bytes, PNG_SIGNATURE)) throw new Error('不是有效的 PNG 图片');
  const chunks = [];
  let offset = PNG_SIGNATURE.length;
  while (offset + 12 <= bytes.length) {
    const length = readU32be(bytes, offset);
    const end = offset + 12 + length;
    if (end > bytes.length) throw new Error('PNG 图片结构损坏或不完整');
    chunks.push({
      type: ascii(bytes, offset + 4, 4),
      data: bytes.slice(offset + 8, offset + 8 + length),
      raw: bytes.slice(offset, end)
    });
    offset = end;
    if (chunks.at(-1).type === 'IEND') break;
  }
  if (!chunks.length || chunks.at(-1).type !== 'IEND') throw new Error('PNG 图片缺少 IEND');
  return chunks;
}

function embedPng(bytes, jsonBytes) {
  const chunks = parsePngChunks(bytes);
  const output = [PNG_SIGNATURE];
  let inserted = false;
  for (const chunk of chunks) {
    const oldEchoShot = chunk.type === 'iTXt' && pngITXtMetadata(chunk.data);
    if (oldEchoShot) continue;
    if (!inserted && (chunk.type === 'IDAT' || chunk.type === 'IEND')) {
      output.push(pngChunk('iTXt', pngITXtData(jsonBytes)));
      inserted = true;
    }
    output.push(chunk.raw);
  }
  return concatBytes(output);
}

function readPngMetadata(bytes) {
  let found = null;
  for (const chunk of parsePngChunks(bytes)) {
    if (chunk.type !== 'iTXt') continue;
    found = pngITXtMetadata(chunk.data) || found;
  }
  return found;
}

// ---------- JPEG XMP ----------

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function xmpPacket(metadata, jsonBytes) {
  const prompt = escapeXml(promptFromEchoShotMetadata(metadata));
  const encoded = encodeBase64(jsonBytes);
  return `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>` +
    `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">` +
    `<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:echoshot="${XMP_NAMESPACE}">` +
    `<dc:description><rdf:Alt><rdf:li xml:lang="x-default">${prompt}</rdf:li></rdf:Alt></dc:description>` +
    `<echoshot:Metadata>${encoded}</echoshot:Metadata>` +
    `</rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>`;
}

function metadataFromXmp(text) {
  const match = String(text || '').match(/<echoshot:Metadata>([A-Za-z0-9+/=\s]+)<\/echoshot:Metadata>/i);
  if (!match) return null;
  try {
    return parseMetadataJson(decodeBase64(match[1]));
  } catch {
    return null;
  }
}

function embedJpeg(bytes, metadata, jsonBytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('不是有效的 JPEG 图片');
  const payload = concatBytes([encoder.encode(XMP_HEADER), encoder.encode(xmpPacket(metadata, jsonBytes))]);
  if (payload.byteLength + 2 > 0xffff) throw new Error('EchoShot JPEG 元数据过大');
  const segment = concatBytes([new Uint8Array([0xff, 0xe1]), u16be(payload.byteLength + 2), payload]);
  return concatBytes([bytes.slice(0, 2), segment, bytes.slice(2)]);
}

function readJpegMetadata(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  let found = null;
  while (offset + 4 <= bytes.length) {
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) break;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) break;
    const length = readU16be(bytes, offset);
    if (length < 2 || offset + length > bytes.length) break;
    const payload = bytes.slice(offset + 2, offset + length);
    if (marker === 0xe1 && ascii(payload, 0, Math.min(payload.length, XMP_HEADER.length)) === XMP_HEADER) {
      found = metadataFromXmp(decoder.decode(payload.slice(XMP_HEADER.length))) || found;
    }
    offset += length;
  }
  return found;
}

// ---------- WebP XMP ----------

function riffChunk(type, data) {
  const padding = data.byteLength % 2 ? new Uint8Array([0]) : new Uint8Array();
  return concatBytes([encoder.encode(type), u32le(data.byteLength), data, padding]);
}

function parseWebPChunks(bytes) {
  if (bytes.length < 12 || ascii(bytes, 0, 4) !== 'RIFF' || ascii(bytes, 8, 4) !== 'WEBP') {
    throw new Error('不是有效的 WebP 图片');
  }
  const chunks = [];
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const size = readU32le(bytes, offset + 4);
    const end = offset + 8 + size;
    const paddedEnd = end + (size % 2);
    if (paddedEnd > bytes.length) throw new Error('WebP 图片结构损坏或不完整');
    chunks.push({ type: ascii(bytes, offset, 4), data: bytes.slice(offset + 8, end) });
    offset = paddedEnd;
  }
  return chunks;
}

function webPDimensions(chunks) {
  const extended = chunks.find((chunk) => chunk.type === 'VP8X');
  if (extended?.data.length >= 10) {
    return {
      width: 1 + extended.data[4] + (extended.data[5] << 8) + (extended.data[6] << 16),
      height: 1 + extended.data[7] + (extended.data[8] << 8) + (extended.data[9] << 16),
      alpha: Boolean(extended.data[0] & 0x10)
    };
  }
  const lossy = chunks.find((chunk) => chunk.type === 'VP8 ');
  if (lossy?.data.length >= 10 && lossy.data[3] === 0x9d && lossy.data[4] === 0x01 && lossy.data[5] === 0x2a) {
    return {
      width: (lossy.data[6] | (lossy.data[7] << 8)) & 0x3fff,
      height: (lossy.data[8] | (lossy.data[9] << 8)) & 0x3fff,
      alpha: chunks.some((chunk) => chunk.type === 'ALPH')
    };
  }
  const lossless = chunks.find((chunk) => chunk.type === 'VP8L');
  if (lossless?.data.length >= 5 && lossless.data[0] === 0x2f) {
    const bits = readU32le(lossless.data, 1);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >>> 14) & 0x3fff) + 1,
      alpha: Boolean((bits >>> 28) & 1)
    };
  }
  throw new Error('无法读取 WebP 图片尺寸');
}

function embedWebP(bytes, metadata, jsonBytes) {
  const chunks = parseWebPChunks(bytes);
  const dimensions = webPDimensions(chunks);
  const existingXmp = chunks.some((chunk) => chunk.type === 'XMP ');
  const outputChunks = [];
  const existingVp8x = chunks.find((chunk) => chunk.type === 'VP8X');
  if (existingVp8x) {
    const data = existingVp8x.data.slice();
    data[0] |= 0x04;
    outputChunks.push(riffChunk('VP8X', data));
  } else {
    const data = new Uint8Array(10);
    data[0] = (dimensions.alpha ? 0x10 : 0) | 0x04;
    if (chunks.some((chunk) => chunk.type === 'ICCP')) data[0] |= 0x20;
    if (chunks.some((chunk) => chunk.type === 'EXIF')) data[0] |= 0x08;
    if (chunks.some((chunk) => chunk.type === 'ANIM')) data[0] |= 0x02;
    writeU24le(data, 4, dimensions.width - 1);
    writeU24le(data, 7, dimensions.height - 1);
    outputChunks.push(riffChunk('VP8X', data));
  }
  for (const chunk of chunks) {
    if (chunk.type === 'VP8X' || chunk.type === 'ECHS') continue;
    outputChunks.push(riffChunk(chunk.type, chunk.data));
  }
  if (existingXmp) outputChunks.push(riffChunk('ECHS', jsonBytes));
  else outputChunks.push(riffChunk('XMP ', encoder.encode(xmpPacket(metadata, jsonBytes))));
  const body = concatBytes([encoder.encode('WEBP'), ...outputChunks]);
  return concatBytes([encoder.encode('RIFF'), u32le(body.byteLength), body]);
}

function readWebPMetadata(bytes) {
  let found = null;
  for (const chunk of parseWebPChunks(bytes)) {
    if (chunk.type === 'ECHS') found = parseMetadataJson(chunk.data) || found;
    if (chunk.type === 'XMP ') found = metadataFromXmp(decoder.decode(chunk.data)) || found;
  }
  return found;
}

// ---------- GIF Comment Extension ----------

function gifSubBlocks(data) {
  const parts = [];
  for (let offset = 0; offset < data.length; offset += 255) {
    const part = data.slice(offset, offset + 255);
    parts.push(new Uint8Array([part.length]), part);
  }
  parts.push(new Uint8Array([0]));
  return concatBytes(parts);
}

function embedGif(bytes, jsonBytes) {
  const signature = ascii(bytes, 0, 6);
  if (!['GIF87a', 'GIF89a'].includes(signature) || bytes.at(-1) !== 0x3b) {
    throw new Error('不是有效的 GIF 图片');
  }
  const payload = concatBytes([encoder.encode('EchoShot:'), encoder.encode(encodeBase64(jsonBytes))]);
  const comment = concatBytes([new Uint8Array([0x21, 0xfe]), gifSubBlocks(payload)]);
  return concatBytes([bytes.slice(0, -1), comment, new Uint8Array([0x3b])]);
}

function readGifSubBlocks(bytes, offset) {
  const parts = [];
  let total = 0;
  while (offset < bytes.length) {
    const length = bytes[offset++];
    if (length === 0) return { data: concatBytes(parts), offset };
    if (offset + length > bytes.length || total + length > MAX_METADATA_BYTES * 2) return null;
    parts.push(bytes.slice(offset, offset + length));
    total += length;
    offset += length;
  }
  return null;
}

function readGifMetadata(bytes) {
  const signature = ascii(bytes, 0, 6);
  if (!['GIF87a', 'GIF89a'].includes(signature) || bytes.length < 13) return null;
  let offset = 13;
  if (bytes[10] & 0x80) offset += 3 * (2 ** ((bytes[10] & 0x07) + 1));
  let found = null;
  while (offset < bytes.length) {
    const introducer = bytes[offset++];
    if (introducer === 0x3b) break;
    if (introducer === 0x2c) {
      if (offset + 9 > bytes.length) break;
      const packed = bytes[offset + 8];
      offset += 9;
      if (packed & 0x80) offset += 3 * (2 ** ((packed & 0x07) + 1));
      offset += 1; // LZW minimum code size
      const imageData = readGifSubBlocks(bytes, offset);
      if (!imageData) break;
      offset = imageData.offset;
      continue;
    }
    if (introducer !== 0x21 || offset >= bytes.length) break;
    const label = bytes[offset++];
    const extension = readGifSubBlocks(bytes, offset);
    if (!extension) break;
    offset = extension.offset;
    if (label !== 0xfe) continue;
    const text = decoder.decode(extension.data);
    if (!text.startsWith('EchoShot:')) continue;
    try {
      found = parseMetadataJson(decodeBase64(text.slice('EchoShot:'.length))) || found;
    } catch { /* 忽略损坏的旧注释 */ }
  }
  return found;
}

// ---------- SVG metadata ----------

function embedSvg(bytes, jsonBytes) {
  const text = decoder.decode(bytes);
  const closing = text.toLowerCase().lastIndexOf('</svg>');
  if (closing < 0) throw new Error('不是有效的 SVG 图片');
  const metadata = `<metadata id="echoshot" data-schema="${ECHOSHOT_METADATA_SCHEMA}">${encodeBase64(jsonBytes)}</metadata>`;
  return encoder.encode(text.slice(0, closing) + metadata + text.slice(closing));
}

function readSvgMetadata(bytes) {
  const matches = [...decoder.decode(bytes).matchAll(
    /<metadata\b[^>]*\bid=["']echoshot["'][^>]*>([A-Za-z0-9+/=\s]+)<\/metadata>/gi
  )];
  const encoded = matches.at(-1)?.[1];
  if (!encoded) return null;
  try {
    return parseMetadataJson(decodeBase64(encoded));
  } catch {
    return null;
  }
}

// ---------- AVIF ISO-BMFF uuid box ----------

function avifMetadataBox(jsonBytes) {
  const size = 8 + AVIF_ECHOSHOT_UUID.byteLength + jsonBytes.byteLength;
  return concatBytes([u32be(size), encoder.encode('uuid'), AVIF_ECHOSHOT_UUID, jsonBytes]);
}

function readAvifMetadata(bytes) {
  let offset = 0;
  let found = null;
  while (offset + 8 <= bytes.length) {
    const size32 = readU32be(bytes, offset);
    const type = ascii(bytes, offset + 4, 4);
    let headerSize = 8;
    let size = size32;
    if (size32 === 1) {
      if (offset + 16 > bytes.length) break;
      const high = readU32be(bytes, offset + 8);
      const low = readU32be(bytes, offset + 12);
      size = high * 0x100000000 + low;
      headerSize = 16;
    } else if (size32 === 0) {
      size = bytes.length - offset;
    }
    if (!Number.isSafeInteger(size) || size < headerSize || offset + size > bytes.length) break;
    if (type === 'uuid' && size >= headerSize + 16 && bytesEqual(bytes, AVIF_ECHOSHOT_UUID, offset + headerSize)) {
      found = parseMetadataJson(bytes.slice(offset + headerSize + 16, offset + size)) || found;
    }
    offset += size;
  }
  return found;
}

function imageFormat(bytes) {
  if (bytesEqual(bytes, PNG_SIGNATURE)) return 'png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') return 'webp';
  if (bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(ascii(bytes, 0, 6))) return 'gif';
  if (bytes.length >= 12 && ascii(bytes, 4, 4) === 'ftyp' && ['avif', 'avis'].includes(ascii(bytes, 8, 4))) return 'avif';
  if (/^\s*(?:<\?xml[^>]*>\s*)?<svg(?:\s|>)/i.test(decoder.decode(bytes.slice(0, 512)))) return 'svg';
  return '';
}

async function imageBytes(blob) {
  if (!(blob instanceof Blob)) throw new TypeError('需要图片 Blob');
  if (blob.size > MAX_IMAGE_BYTES) throw new Error('图片超过 128 MiB，已停止读取元数据');
  return new Uint8Array(await blob.arrayBuffer());
}

export async function embedEchoShotMetadata(blob, metadata) {
  const { normalized, bytes: jsonBytes } = metadataJson(metadata);
  const bytes = await imageBytes(blob);
  const format = imageFormat(bytes);
  if (format === 'png') {
    return { blob: new Blob([embedPng(bytes, jsonBytes)], { type: 'image/png' }), embedded: true, format };
  }
  if (format === 'jpeg') {
    return { blob: new Blob([embedJpeg(bytes, normalized, jsonBytes)], { type: 'image/jpeg' }), embedded: true, format };
  }
  if (format === 'webp') {
    return { blob: new Blob([embedWebP(bytes, normalized, jsonBytes)], { type: 'image/webp' }), embedded: true, format };
  }
  if (format === 'gif') {
    return { blob: new Blob([embedGif(bytes, jsonBytes)], { type: 'image/gif' }), embedded: true, format };
  }
  if (format === 'svg') {
    return { blob: new Blob([embedSvg(bytes, jsonBytes)], { type: 'image/svg+xml' }), embedded: true, format };
  }
  if (format === 'avif') {
    return { blob: new Blob([bytes, avifMetadataBox(jsonBytes)], { type: 'image/avif' }), embedded: true, format };
  }
  return { blob, embedded: false, format: '' };
}

export async function readEchoShotMetadata(blob) {
  const bytes = await imageBytes(blob);
  const format = imageFormat(bytes);
  try {
    if (format === 'png') return readPngMetadata(bytes);
    if (format === 'jpeg') return readJpegMetadata(bytes);
    if (format === 'webp') return readWebPMetadata(bytes);
    if (format === 'gif') return readGifMetadata(bytes);
    if (format === 'svg') return readSvgMetadata(bytes);
    if (format === 'avif') return readAvifMetadata(bytes);
  } catch {
    // 元数据结构损坏不应阻止用户继续使用图片；按“无元数据”处理并进入反推。
    return null;
  }
  return null;
}

// ---------- 第三方生图软件元数据（第一阶段兼容） ----------

const MAX_EXTERNAL_METADATA_BYTES = 2 * 1024 * 1024;
const MAX_EXTERNAL_METADATA_FIELDS = 64;
const MAX_COMFYUI_NODES = 2000;
const MAX_COMFYUI_VISITED_NODES = 256;
const latin1Decoder = new TextDecoder('latin1', { fatal: false });

function externalText(value, maxBytes = MAX_PROMPT_BYTES) {
  return truncateUtf8(String(value ?? '').replace(/\0+$/g, '').trim(), maxBytes);
}

function metadataEntry(entries, ...names) {
  const expected = new Set(names.map((name) => String(name).toLowerCase()));
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (expected.has(String(entries[index]?.key || '').toLowerCase())) return entries[index].value;
  }
  return '';
}

function addMetadataEntry(entries, key, value) {
  const normalizedKey = externalText(key, 256);
  const normalizedValue = externalText(value, MAX_EXTERNAL_METADATA_BYTES);
  if (!normalizedKey || !normalizedValue || entries.length >= MAX_EXTERNAL_METADATA_FIELDS) return;
  entries.push({ key: normalizedKey, value: normalizedValue });
}

async function inflateMetadata(bytes) {
  if (!bytes?.byteLength || bytes.byteLength > MAX_EXTERNAL_METADATA_BYTES || typeof DecompressionStream !== 'function') {
    return null;
  }
  try {
    const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate')).getReader();
    const parts = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_EXTERNAL_METADATA_BYTES) {
        await reader.cancel();
        return null;
      }
      parts.push(value);
    }
    return concatBytes(parts);
  } catch {
    return null;
  }
}

async function pngTextEntries(bytes) {
  const entries = [];
  for (const chunk of parsePngChunks(bytes)) {
    if (entries.length >= MAX_EXTERNAL_METADATA_FIELDS) break;
    if (!['tEXt', 'zTXt', 'iTXt'].includes(chunk.type) || chunk.data.byteLength > MAX_EXTERNAL_METADATA_BYTES) continue;
    if (chunk.type === 'tEXt') {
      const separator = chunk.data.indexOf(0);
      if (separator > 0) addMetadataEntry(
        entries,
        latin1Decoder.decode(chunk.data.slice(0, separator)),
        latin1Decoder.decode(chunk.data.slice(separator + 1))
      );
      continue;
    }
    if (chunk.type === 'zTXt') {
      const separator = chunk.data.indexOf(0);
      if (separator < 1 || chunk.data[separator + 1] !== 0) continue;
      const inflated = await inflateMetadata(chunk.data.slice(separator + 2));
      if (inflated) addMetadataEntry(
        entries,
        latin1Decoder.decode(chunk.data.slice(0, separator)),
        latin1Decoder.decode(inflated)
      );
      continue;
    }
    if (chunk.type !== 'iTXt') continue;
    const keywordEnd = chunk.data.indexOf(0);
    if (keywordEnd < 1 || keywordEnd + 3 > chunk.data.length) continue;
    const compressed = chunk.data[keywordEnd + 1] === 1;
    if (chunk.data[keywordEnd + 2] !== 0) continue;
    let offset = keywordEnd + 3;
    const languageEnd = chunk.data.indexOf(0, offset);
    if (languageEnd < 0) continue;
    offset = languageEnd + 1;
    const translatedEnd = chunk.data.indexOf(0, offset);
    if (translatedEnd < 0) continue;
    let textBytes = chunk.data.slice(translatedEnd + 1);
    if (compressed) textBytes = await inflateMetadata(textBytes);
    if (textBytes) addMetadataEntry(entries, latin1Decoder.decode(chunk.data.slice(0, keywordEnd)), decoder.decode(textBytes));
  }
  return entries;
}

function decodeExifUserComment(bytes) {
  if (!bytes?.byteLength) return '';
  const header = ascii(bytes, 0, Math.min(8, bytes.length));
  const payload = bytes.slice(Math.min(8, bytes.length));
  if (header.startsWith('ASCII')) return latin1Decoder.decode(payload);
  if (header.startsWith('UNICODE')) {
    try {
      if (payload[0] === 0xff && payload[1] === 0xfe) return new TextDecoder('utf-16le').decode(payload.slice(2));
      if (payload[0] === 0xfe && payload[1] === 0xff) return new TextDecoder('utf-16be').decode(payload.slice(2));
      return new TextDecoder('utf-16be').decode(payload);
    } catch { /* 继续按普通文本读取 */ }
  }
  if (header.startsWith('JIS')) return latin1Decoder.decode(payload);
  return decoder.decode(bytes);
}

function exifTextEntries(input) {
  let tiff = input;
  if (input.length >= 6 && ascii(input, 0, 6) === 'Exif\0\0') tiff = input.slice(6);
  if (tiff.length < 8) return [];
  const byteOrder = ascii(tiff, 0, 2);
  if (!['II', 'MM'].includes(byteOrder)) return [];
  const littleEndian = byteOrder === 'II';
  const view = new DataView(tiff.buffer, tiff.byteOffset, tiff.byteLength);
  const u16 = (offset) => offset + 2 <= tiff.length ? view.getUint16(offset, littleEndian) : null;
  const u32 = (offset) => offset + 4 <= tiff.length ? view.getUint32(offset, littleEndian) : null;
  if (u16(2) !== 42) return [];
  const typeSize = { 1: 1, 2: 1, 3: 2, 4: 4, 7: 1 };
  const entries = [];
  const visited = new Set();
  let exifIfdOffset = 0;

  const parseIfd = (ifdOffset) => {
    if (!Number.isInteger(ifdOffset) || ifdOffset < 8 || visited.has(ifdOffset) || ifdOffset + 2 > tiff.length) return;
    visited.add(ifdOffset);
    const count = u16(ifdOffset);
    if (!Number.isInteger(count) || count > 512 || ifdOffset + 2 + count * 12 > tiff.length) return;
    for (let index = 0; index < count; index += 1) {
      const entryOffset = ifdOffset + 2 + index * 12;
      const tag = u16(entryOffset);
      const type = u16(entryOffset + 2);
      const itemCount = u32(entryOffset + 4);
      const size = typeSize[type] * itemCount;
      if (!typeSize[type] || !Number.isSafeInteger(size) || size < 0 || size > MAX_EXTERNAL_METADATA_BYTES) continue;
      const valueOffset = size <= 4 ? entryOffset + 8 : u32(entryOffset + 8);
      if (!Number.isInteger(valueOffset) || valueOffset < 0 || valueOffset + size > tiff.length) continue;
      const valueBytes = tiff.slice(valueOffset, valueOffset + size);
      if (tag === 0x8769 && type === 4 && itemCount === 1) exifIfdOffset = u32(entryOffset + 8) || 0;
      if (tag === 0x010e) addMetadataEntry(entries, 'Description', type === 2 ? latin1Decoder.decode(valueBytes) : decoder.decode(valueBytes));
      if (tag === 0x0131) addMetadataEntry(entries, 'Software', type === 2 ? latin1Decoder.decode(valueBytes) : decoder.decode(valueBytes));
      if (tag === 0x9286) addMetadataEntry(entries, 'UserComment', decodeExifUserComment(valueBytes));
      if (tag === 0x927c) addMetadataEntry(entries, 'MakerNote', decoder.decode(valueBytes));
    }
  };

  const ifd0Offset = u32(4);
  parseIfd(ifd0Offset);
  if (exifIfdOffset) parseIfd(exifIfdOffset);
  return entries;
}

function jpegExternalEntries(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return [];
  const entries = [];
  let offset = 2;
  while (offset + 4 <= bytes.length && entries.length < MAX_EXTERNAL_METADATA_FIELDS) {
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) break;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) break;
    const length = readU16be(bytes, offset);
    if (length < 2 || offset + length > bytes.length) break;
    const payload = bytes.slice(offset + 2, offset + length);
    if (marker === 0xe1 && ascii(payload, 0, Math.min(6, payload.length)) === 'Exif\0\0') {
      for (const entry of exifTextEntries(payload)) addMetadataEntry(entries, entry.key, entry.value);
    }
    offset += length;
  }
  return entries;
}

function webPExternalEntries(bytes) {
  const entries = [];
  for (const chunk of parseWebPChunks(bytes)) {
    if (chunk.type !== 'EXIF' || chunk.data.byteLength > MAX_EXTERNAL_METADATA_BYTES) continue;
    for (const entry of exifTextEntries(chunk.data)) addMetadataEntry(entries, entry.key, entry.value);
  }
  return entries;
}

function parseJsonObject(value, maxBytes = MAX_EXTERNAL_METADATA_BYTES) {
  if (!value || encoder.encode(String(value)).byteLength > maxBytes) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function plainValue(value, maxBytes = 4096) {
  if (typeof value === 'string' || typeof value === 'number') return externalText(value, maxBytes);
  return '';
}

function sizeFields(value) {
  const match = String(value || '').match(/(\d{2,6})\s*[x×]\s*(\d{2,6})/i);
  if (!match) return {};
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!width || !height) return {};
  let a = width;
  let b = height;
  while (b) [a, b] = [b, a % b];
  return { size: `${width}x${height}`, width, height, ratio: `${width / a}:${height / a}` };
}

function parseA1111Fields(value) {
  const fields = {};
  const pattern = /\s*([\w][\w \-/]*):\s*("(?:\\.|[^"\\])*"|[^,]*)(?:,|$)/g;
  let match;
  while ((match = pattern.exec(String(value || '')))) {
    let fieldValue = match[2].trim();
    if (fieldValue.startsWith('"') && fieldValue.endsWith('"')) {
      try { fieldValue = JSON.parse(fieldValue); } catch { fieldValue = fieldValue.slice(1, -1); }
    }
    fields[match[1].trim().toLowerCase()] = externalText(fieldValue, 4096);
  }
  return fields;
}

function a1111Metadata(parameters, generator = 'automatic1111', generatorLabel = 'AUTOMATIC1111 / Forge') {
  const text = externalText(parameters, MAX_EXTERNAL_METADATA_BYTES).replace(/\r\n?/g, '\n');
  if (!text || text.trimStart().startsWith('{')) return null;
  const lines = text.split('\n');
  let parameterIndex = -1;
  let fields = {};
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const candidate = parseA1111Fields(lines[index]);
    const recognized = ['steps', 'sampler', 'cfg scale', 'seed', 'size', 'model', 'model hash'].filter((key) => candidate[key]).length;
    if (recognized >= 2 && (candidate.steps || candidate.seed || candidate.sampler)) {
      parameterIndex = index;
      fields = candidate;
      break;
    }
  }
  if (parameterIndex < 0) return null;
  const promptBlock = lines.slice(0, parameterIndex).join('\n').trim();
  const negativeMarker = /(?:^|\n)Negative prompt:\s*/i.exec(promptBlock);
  const prompt = externalText(negativeMarker ? promptBlock.slice(0, negativeMarker.index) : promptBlock);
  if (!prompt) return null;
  const negativePrompt = externalText(negativeMarker ? promptBlock.slice(negativeMarker.index + negativeMarker[0].length) : '');
  return {
    schema: 'external/1',
    generator,
    generatorLabel,
    metadataFormat: 'a1111-parameters',
    prompt,
    ...(negativePrompt ? { negativePrompt } : {}),
    ...(fields.model ? { model: fields.model } : {}),
    ...(fields.seed ? { seed: fields.seed } : {}),
    ...(fields.steps ? { steps: fields.steps } : {}),
    ...(fields.sampler ? { sampler: fields.sampler } : {}),
    ...(fields.scheduler ? { scheduler: fields.scheduler } : {}),
    ...(fields['cfg scale'] ? { cfgScale: fields['cfg scale'] } : {}),
    ...sizeFields(fields.size)
  };
}

function promptList(value) {
  if (Array.isArray(value)) {
    return externalText(value.flat(Infinity).filter((item) => typeof item === 'string').join('\n'));
  }
  return externalText(value);
}

function fooocusMetadata(entries) {
  const parameters = metadataEntry(entries, 'parameters', 'UserComment');
  const scheme = metadataEntry(entries, 'fooocus_scheme', 'MakerNote');
  const software = metadataEntry(entries, 'Software');
  const native = parseJsonObject(parameters);
  const isFooocus = Boolean(scheme) || /fooocus/i.test(software) || Boolean(native && (
    'full_prompt' in native || 'base_model' in native || 'guidance_scale' in native
  ));
  if (!isFooocus) return null;
  if (!native) return a1111Metadata(parameters, 'fooocus', 'Fooocus');
  const prompt = promptList(native.raw_prompt || native.prompt || native.full_prompt);
  if (!prompt) return null;
  const negativePrompt = promptList(native.raw_negative_prompt || native.negative_prompt || native.full_negative_prompt);
  const resolution = plainValue(native.resolution || native.size, 128);
  return {
    schema: 'external/1',
    generator: 'fooocus',
    generatorLabel: 'Fooocus',
    metadataFormat: 'fooocus-json',
    prompt,
    ...(negativePrompt ? { negativePrompt } : {}),
    ...(plainValue(native.base_model, 2048) ? { model: plainValue(native.base_model, 2048) } : {}),
    ...(plainValue(native.seed) ? { seed: plainValue(native.seed) } : {}),
    ...(plainValue(native.steps) ? { steps: plainValue(native.steps) } : {}),
    ...(plainValue(native.sampler) ? { sampler: plainValue(native.sampler) } : {}),
    ...(plainValue(native.scheduler) ? { scheduler: plainValue(native.scheduler) } : {}),
    ...(plainValue(native.guidance_scale) ? { cfgScale: plainValue(native.guidance_scale) } : {}),
    ...sizeFields(resolution)
  };
}

function novelAiMetadata(entries) {
  const software = metadataEntry(entries, 'Software');
  if (!/novelai/i.test(software)) return null;
  const comment = parseJsonObject(metadataEntry(entries, 'Comment', 'UserComment')) || {};
  const prompt = externalText(metadataEntry(entries, 'Description') || comment.prompt);
  if (!prompt) return null;
  const width = Number(comment.width);
  const height = Number(comment.height);
  return {
    schema: 'external/1',
    generator: 'novelai',
    generatorLabel: 'NovelAI',
    metadataFormat: 'novelai',
    prompt,
    ...(externalText(comment.uc) ? { negativePrompt: externalText(comment.uc) } : {}),
    ...(plainValue(comment.model || metadataEntry(entries, 'Source'), 2048) ? { model: plainValue(comment.model || metadataEntry(entries, 'Source'), 2048) } : {}),
    ...(plainValue(comment.seed) ? { seed: plainValue(comment.seed) } : {}),
    ...(plainValue(comment.steps) ? { steps: plainValue(comment.steps) } : {}),
    ...(plainValue(comment.sampler) ? { sampler: plainValue(comment.sampler) } : {}),
    ...(plainValue(comment.scale) ? { cfgScale: plainValue(comment.scale) } : {}),
    ...(Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
      ? { width, height, size: `${width}x${height}`, ...sizeFields(`${width}x${height}`) }
      : {})
  };
}

function comfyNodeText(graph, reference, visited) {
  const nodeId = Array.isArray(reference) ? String(reference[0]) : String(reference || '');
  if (!nodeId || !graph[nodeId] || visited.has(nodeId) || visited.size >= MAX_COMFYUI_VISITED_NODES) return [];
  visited.add(nodeId);
  const node = graph[nodeId];
  const inputs = node?.inputs && typeof node.inputs === 'object' ? node.inputs : {};
  const texts = [];
  for (const [key, value] of Object.entries(inputs)) {
    if (['text', 'text_g', 'text_l', 'prompt'].includes(key) && typeof value === 'string') {
      const text = externalText(value);
      if (text) texts.push(text);
    }
    if (Array.isArray(value) && graph[String(value[0])]) texts.push(...comfyNodeText(graph, value, visited));
  }
  return [...new Set(texts)];
}

function comfyUiMetadata(entries) {
  const graph = parseJsonObject(metadataEntry(entries, 'prompt'));
  if (!graph) return null;
  const graphEntries = Object.entries(graph);
  if (!graphEntries.length || graphEntries.length > MAX_COMFYUI_NODES || !graphEntries.some(([, node]) => node?.class_type)) return null;
  const samplerEntry = graphEntries.find(([, node]) => /^(?:KSampler|SamplerCustom)/i.test(String(node?.class_type || '')))
    || graphEntries.find(([, node]) => /sampler/i.test(String(node?.class_type || '')));
  const samplerInputs = samplerEntry?.[1]?.inputs && typeof samplerEntry[1].inputs === 'object' ? samplerEntry[1].inputs : {};
  let positive = comfyNodeText(graph, samplerInputs.positive, new Set());
  let negative = comfyNodeText(graph, samplerInputs.negative, new Set());
  if (!positive.length) {
    const clipNodes = graphEntries.filter(([, node]) => /CLIPTextEncode/i.test(String(node?.class_type || '')));
    positive = clipNodes.length ? comfyNodeText(graph, clipNodes[0][0], new Set()) : [];
    if (!negative.length && clipNodes.length > 1) negative = comfyNodeText(graph, clipNodes[1][0], new Set());
  }
  const prompt = externalText([...new Set(positive)].join('\n'));
  if (!prompt) return null;
  const negativePrompt = externalText([...new Set(negative)].join('\n'));
  const checkpoint = graphEntries.find(([, node]) => plainValue(node?.inputs?.ckpt_name, 2048));
  const latent = graphEntries.find(([, node]) => Number(node?.inputs?.width) > 0 && Number(node?.inputs?.height) > 0);
  const width = Number(latent?.[1]?.inputs?.width);
  const height = Number(latent?.[1]?.inputs?.height);
  return {
    schema: 'external/1',
    generator: 'comfyui',
    generatorLabel: 'ComfyUI',
    metadataFormat: 'comfyui-api-graph',
    prompt,
    ...(negativePrompt ? { negativePrompt } : {}),
    ...(checkpoint ? { model: plainValue(checkpoint[1].inputs.ckpt_name, 2048) } : {}),
    ...(plainValue(samplerInputs.seed ?? samplerInputs.noise_seed) ? { seed: plainValue(samplerInputs.seed ?? samplerInputs.noise_seed) } : {}),
    ...(plainValue(samplerInputs.steps) ? { steps: plainValue(samplerInputs.steps) } : {}),
    ...(plainValue(samplerInputs.sampler_name) ? { sampler: plainValue(samplerInputs.sampler_name) } : {}),
    ...(plainValue(samplerInputs.scheduler) ? { scheduler: plainValue(samplerInputs.scheduler) } : {}),
    ...(plainValue(samplerInputs.cfg) ? { cfgScale: plainValue(samplerInputs.cfg) } : {}),
    ...(Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
      ? { width, height, size: `${width}x${height}`, ...sizeFields(`${width}x${height}`) }
      : {})
  };
}

function externalGenerationMetadata(entries) {
  const fooocus = fooocusMetadata(entries);
  if (fooocus) return fooocus;
  const novelAi = novelAiMetadata(entries);
  if (novelAi) return novelAi;
  const comfyUi = comfyUiMetadata(entries);
  if (comfyUi) return comfyUi;
  return a1111Metadata(metadataEntry(entries, 'parameters', 'UserComment'));
}

export async function readImageGenerationMetadata(blob) {
  const echoShot = await readEchoShotMetadata(blob);
  if (echoShot) {
    return {
      ...echoShot,
      generator: 'echoshot',
      generatorLabel: 'EchoShot · 拍同款',
      metadataFormat: 'echoshot'
    };
  }
  try {
    const bytes = await imageBytes(blob);
    const format = imageFormat(bytes);
    let entries = [];
    if (format === 'png') entries = await pngTextEntries(bytes);
    if (format === 'jpeg') entries = jpegExternalEntries(bytes);
    if (format === 'webp') entries = webPExternalEntries(bytes);
    return externalGenerationMetadata(entries);
  } catch {
    // 未识别、超出安全限制或结构损坏时按“无元数据”处理，交回既有反推流程。
    return null;
  }
}
