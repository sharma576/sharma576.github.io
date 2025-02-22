const CACHE_NAME = "location-cache-v1";

// Install Service Worker
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(["/", "/index.html"]);
        })
    );
    console.log("✅ Service Worker Installed");
});

// Fetch Event - Serve from Cache
self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});

// Background Sync for Location
self.addEventListener("sync", event => {
    if (event.tag === "send-location") {
        event.waitUntil(sendLocationData());
    }
});

// Send Location Data to Server
async function sendLocationData() {
    let location = await getGPSLocation();
    if (location) {
        fetch("https://firestore.googleapis.com/v1/projects/locationsaver-b9997/databases/(default)/documents/user_data", {
            method: "POST",
            body: JSON.stringify(location),
            headers: { "Content-Type": "application/json" }
        }).then(() => {
            console.log("✅ Location sent in background");
        }).catch(error => {
            console.error("❌ Failed to send location:", error);
        });
    }
}

// Function to get GPS location
function getGPSLocation() {
    return new Promise((resolve, reject) => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(position => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    time: new Date().toISOString()
                });
            }, () => {
                console.warn("❌ GPS Denied");
                resolve(null);
            });
        } else {
            console.warn("❌ GPS Not Supported");
            resolve(null);
        }
    });
}
