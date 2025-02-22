importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

// ✅ Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAB6STYBF-Fzg4U4QkET_bMej47ZUJDM4Y",
    authDomain: "locationsaver-b9997.firebaseapp.com",
    projectId: "locationsaver-b9997",
    storageBucket: "locationsaver-b9997.firebaseapp.com",
    messagingSenderId: "675975845355",
    appId: "1:675975845355:web:95cf7d6a2c255a33be35ae",
    measurementId: "G-WJJY3Q2M8E"
};

// ✅ Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

self.addEventListener('install', (event) => {
    console.log("✅ Service Worker Installed!");
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log("✅ Service Worker Activated!");
    self.clients.claim();
});

// ✅ Background Sync - Send Cached Data When Online
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
        await firebase.firestore().collection("user_data").add(data);
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
