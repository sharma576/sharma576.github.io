const CACHE_NAME = "location-cache";
const API_URL = "https://firestore.googleapis.com/v1/projects/locationsaver-b9997/databases/(default)/documents/user_locations";

// Install Service Worker
self.addEventListener("install", (event) => {
    console.log("✅ Service Worker Installed");
    self.skipWaiting();
});

// Activate Service Worker
self.addEventListener("activate", (event) => {
    console.log("✅ Service Worker Activated");
    self.clients.claim();
});

// Periodic Background Sync
self.addEventListener("periodicsync", async (event) => {
    if (event.tag === "sync-location") {
        event.waitUntil(syncLocation());
    }
});

// Function to Sync Cached Data to Firebase
async function syncLocation() {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match("/location.json");
    if (response) {
        const locationData = await response.json();
        console.log("📤 Syncing Cached Location:", locationData);

        // Send to Firebase
        await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ fields: { location: { stringValue: JSON.stringify(locationData) } } })
        });

        console.log("✅ Cached Location Synced to Firebase");
    }
}

// Listen for Fetch Events
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
