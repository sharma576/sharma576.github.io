self.addEventListener('install', (event) => {
    console.log("✅ Service Worker Installed!");
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log("✅ Service Worker Activated!");
    self.clients.claim();
});

// Sync Cached Data When Online
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-location') {
        console.log("📤 Syncing Cached Data...");
        event.waitUntil(sendCachedData());
    }
});

// Open IndexedDB
function openDB() {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open("LocationDB", 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("❌ Failed to open IndexedDB");
    });
}

// Send Cached Data
async function sendCachedData() {
    let db = await openDB();
    let transaction = db.transaction("unsent_data", "readonly");
    let store = transaction.objectStore("unsent_data");
    let request = store.getAll();

    request.onsuccess = async () => {
        let unsentData = request.result;
        if (unsentData.length > 0) {
            for (const data of unsentData) {
                await fetch('https://your-firebase-endpoint.com', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
            }
            let clearTransaction = db.transaction("unsent_data", "readwrite");
            let clearStore = clearTransaction.objectStore("unsent_data");
            clearStore.clear();
        }
    };
}
