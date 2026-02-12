/**
 * assetStorage.ts - Hybrid lagring (IndexedDB + RAM Fallback)
 */
const DB_NAME = 'BP_PROD_V29_STABLE';
const STORE_NAME = 'media_assets';
const STATE_STORE = 'app_state';
const DB_VERSION = 29;

let dbInstance: IDBDatabase | null = null;
let inMemoryMode = false;
const ramDrive = new Map<string, any>();

/**
 * Tjekker om systemet er i nød-tilstand (RAM lagring)
 */
export const isUsingRAMDrive = () => inMemoryMode;

/**
 * Tvinger databasen til at lukke og sletter den helt.
 */
export const hardResetDatabase = async (): Promise<void> => {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
    }
    ramDrive.clear();
    localStorage.clear();
    return new Promise((resolve) => {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
    });
};

const connect = async (): Promise<IDBDatabase> => {
    if (dbInstance) return dbInstance;
    if (inMemoryMode) throw new Error("RAM Mode is active");

    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { 
            console.warn("Storage Connection Timeout - switching to RAM mode");
            inMemoryMode = true; 
            reject(new Error("Database connection timed out")); 
        }, 1500);

        try {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => { 
                clearTimeout(timeout);
                inMemoryMode = true; 
                reject(new Error("IndexedDB error")); 
            };
            
            request.onsuccess = () => { 
                clearTimeout(timeout); 
                dbInstance = request.result; 
                resolve(dbInstance); 
            };
            
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
                if (!db.objectStoreNames.contains(STATE_STORE)) db.createObjectStore(STATE_STORE);
            };
        } catch (e) { 
            clearTimeout(timeout);
            inMemoryMode = true; 
            reject(e); 
        }
    });
};

export const saveAsset = async (id: string, file: File): Promise<void> => {
    const buffer = await file.arrayBuffer();
    const data = { name: file.name, type: file.type, buffer, timestamp: Date.now() };
    
    if (inMemoryMode) { 
        ramDrive.set(`asset_${id}`, data); 
        return; 
    }
    
    try {
        const db = await connect();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(data, id);
    } catch { 
        inMemoryMode = true; 
        ramDrive.set(`asset_${id}`, data); 
    }
};

export const getAsset = async (id: string): Promise<File | null> => {
    if (inMemoryMode || ramDrive.has(`asset_${id}`)) {
        const data = ramDrive.get(`asset_${id}`);
        return data ? new File([data.buffer], data.name, { type: data.type }) : null;
    }
    
    try {
        const db = await connect();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).get(id);
            req.onsuccess = () => {
                const d = req.result;
                resolve(d ? new File([d.buffer], d.name, { type: d.type }) : null);
            };
            req.onerror = () => resolve(null);
        });
    } catch { return null; }
};

export const saveAppState = async (key: string, data: any): Promise<void> => {
    const serialized = JSON.stringify(data);
    try { localStorage.setItem(`AETHER_BKP_${key}`, serialized); } catch(e) {}
    
    if (inMemoryMode) { 
        ramDrive.set(`state_${key}`, serialized); 
        return; 
    }
    
    try {
        const db = await connect();
        const tx = db.transaction(STATE_STORE, 'readwrite');
        tx.objectStore(STATE_STORE).put(serialized, key);
    } catch { 
        inMemoryMode = true; 
        ramDrive.set(`state_${key}`, serialized); 
    }
};

export const loadAppState = async <T>(key: string): Promise<T | null> => {
    const backup = localStorage.getItem(`AETHER_BKP_${key}`);
    
    if (inMemoryMode) {
        const mem = ramDrive.get(`state_${key}`);
        const res = mem ? JSON.parse(mem) : (backup ? JSON.parse(backup) : null);
        return res;
    }
    
    try {
        const db = await connect();
        return new Promise((resolve) => {
            const tx = db.transaction(STATE_STORE, 'readonly');
            const req = tx.objectStore(STATE_STORE).get(key);
            req.onsuccess = () => resolve(req.result ? JSON.parse(req.result) : (backup ? JSON.parse(backup) : null));
            req.onerror = () => resolve(backup ? JSON.parse(backup) : null);
        });
    } catch { 
        return backup ? JSON.parse(backup) : null; 
    }
};

export const setLastSession = (email: string, companyId?: string) => 
    saveAppState('persistent_session', { email, companyId, updated: Date.now() });

export const getLastSession = () => 
    loadAppState<{ email: string, companyId?: string }>('persistent_session');

export const clearLastSession = async () => {
    localStorage.removeItem('AETHER_BKP_persistent_session');
    try {
        const db = await connect();
        const tx = db.transaction(STATE_STORE, 'readwrite');
        tx.objectStore(STATE_STORE).delete('persistent_session');
    } catch(e) {}
};