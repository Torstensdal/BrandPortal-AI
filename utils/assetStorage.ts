const DB_NAME = 'BP_PROD_V29_STABLE';
export const saveAsset = async (id: string, file: File) => {
    const db = await indexedDB.open(DB_NAME); // simplified for manifest
};
export const getAsset = async (id: string) => null;
export const getAssetUrl = async (id: string) => null;
export const setLastSession = (e: string, c?: string) => {};
export const getLastSession = async () => null;