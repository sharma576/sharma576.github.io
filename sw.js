self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// ✅ Background Sync
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-location') {
        console.log("📤 Syncing Cached Data...");
        event.waitUntil(sendCachedData());
    }
});

// ✅ Send Cached Data
async function sendCachedData() {
    let unsentData = await getCachedData();
    for (const data of unsentData) {
        try {
            await firebase.firestore().collection("user_data").add(data);
            removeFromIndexedDB(data.timestamp);
        } catch (error) {
            console.error("❌ Sync Error:", error);
        }
    }
}

// ✅ Get Cached Data from IndexedDB
function getCachedData() {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open("LocationDB", 1);
        request.onsuccess = (event) => {
            let db = event.target.result;
            let transaction = db.transaction("unsent_data", "readonly");
            let store = transaction.objectStore("unsent_data");
            let getAllRequest = store.getAll();
            getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        };
        request.onerror = () => reject("❌ Failed to Open IndexedDB");
    });
}

// ✅ Remove Synced Data from IndexedDB
function removeFromIndexedDB(timestamp) {
    let request = indexedDB.open("LocationDB", 1);
    request.onsuccess = (event) => {
        let db = event.target.result;
        let transaction = db.transaction("unsent_data", "readwrite");
        let store = transaction.objectStore("unsent_data");
        store.delete(timestamp);
    };
}
