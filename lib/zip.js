// 极简 ZIP 打包器（STORE 模式，不压缩）。
// JPEG/PNG 本身已是压缩格式，直接存储即可，体积小、零依赖、速度快。

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  return (crc32Update(0xffffffff, buf) ^ 0xffffffff) >>> 0;
}

function crc32Update(crc, buf) {
  let next = crc >>> 0;
  for (let i = 0; i < buf.length; i++) next = CRC_TABLE[(next ^ buf[i]) & 0xff] ^ (next >>> 8);
  return next >>> 0;
}

function dosDateTime(d = new Date()) {
  const time = ((d.getHours() & 31) << 11) | ((d.getMinutes() & 63) << 5) | ((d.getSeconds() >> 1) & 31);
  const date = (((d.getFullYear() - 1980) & 127) << 9) | (((d.getMonth() + 1) & 15) << 5) | (d.getDate() & 31);
  return { time, date };
}

const u16 = (v) => new Uint8Array([v & 255, (v >> 8) & 255]);
const u32 = (v) => new Uint8Array([v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255]);
const byteLengthOf = (parts) => parts.reduce((total, part) => total + part.length, 0);

const ZIP_LOCAL_HEADER = 0x04034b50;
const ZIP_CENTRAL_HEADER = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const ZIP_MAX_ENTRIES = 100;
const ZIP_MAX_ARCHIVE_SIZE = 128 * 1024 * 1024;
const ZIP_MAX_ENTRY_SIZE = 64 * 1024 * 1024;
const ZIP_MAX_TOTAL_SIZE = 256 * 1024 * 1024;

function zipBoundsError() {
  return new Error('ZIP 文件结构损坏或不完整');
}

function ensureRange(bytes, offset, length) {
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0 || offset + length > bytes.length) {
    throw zipBoundsError();
  }
}

function findEndOfCentralDirectory(bytes, view) {
  const firstPossibleOffset = Math.max(0, bytes.length - 0xffff - 22);
  for (let offset = bytes.length - 22; offset >= firstPossibleOffset; offset -= 1) {
    if (view.getUint32(offset, true) === ZIP_END_OF_CENTRAL_DIRECTORY) return offset;
  }
  throw new Error('不是有效的 ZIP 文件');
}

function zipSizeLimitError(message) {
  const error = new Error(message);
  error.code = 'ZIP_SIZE_LIMIT';
  error.retryable = false;
  return error;
}

async function inflateRaw(data, maxOutputSize) {
  if (typeof DecompressionStream !== 'function') {
    throw new Error('当前浏览器不支持解压 ZIP 中的压缩文件');
  }
  let reader;
  try {
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    reader = stream.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxOutputSize) {
        const error = zipSizeLimitError('ZIP 内文件实际解压体积过大，已停止解压');
        await reader.cancel(error).catch(() => {});
        throw error;
      }
      chunks.push(value);
    }
    const output = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      output.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return output;
  } catch (error) {
    if (error?.code === 'ZIP_SIZE_LIMIT') throw error;
    throw new Error('ZIP 文件解压失败');
  } finally {
    try { reader?.releaseLock?.(); } catch {}
  }
}

/**
 * 解开 RunningHub 等平台返回的经典 ZIP（STORE/DEFLATE）。
 * 返回 [{ name, data: Uint8Array }]；设置条目和总大小上限，避免异常压缩包耗尽内存。
 */
