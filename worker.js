self.onmessage = function(event) {
    if (event.data === "start") {
        setInterval(() => {
            fetch("/send-location") // This will trigger the main thread function
                .then(() => console.log("📡 Location Sent from Web Worker"))
                .catch(err => console.error("❌ Worker Error:", err));
        }, 60000);
    }
};
