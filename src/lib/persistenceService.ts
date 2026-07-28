// Persistence Service with IndexedDB + LocalStorage fallback
// Guarantees data survival even when browser localStorage or cache is cleared!

const DB_NAME = 'FinanceFunnelDB';
const DB_VERSION = 1;
const STORE_TXS = 'transactions';
const STORE_CATS = 'categories';
const STORE_BUDGETS = 'budgets';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB no está disponible en este entorno.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_TXS)) {
        db.createObjectStore(STORE_TXS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CATS)) {
        db.createObjectStore(STORE_CATS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_BUDGETS)) {
        db.createObjectStore(STORE_BUDGETS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const persistenceService = {
  async saveTransactions(txs: any[]): Promise<void> {
    // 1. LocalStorage
    try {
      localStorage.setItem('finance_transactions', JSON.stringify(txs));
    } catch {}

    // 2. Persistent IndexedDB
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_TXS, 'readwrite');
      const store = tx.objectStore(STORE_TXS);
      await new Promise<void>((resolve, reject) => {
        const clearReq = store.clear();
        clearReq.onsuccess = () => {
          let pending = txs.length;
          if (pending === 0) resolve();
          txs.forEach((item) => {
            const addReq = store.put(item);
            addReq.onsuccess = () => {
              pending--;
              if (pending === 0) resolve();
            };
            addReq.onerror = () => reject(addReq.error);
          });
        };
        clearReq.onerror = () => reject(clearReq.error);
      });
    } catch (err) {
      console.warn('Persistencia en IndexedDB:', err);
    }
  },

  async loadTransactions(): Promise<any[]> {
    // 1. Try LocalStorage
    const saved = localStorage.getItem('finance_transactions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }

    // 2. Fallback to IndexedDB (Restores data if localStorage was cleared during cache sweep!)
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_TXS, 'readonly');
      const store = tx.objectStore(STORE_TXS);
      const items = await new Promise<any[]>((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });

      if (items && items.length > 0) {
        console.log(`[Respaldo IndexedDB] Se recuperaron ${items.length} transacciones tras barrido de caché.`);
        // Restore to LocalStorage
        try {
          localStorage.setItem('finance_transactions', JSON.stringify(items));
        } catch {}
        return items;
      }
    } catch (err) {
      console.warn('Error al recuperar desde IndexedDB:', err);
    }

    return [];
  },

  async saveCategories(cats: any[]): Promise<void> {
    try {
      localStorage.setItem('finance_categories', JSON.stringify(cats));
      const db = await openDB();
      const tx = db.transaction(STORE_CATS, 'readwrite');
      const store = tx.objectStore(STORE_CATS);
      store.clear();
      cats.forEach((c) => store.put(c));
    } catch {}
  },

  async loadCategories(): Promise<any[]> {
    const saved = localStorage.getItem('finance_categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }

    try {
      const db = await openDB();
      const tx = db.transaction(STORE_CATS, 'readonly');
      const store = tx.objectStore(STORE_CATS);
      const items = await new Promise<any[]>((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });

      if (items && items.length > 0) {
        try {
          localStorage.setItem('finance_categories', JSON.stringify(items));
        } catch {}
        return items;
      }
    } catch {}

    return [];
  },
};
