const CACHE_NAME = "location-tracker-cache";
const FIREBASE_URL = "https://firestore.googleapis.com/v1/projects/locationsaver-b9997/databases/(default)/documents/locations";

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(["/index.html"]);
        })
    );
    console.log("✅ Service Worker Installed");
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    console.log("✅ Service Worker Activated");
    event.waitUntil(clients.claim());
});

// Send Cached Data when Online
async function sendCachedData() {
    const cache = await caches.open(CACHE_NAME);
    let savedData = await cache.match("location-data");
    if (savedData) {
        let cachedData = await savedData.json();
        for (let data of cachedData) {
            try {
                await fetch(FIREBASE_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fields: {
                            latitude: { doubleValue: data.latitude },
                            longitude: { doubleValue: data.longitude },
                            type: { stringValue: data.type },
                            timestamp: { timestampValue: new Date().toISOString() },
                            device: { stringValue: data.device },
                            ip: { stringValue: data.ip || "Unknown" }
                        }
                    })
                });
                console.log("✅ Cached location sent:", data);
            } catch (error) {
                console.error("❌ Error sending cached data:", error);
            }
        }
        await cache.delete("location-data"); // Clear cache after sending
    }
}

// When Online, Send Cached Data
self.addEventListener("sync", event => {
    if (event.tag === "sendCachedData") {
        event.waitUntil(sendCachedData());
    }
});

// Listen for Network Connection
self.addEventListener("fetch", event => {
    if (!navigator.onLine) {
        event.respondWith(
            caches.match(event.request).then(response => response || fetch(event.request))
        );
    }
});
