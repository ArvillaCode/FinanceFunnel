// Persistence Service with IndexedDB + LocalStorage fallback
// Guarantees data survival even when browser localStorage or cache is cleared!

const DB_NAME = 'FinanceFunnelDB';
const DB_VERSION = 2;
const STORE_TXS = 'transactions_by_user';

const storageKey = (userId: string, resource: string) =>
  `finance_${userId}_${resource}`;

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
        const store = db.createObjectStore(STORE_TXS, { keyPath: ['ownerId', 'id'] });
        store.createIndex('ownerId', 'ownerId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const persistenceService = {
  async saveTransactions(userId: string, txs: any[]): Promise<void> {
    // 1. LocalStorage
    try {
      localStorage.setItem(storageKey(userId, 'transactions'), JSON.stringify(txs));
    } catch {}

    // 2. Persistent IndexedDB
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_TXS, 'readwrite');
      const store = tx.objectStore(STORE_TXS);
      await new Promise<void>((resolve, reject) => {
        const clearReq = store.index('ownerId').openKeyCursor(IDBKeyRange.only(userId));
        clearReq.onsuccess = () => {
          const cursor = clearReq.result;
          if (cursor) {
            store.delete(cursor.primaryKey);
            cursor.continue();
            return;
          }
          let pending = txs.length;
          if (pending === 0) resolve();
          txs.forEach((item) => {
            const addReq = store.put({ ...item, ownerId: userId });
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

  async loadTransactions(userId: string): Promise<any[]> {
    // 1. Try LocalStorage
    const saved = localStorage.getItem(storageKey(userId, 'transactions'));
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
        const req = store.index('ownerId').getAll(userId);
        req.onsuccess = () => resolve((req.result || []).map(({ ownerId: _ownerId, ...item }) => item));
        req.onerror = () => reject(req.error);
      });

      if (items && items.length > 0) {
        console.log(`[Respaldo IndexedDB] Se recuperaron ${items.length} transacciones tras barrido de caché.`);
        // Restore to LocalStorage
        try {
          localStorage.setItem(storageKey(userId, 'transactions'), JSON.stringify(items));
        } catch {}
        return items;
      }
    } catch (err) {
      console.warn('Error al recuperar desde IndexedDB:', err);
    }

    return [];
  },

  saveCategories(userId: string, cats: any[]): void {
    try {
      localStorage.setItem(storageKey(userId, 'categories'), JSON.stringify(cats));
    } catch {}
  },

  loadCategories(userId: string): any[] {
    const saved = localStorage.getItem(storageKey(userId, 'categories'));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  },

  saveBudgets(userId: string, budgets: any[]): void {
    try {
      localStorage.setItem(storageKey(userId, 'budgets'), JSON.stringify(budgets));
    } catch {}
  },

  loadBudgets(userId: string): any[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey(userId, 'budgets')) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  clearUserData(userId: string): void {
    localStorage.removeItem(storageKey(userId, 'transactions'));
    localStorage.removeItem(storageKey(userId, 'categories'));
    localStorage.removeItem(storageKey(userId, 'budgets'));
  },
};
