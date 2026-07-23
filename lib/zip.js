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
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosDateTime(d = new Date()) {
  const time = ((d.getHours() & 31) << 11) | ((d.getMinutes() & 63) << 5) | ((d.getSeconds() >> 1) & 31);
  const date = (((d.getFullYear() - 1980) & 127) << 9) | (((d.getMonth() + 1) & 15) << 5) | (d.getDate() & 31);
  return { time, date };
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

  const u16 = (v) => new Uint8Array([v & 255, (v >> 8) & 255]);
  const u32 = (v) => new Uint8Array([v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255]);

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
    offset += local.reduce((n, p) => n + p.length, 0);
  }

  const cdStart = offset;
  for (const c of central) {
    const rec = [
      u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(time), u16(date),
      u32(c.crc), u32(c.size), u32(c.size), u16(c.name.length),
      u16(0), u16(0), u16(0), u16(0), u32(0), u32(c.offset), c.name
    ];
    parts.push(...rec);
    offset += rec.reduce((n, p) => n + p.length, 0);
  }
  const cdSize = offset - cdStart;

  parts.push(
    u32(0x06054b50), u16(0), u16(0),
    u16(central.length), u16(central.length),
    u32(cdSize), u32(cdStart), u16(0)
  );

  return new Blob(parts, { type: 'application/zip' });
}

export async function blobToU8(blob) {
  return new Uint8Array(await blob.arrayBuffer());
}
