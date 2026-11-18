import type { LibraryState } from '../types';

const STATE_KEY = 'borba-umov-library-v1';
const DB_NAME = 'borba-umov-files';
const STORE_NAME = 'files';

export const emptyState: LibraryState = {
  books: [],
  favorites: [],
  library: [],
  progress: {},
  bookmarks: [],
  highlights: [],
  annotations: [],
  searchHistory: [],
  displayName: 'Читатель',
};

export function loadLocalState(): LibraryState {
  try {
    const saved = localStorage.getItem(STATE_KEY);
    return saved ? { ...emptyState, ...JSON.parse(saved) } : emptyState;
  } catch {
    return emptyState;
  }
}

export function saveLocalState(state: LibraryState) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function putFile(key: string, file: Blob) {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(file, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getFile(key: string): Promise<Blob | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteFiles(keys: (string | null)[]) {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    keys.filter(Boolean).forEach((key) => store.delete(key as string));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
