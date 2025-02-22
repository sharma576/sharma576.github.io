const CACHE_NAME = "location-tracker-cache-v1";
const FIREBASE_URL = "https://firestore.googleapis.com/v1/projects/locationsaver-b9997/databases/(default)/documents/locations";

// Install Service Worker & Cache Files
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(["/index.html"]);
        })
    );
    console.log("✅ Service Worker Installed");
    self.skipWaiting();
});

// Activate Service Worker & Cleanup Old Caches
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log("🧹 Deleting old cache:", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    console.log("✅ Service Worker Activated");
    self.clients.claim();
});

// Fetch Event - Serve Cache When Offline
self.addEventListener("fetch", event => {
    if (!navigator.onLine) {
        event.respondWith(
            caches.match(event.request).then(response => response || fetch(event.request))
        );
    }
});

// Function to Send Cached Data
async function sendCachedData() {
    const cache = await caches.open(CACHE_NAME);
    let savedData = await cache.match("location-data");
    if (savedData) {
        let cachedData = await savedData.json();
        for (let data of cachedData) {
            try {
                let response = await fetch(FIREBASE_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fields: {
                            latitude: { doubleValue: data.latitude },
                            longitude: { doubleValue: data.longitude },
                            type: { stringValue: data.type },
                            timestamp: { timestampValue: new Date().toISOString() },
                            device: { stringValue: JSON.stringify(data.device) },
                            ip: { stringValue: data.ip || "Unknown" }
                        }
                    })
                });
                if (response.ok) {
                    console.log("✅ Cached location sent successfully:", data);
                } else {
                    console.error("❌ Failed to send cached data:", response.status);
                }
            } catch (error) {
                console.error("❌ Network error sending cached data:", error);
            }
        }
        await cache.delete("location-data"); // Clear cache after sending
    }
}

// Background Sync Event (Sends Data When Online)
self.addEventListener("sync", event => {
    if (event.tag === "sendCachedData") {
        event.waitUntil(sendCachedData());
    }
});

// Listen for Network Reconnection
self.addEventListener("message", event => {
    if (event.data === "online") {
        sendCachedData();
    }
});
