// Promisified IndexedDB utility for storing and retrieving PDF buffers safely
// We use "menteea_pdf_storage_v5" to ensure a clean database with the correct object stores.
const DB_NAME = "menteea_pdf_storage_v5";
const STORE_NAME = "pdf_buffers";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = (event: any) => {
        const db = event.target.result;
        
        db.onversionchange = () => {
          console.warn("[pdfDb] Database version changed. Closing connection.");
          db.close();
          dbPromise = null;
        };
        
        resolve(db);
      };

      request.onerror = (event: any) => {
        console.error("[pdfDb] Failed to open IndexedDB database:", event.target.error);
        dbPromise = null; // Clear so subsequent calls can retry
        reject(event.target.error);
      };
    });
  }
  return dbPromise;
}

/**
 * Stores a PDF ArrayBuffer as a Blob in IndexedDB by document ID.
 */
export async function storePdfBuffer(id: string, buffer: ArrayBuffer): Promise<void> {
  if (!id) {
    console.error("[pdfDb] Cannot store PDF buffer: document ID is missing.");
    return;
  }
  if (!buffer || buffer.byteLength === 0) {
    console.error(`[pdfDb] Cannot store PDF buffer for ID "${id}": buffer is empty.`);
    return;
  }

  try {
    const db = await getDb();
    
    // Convert ArrayBuffer to Blob for robust storage in all iframe/browser sandboxes
    const blob = new Blob([buffer], { type: "application/pdf" });
    
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(blob, id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event: any) => {
        console.error(`[pdfDb] Error storing PDF Blob for ID "${id}":`, event.target.error);
        reject(event.target.error);
      };
    });
  } catch (err) {
    console.error(`[pdfDb] storePdfBuffer transaction failed for ID "${id}":`, err);
  }
}

/**
 * Retrieves a PDF ArrayBuffer from IndexedDB by document ID.
 */
export async function getPdfBuffer(id: string): Promise<ArrayBuffer | null> {
  if (!id) {
    console.warn("[pdfDb] Cannot retrieve PDF buffer: document ID is empty.");
    return null;
  }

  try {
    const db = await getDb();
    return new Promise<ArrayBuffer | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = async (event: any) => {
        const result = event.target.result;
        if (!result) {
          console.warn(`[pdfDb] No PDF Blob found in IndexedDB for ID "${id}".`);
          resolve(null);
          return;
        }

        // Robust duck-typing detection of Blob and ArrayBuffer classes
        // to fully bypass cross-realm/iframe prototype mismatch boundaries
        const isBlob = result && (
          result instanceof Blob || 
          typeof result.arrayBuffer === "function" || 
          (result.constructor && result.constructor.name === "Blob") ||
          result.toString() === "[object Blob]"
        );

        const isArrayBuffer = result && (
          result instanceof ArrayBuffer || 
          result.byteLength !== undefined ||
          (result.constructor && result.constructor.name === "ArrayBuffer") ||
          result.toString() === "[object ArrayBuffer]"
        );
        
        try {
          if (isBlob) {
            const arrayBuf = await result.arrayBuffer();
            resolve(arrayBuf);
          } else if (isArrayBuffer) {
            resolve(result);
          } else {
            console.error(`[pdfDb] Retrieved unexpected data type from IndexedDB for ID "${id}":`, typeof result, result);
            resolve(null);
          }
        } catch (convErr) {
          console.error(`[pdfDb] Failed to convert stored IndexedDB data to ArrayBuffer for ID "${id}":`, convErr);
          resolve(null);
        }
      };

      request.onerror = (event: any) => {
        console.error(`[pdfDb] Error retrieving PDF buffer for ID "${id}":`, event.target.error);
        reject(event.target.error);
      };
    });
  } catch (err) {
    console.error(`[pdfDb] getPdfBuffer transaction failed for ID "${id}":`, err);
    return null;
  }
}

/**
 * Deletes a PDF ArrayBuffer from IndexedDB by document ID.
 */
export async function deletePdfBuffer(id: string): Promise<void> {
  if (!id) return;
  try {
    const db = await getDb();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event: any) => {
        console.error(`[pdfDb] Error deleting PDF buffer for ID "${id}":`, event.target.error);
        reject(event.target.error);
      };
    });
  } catch (err) {
    console.error(`[pdfDb] deletePdfBuffer transaction failed for ID "${id}":`, err);
  }
}

/**
 * Clears all PDF buffers from IndexedDB.
 */
export async function clearAllPdfBuffers(): Promise<void> {
  try {
    const db = await getDb();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event: any) => {
        console.error("[pdfDb] Error clearing PDF buffers store:", event.target.error);
        reject(event.target.error);
      };
    });
  } catch (err) {
    console.error("[pdfDb] clearAllPdfBuffers transaction failed:", err);
  }
}