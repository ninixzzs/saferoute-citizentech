import { IncidentReport } from '../types';
import { INITIAL_INCIDENT_REPORTS } from '../data/mockData';

const DB_NAME = 'SafeRouteDB';
const DB_VERSION = 1;
const STORE_NAME = 'incidents';

/**
 * Initializes and returns the IndexedDB database instance
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado neste navegador'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('riskLevel', 'riskLevel', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });

        // Prepopulate initial records
        INITIAL_INCIDENT_REPORTS.forEach((inc) => {
          store.add(inc);
        });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export const localDb = {
  /**
   * Get all incidents from IndexedDB
   */
  async getAllIncidents(): Promise<IncidentReport[]> {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const results = request.result as IncidentReport[];
          if (!results || results.length === 0) {
            // If empty, initialize with default records
            this.populateDefaults().then(resolve).catch(reject);
          } else {
            resolve(results);
          }
        };

        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn('Erro ao acessar IndexedDB, usando fallback:', e);
      return INITIAL_INCIDENT_REPORTS;
    }
  },

  /**
   * Save or update an incident in IndexedDB
   */
  async saveIncident(incident: IncidentReport): Promise<IncidentReport> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(incident);

      request.onsuccess = () => resolve(incident);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Delete an incident from IndexedDB
   */
  async deleteIncident(id: string): Promise<boolean> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Reset database back to default initial incidents
   */
  async populateDefaults(): Promise<IncidentReport[]> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();

      INITIAL_INCIDENT_REPORTS.forEach((inc) => {
        store.put(inc);
      });

      transaction.oncomplete = () => resolve(INITIAL_INCIDENT_REPORTS);
      transaction.onerror = () => reject(transaction.error);
    });
  },
};
