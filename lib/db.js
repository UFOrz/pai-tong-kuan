// 相册数据库：基于 IndexedDB，扩展内各页面（面板/相册）共享同一数据库
// 记录结构：
// {
//   id, createdAt,
//   prompt,            // 实际用于生成的提示词（可能被用户编辑过）
//   sourcePrompt,      // 反推得到的原始提示词
//   promptZh,          // 反推得到的中文解读
//   provider, model,   // 生成平台 / 模型
//   width, height, ratio, size,  // 尺寸像素 / 比例 / 请求尺寸
//   srcUrl, pageUrl, sourceAssetId, // 来源图片地址 / 所在页面 / 对比素材引用
//   sourceBlob,         // v1/v2 旧记录的内嵌原图，继续兼容读取
//   blob               // 图片二进制（Blob）
// }

const DB_NAME = 'ir-gallery';
const DB_VERSION = 3;
const STORE = 'images';
const CHARACTER_STORE = 'characters';
const ASSET_STORE = 'assets';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains(CHARACTER_STORE)) {
        const characters = db.createObjectStore(CHARACTER_STORE, { keyPath: 'id' });
        characters.createIndex('createdAt', 'createdAt');
        characters.createIndex('albumRecordId', 'albumRecordId');
      } else {
        const characters = req.transaction.objectStore(CHARACTER_STORE);
        if (!characters.indexNames.contains('albumRecordId')) {
          characters.createIndex('albumRecordId', 'albumRecordId');
        }
      }
      if (!db.objectStoreNames.contains(ASSET_STORE)) {
        const assets = db.createObjectStore(ASSET_STORE, { keyPath: 'id' });
        assets.createIndex('createdAt', 'createdAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    const result = fn(store);
    t.oncomplete = () => resolve(result?.result ?? result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function addRecord(rec) {
  const db = await openDB();
  await tx(db, 'readwrite', (s) => s.put(rec));
  db.close();
  return rec.id;
}

export async function addRecordWithSource(rec, sourceBlob = null, sourceAssetId = '') {
  const db = await openDB();
  const stores = sourceAssetId ? [STORE, ASSET_STORE] : [STORE];
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(stores, 'readwrite');
    const record = { ...rec };
    delete record.sourceBlob;
    if (sourceAssetId) record.sourceAssetId = sourceAssetId;
    transaction.objectStore(STORE).put(record);
    if (sourceAssetId) {
      const assets = transaction.objectStore(ASSET_STORE);
      const request = assets.get(sourceAssetId);
      request.onsuccess = () => {
        const existing = request.result;
        if (existing) {
          assets.put({ ...existing, refCount: Math.max(0, Number(existing.refCount) || 0) + 1 });
        } else if (sourceBlob) {
          assets.put({
            id: sourceAssetId,
            createdAt: Date.now(),
            refCount: 1,
            blob: sourceBlob
          });
        }
      };
    }
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  db.close();
  return rec.id;
}

export async function getAll() {
  const db = await openDB();
  const list = await reqToPromise(db.transaction(STORE).objectStore(STORE).getAll());
  db.close();
  return (list || []).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getAllRecordIds() {
  const db = await openDB();
  const ids = [];
  await new Promise((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).index('createdAt').openKeyCursor(null, 'prev');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return resolve();
      ids.push(cursor.primaryKey);
      cursor.continue();
    };
  });
  db.close();
  return ids;
}

export async function getRecordsByIds(ids = []) {
  if (!ids.length) return [];
  const db = await openDB();
  const store = db.transaction(STORE).objectStore(STORE);
  const records = await Promise.all(ids.map((id) => reqToPromise(store.get(id))));
  db.close();
  return records.filter(Boolean);
}

function matchesQuery(record, query) {
  if (!query) return true;
  const haystack = [record.prompt, record.promptZh, record.model, record.provider]
    .map((value) => String(value || '').toLowerCase())
    .join('\n');
  return haystack.includes(query);
}

export async function getPage({ offset = 0, limit = 48, query = '' } = {}) {
  const db = await openDB();
  const normalizedOffset = Math.max(0, Number(offset) || 0);
  const normalizedLimit = Math.max(1, Math.min(100, Number(limit) || 48));
  const normalizedQuery = String(query || '').trim().toLowerCase();
  const records = [];
  let skipped = 0;
  let hasMore = false;
  await new Promise((resolve, reject) => {
    const store = db.transaction(STORE).objectStore(STORE);
    const request = store.index('createdAt').openCursor(null, 'prev');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return resolve();
      if (!matchesQuery(cursor.value, normalizedQuery)) {
        cursor.continue();
        return;
      }
      if (skipped < normalizedOffset) {
        skipped += 1;
        cursor.continue();
        return;
      }
      if (records.length < normalizedLimit) {
        records.push(cursor.value);
        cursor.continue();
        return;
      }
      hasMore = true;
      resolve();
    };
  });
  db.close();
  return { records, hasMore };
}

export async function getById(id) {
  const db = await openDB();
  const rec = await reqToPromise(db.transaction(STORE).objectStore(STORE).get(id));
  db.close();
  return rec;
}

export async function getSourceBlob(rec) {
  if (rec?.sourceBlob) return rec.sourceBlob;
  if (!rec?.sourceAssetId) return null;
  const db = await openDB();
  const asset = await reqToPromise(db.transaction(ASSET_STORE).objectStore(ASSET_STORE).get(rec.sourceAssetId));
  db.close();
  return asset?.blob || null;
}

export async function removeMany(ids) {
  const db = await openDB();
  const readStore = db.transaction(STORE).objectStore(STORE);
  const records = await Promise.all(ids.map((id) => reqToPromise(readStore.get(id))));
  const assetDecrements = new Map();
  for (const record of records) {
    if (!record?.sourceAssetId) continue;
    assetDecrements.set(record.sourceAssetId, (assetDecrements.get(record.sourceAssetId) || 0) + 1);
  }
  await new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE, ASSET_STORE], 'readwrite');
    const images = transaction.objectStore(STORE);
    const assets = transaction.objectStore(ASSET_STORE);
    for (const id of ids) images.delete(id);
    for (const [assetId, decrement] of assetDecrements) {
      const assetRequest = assets.get(assetId);
      assetRequest.onsuccess = () => {
        const asset = assetRequest.result;
        if (!asset) return;
        const nextCount = Math.max(0, Number(asset.refCount) || 0) - decrement;
        if (nextCount === 0) assets.delete(assetId);
        else assets.put({ ...asset, refCount: nextCount });
      };
    }
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  db.close();
}

