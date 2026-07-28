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
