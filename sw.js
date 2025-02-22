const CACHE_NAME = "location-cache-v1";
const FIREBASE_URL = "https://firestore.googleapis.com/v1/projects/locationsaver-b9997/databases/(default)/documents/locations
"; // Replace with your Firestore endpoint

self.addEventListener("install", event => {
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    clients.claim();
});

self.addEventListener("message", async event => {
    if (event.data.action === "SAVE_LOCATION") {
        const locationData = event.data.data;
        const cache = await caches.open(CACHE_NAME);
        const storedLocations = await cache.match("locations");
        let locations = storedLocations ? await storedLocations.json() : [];

        locations.push(locationData);
        await cache.put("locations", new Response(JSON.stringify(locations)));

        if (navigator.onLine) {
            sendCachedData();
        }
    }
});

async function sendCachedData() {
    const cache = await caches.open(CACHE_NAME);
    const storedLocations = await cache.match("locations");

    if (storedLocations) {
        const locations = await storedLocations.json();
        if (locations.length > 0) {
            try {
                await fetch(FIREBASE_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ locations })
                });

                await cache.delete("locations");
                console.log("✅ Sent Cached Data");
            } catch (error) {
                console.error("❌ Failed to Send Data:", error);
            }
        }
    }
}

self.addEventListener("sync", event => {
    if (event.tag === "sync-locations") {
        event.waitUntil(sendCachedData());
    }
});

self.addEventListener("fetch", event => {
    if (event.request.url.includes("/send-location")) {
        event.respondWith(new Response(null, { status: 204 }));
    }
});