export async function countAll(query = '') {
  const db = await openDB();
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) {
    const n = await reqToPromise(db.transaction(STORE).objectStore(STORE).count());
    db.close();
    return n;
  }
  let n = 0;
  await new Promise((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).openCursor();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return resolve();
      if (matchesQuery(cursor.value, normalizedQuery)) n += 1;
      cursor.continue();
    };
  });
  db.close();
  return n;
}

export async function addCharacter(rec) {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(CHARACTER_STORE, 'readwrite');
    transaction.objectStore(CHARACTER_STORE).put(rec);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  db.close();
  return rec.id;
}

export async function addCharacterFromAlbumUnique(rec) {
  const db = await openDB();
  const result = await new Promise((resolve, reject) => {
    const transaction = db.transaction(CHARACTER_STORE, 'readwrite');
    const store = transaction.objectStore(CHARACTER_STORE);
    const albumRecordId = String(rec.albumRecordId || '');
    const request = albumRecordId
      ? store.index('albumRecordId').get(albumRecordId)
      : null;
    let outcome = { id: rec.id, created: true };
    const insert = () => store.put(rec);
    if (request) {
      request.onsuccess = () => {
        if (request.result) outcome = { id: request.result.id, created: false };
        else insert();
      };
      request.onerror = () => reject(request.error);
    } else {
      insert();
    }
    transaction.oncomplete = () => resolve(outcome);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  db.close();
  return result;
}

export async function getCharacters() {
  const db = await openDB();
  const list = await reqToPromise(db.transaction(CHARACTER_STORE).objectStore(CHARACTER_STORE).getAll());
  db.close();
  return (list || []).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getCharacterById(id) {
  const db = await openDB();
  const rec = await reqToPromise(db.transaction(CHARACTER_STORE).objectStore(CHARACTER_STORE).get(id));
  db.close();
  return rec;
}

export async function getCharacterByAlbumRecordId(albumRecordId) {
  if (!albumRecordId) return null;
  const db = await openDB();
  const rec = await reqToPromise(
    db.transaction(CHARACTER_STORE).objectStore(CHARACTER_STORE).index('albumRecordId').get(albumRecordId)
  );
  db.close();
  return rec || null;
}

export async function removeCharacters(ids) {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(CHARACTER_STORE, 'readwrite');
    const store = transaction.objectStore(CHARACTER_STORE);
    for (const id of ids) store.delete(id);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  db.close();
}
