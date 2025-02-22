importScripts("https://cdnjs.cloudflare.com/ajax/libs/idb/7.1.1/idb.min.js");

// Open IndexedDB
const dbPromise = idb.openDB("location-db", 1, {
    upgrade(db) {
        if (!db.objectStoreNames.contains("locations")) {
            db.createObjectStore("locations", { keyPath: "cacheID" });
        }
    }
});

// Install Service Worker
self.addEventListener("install", (event) => {
    console.log("✅ Service Worker Installed");
    self.skipWaiting();
});

// Activate Service Worker
self.addEventListener("activate", (event) => {
    console.log("🚀 Service Worker Activated");
    self.clients.claim();
});

// Listen for Sync Event
self.addEventListener("sync", (event) => {
    if (event.tag === "sync-locations") {
        event.waitUntil(syncLocationData());
    }
});

// Function to Sync Cached Data
async function syncLocationData() {
    const db = await dbPromise;
    const tx = db.transaction("locations", "readonly");
    const store = tx.objectStore("locations");
    const allData = await store.getAll();

    for (let data of allData) {
        await fetch("/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        // Remove from IndexedDB after syncing
        const deleteTx = db.transaction("locations", "readwrite");
        const deleteStore = deleteTx.objectStore("locations");
        await deleteStore.delete(data.cacheID);
        console.log("✅ Synced & Deleted from DB:", data.cacheID);
    }
}
