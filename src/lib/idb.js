/* Minimal IndexedDB wrapper for caregiver media (photos, recorded audio).
   Blobs don't fit in localStorage; everything else lives there. */

const DB_NAME = 'aacash';
const STORE = 'media';

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    const req = fn(store);
    t.oncomplete = () => resolve(req?.result);
    t.onerror = () => reject(t.error);
  });
}

export const mediaPut = (key, blob) => tx('readwrite', (s) => s.put(blob, key));
export const mediaGet = (key) => tx('readonly', (s) => s.get(key));
export const mediaDelete = (key) => tx('readwrite', (s) => s.delete(key));
export const mediaKeys = () => tx('readonly', (s) => s.getAllKeys());

export function newMediaKey(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