export async function extractZipEntries(blob, {
  maxEntries = ZIP_MAX_ENTRIES,
  maxArchiveSize = ZIP_MAX_ARCHIVE_SIZE,
  maxEntrySize = ZIP_MAX_ENTRY_SIZE,
  maxTotalSize = ZIP_MAX_TOTAL_SIZE
} = {}) {
  if (Number(blob?.size) > maxArchiveSize) {
    throw zipSizeLimitError('ZIP 压缩包体积过大，已停止读取');
  }
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (bytes.length < 22) throw new Error('不是有效的 ZIP 文件');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocdOffset = findEndOfCentralDirectory(bytes, view);
  ensureRange(bytes, eocdOffset, 22);
  const diskNumber = view.getUint16(eocdOffset + 4, true);
  const centralDisk = view.getUint16(eocdOffset + 6, true);
  const entriesOnDisk = view.getUint16(eocdOffset + 8, true);
  const entryCount = view.getUint16(eocdOffset + 10, true);
  const centralSize = view.getUint32(eocdOffset + 12, true);
  const centralOffset = view.getUint32(eocdOffset + 16, true);
  const commentLength = view.getUint16(eocdOffset + 20, true);
  ensureRange(bytes, eocdOffset, 22 + commentLength);
  if (diskNumber !== 0 || centralDisk !== 0 || entriesOnDisk !== entryCount) {
    throw new Error('暂不支持分卷 ZIP 文件');
  }
  if (entryCount === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff) {
    throw new Error('暂不支持 ZIP64 文件');
  }
  if (entryCount > maxEntries) throw zipSizeLimitError(`ZIP 内文件过多，最多支持 ${maxEntries} 个`);
  ensureRange(bytes, centralOffset, centralSize);

  const decoder = new TextDecoder('utf-8');
  const entries = [];
  let declaredTotalSize = 0;
  let actualTotalSize = 0;
  let offset = centralOffset;
  for (let index = 0; index < entryCount; index += 1) {
    ensureRange(bytes, offset, 46);
    if (view.getUint32(offset, true) !== ZIP_CENTRAL_HEADER) throw zipBoundsError();
    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const expectedCrc = view.getUint32(offset + 16, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const entryCommentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    if ([compressedSize, uncompressedSize, localOffset].includes(0xffffffff)) {
      throw new Error('暂不支持 ZIP64 文件');
    }
    ensureRange(bytes, offset + 46, nameLength + extraLength + entryCommentLength);
    const name = decoder.decode(bytes.slice(offset + 46, offset + 46 + nameLength));
    offset += 46 + nameLength + extraLength + entryCommentLength;
    if (name.endsWith('/')) continue;
    if (flags & 0x0001) throw new Error('ZIP 内文件已加密，无法解压');
    if (uncompressedSize > maxEntrySize) throw zipSizeLimitError('ZIP 内单个文件过大，已停止解压');
    declaredTotalSize += uncompressedSize;
    if (declaredTotalSize > maxTotalSize) throw zipSizeLimitError('ZIP 解压后体积过大，已停止解压');

    ensureRange(bytes, localOffset, 30);
    if (view.getUint32(localOffset, true) !== ZIP_LOCAL_HEADER) throw zipBoundsError();
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    ensureRange(bytes, dataOffset, compressedSize);
    const compressed = bytes.slice(dataOffset, dataOffset + compressedSize);
    const actualEntryLimit = Math.min(maxEntrySize, maxTotalSize - actualTotalSize);
    if (actualEntryLimit <= 0) throw zipSizeLimitError('ZIP 实际解压总体积过大，已停止解压');
    let data;
    if (method === 0) {
      if (compressed.byteLength > actualEntryLimit) {
        throw zipSizeLimitError('ZIP 内文件实际体积过大，已停止解压');
      }
      data = compressed;
    } else if (method === 8) data = await inflateRaw(compressed, actualEntryLimit);
    else throw new Error(`ZIP 使用了暂不支持的压缩方式：${method}`);
    actualTotalSize += data.byteLength;
    if (actualTotalSize > maxTotalSize) {
      throw zipSizeLimitError('ZIP 实际解压总体积过大，已停止解压');
    }
    if (data.length !== uncompressedSize || crc32(data) !== expectedCrc) {
      throw new Error(`ZIP 内文件校验失败：${name || index + 1}`);
    }
    entries.push({ name, data });
  }
  return entries;
}

function abortError() {
  return new DOMException('ZIP stream cancelled', 'AbortError');
}

function ensureClassicZipLimit(value) {
  if (!Number.isSafeInteger(value) || value > 0xffffffff) {
    throw new RangeError('ZIP 文件超过 4GB，请减少相册图片后重试');
  }
}

/**
 * entries: [{ name: string, data: Uint8Array }]
 * 返回 Blob (application/zip)
 */
export function buildZip(entries) {
  const enc = new TextEncoder();
  const { time, date } = dosDateTime();
  const parts = [];
  const central = [];
  let offset = 0;

  for (const e of entries) {
    const name = enc.encode(e.name);
    const crc = crc32(e.data);
    const local = [
      u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(time), u16(date),
      u32(crc), u32(e.data.length), u32(e.data.length), u16(name.length), u16(0),
      name, e.data
    ];
    parts.push(...local);
    central.push({ name, crc, size: e.data.length, offset });
    offset += byteLengthOf(local);
  }

  const cdStart = offset;
  for (const c of central) {
    const rec = [
      u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(time), u16(date),
      u32(c.crc), u32(c.size), u32(c.size), u16(c.name.length),
      u16(0), u16(0), u16(0), u16(0), u32(0), u32(c.offset), c.name
    ];
    parts.push(...rec);
    offset += byteLengthOf(rec);
  }
  const cdSize = offset - cdStart;

  parts.push(
    u32(0x06054b50), u16(0), u16(0),
    u16(central.length), u16(central.length),
    u32(cdSize), u32(cdStart), u16(0)
  );

  return new Blob(parts, { type: 'application/zip' });
}

/**
 * 将 STORE 模式 ZIP 逐块写入 FileSystemWritableFileStream。
 * entries 是 AsyncIterable<{ name, blob }>，因此无需把整个相册加载进内存。
 */
export async function writeZipStream(entries, writable, { signal, total = 0, onProgress } = {}) {
  const enc = new TextEncoder();
  const central = [];
  let offset = 0;
  let completed = 0;

  const writeParts = async (parts) => {
    for (const part of parts) {
      if (signal?.aborted) throw abortError();
      await writable.write(part);
      offset += part.length;
      ensureClassicZipLimit(offset);
    }
  };

  for await (const entry of entries) {
    if (signal?.aborted) throw abortError();
    const name = enc.encode(entry.name);
    const { time, date } = dosDateTime(entry.date || new Date());
    const localOffset = offset;
    const flags = 0x0808; // UTF-8 文件名 + 数据描述符
    const localHeader = [
      u32(0x04034b50), u16(20), u16(flags), u16(0), u16(time), u16(date),
      u32(0), u32(0), u32(0), u16(name.length), u16(0), name
    ];
    await writeParts(localHeader);

    let crc = 0xffffffff;
    let size = 0;
    for await (const chunk of entry.blob.stream()) {
      if (signal?.aborted) throw abortError();
      crc = crc32Update(crc, chunk);
      size += chunk.length;
      ensureClassicZipLimit(size);
      await writeParts([chunk]);
    }
    crc = (crc ^ 0xffffffff) >>> 0;
    await writeParts([u32(0x08074b50), u32(crc), u32(size), u32(size)]);
    central.push({ name, crc, size, offset: localOffset, time, date, flags });
    completed += 1;
    onProgress?.({ completed, total, bytesWritten: offset });
  }

  if (central.length > 0xffff) throw new RangeError('ZIP 文件数量超过 65535 个');
  const cdStart = offset;
  for (const entry of central) {
    await writeParts([
      u32(0x02014b50), u16(20), u16(20), u16(entry.flags), u16(0), u16(entry.time), u16(entry.date),
      u32(entry.crc), u32(entry.size), u32(entry.size), u16(entry.name.length),
      u16(0), u16(0), u16(0), u16(0), u32(0), u32(entry.offset), entry.name
    ]);
  }
  const cdSize = offset - cdStart;
  await writeParts([
    u32(0x06054b50), u16(0), u16(0),
    u16(central.length), u16(central.length),
    u32(cdSize), u32(cdStart), u16(0)
  ]);
  return { entries: central.length, bytesWritten: offset };
}

export async function blobToU8(blob) {
  return new Uint8Array(await blob.arrayBuffer());
}
