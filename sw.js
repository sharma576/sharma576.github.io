self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-location') {
        event.waitUntil(sendCachedData());
    }
});

async function sendCachedData() {
    let db = await openDB();
    let transaction = db.transaction("unsent_data", "readonly");
    let store = transaction.objectStore("unsent_data");
    let request = store.getAll();

    request.onsuccess = async () => {
        let unsentData = request.result;
        if (unsentData.length > 0) {
            for (const data of unsentData) {
                try {
                    await addDoc(collection(db, "user_data"), data);
                } catch (error) {
                    console.error("❌ Background sync failed:", error);
                    return;
                }
            }
            let clearTransaction = db.transaction("unsent_data", "readwrite");
            let clearStore = clearTransaction.objectStore("unsent_data");
            clearStore.clear();
        }
    };
}
