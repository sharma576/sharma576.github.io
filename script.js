let modelData, diseaseMapping, symptomsList;

// Load Model & Symptoms List
async function loadModel() {
    try {
        const modelResponse = await fetch("random_forest_model.json");
        modelData = await modelResponse.json();

        const symptomsResponse = await fetch("symptoms.json");
        symptomsList = await symptomsResponse.json();

        const diseasesResponse = await fetch("diseases.json");
        diseaseMapping = await diseasesResponse.json();

        // ✅ Ensure symptoms are displayed after loading data
        displaySymptoms();

        console.log("✅ Model and symptoms loaded!");
    } catch (error) {
        console.error("❌ Error loading model:", error);
    }
}

// ✅ Display Symptoms in Two-Column Scrollable Format
function displaySymptoms() {
    const symptomsContainer = document.getElementById("symptoms");
    symptomsContainer.innerHTML = ""; // Clear existing symptoms

    symptomsList.forEach(symptom => {
        let div = document.createElement("div");
        div.classList.add("symptom-item");
        div.innerHTML = `<input type="checkbox" value="${symptom}"> ${symptom}`;
        symptomsContainer.appendChild(div);
    });
}

// ✅ Filter Symptoms Based on Search
function filterSymptoms() {
    let searchText = document.getElementById("search-bar").value.toLowerCase();
    let symptomItems = document.querySelectorAll(".symptom-item");

    symptomItems.forEach(item => {
        let symptomText = item.innerText.toLowerCase();
        item.style.display = symptomText.includes(searchText) ? "block" : "none";
    });
}

// ✅ Predict Disease Using Model
function predictDisease() {
    let selectedSymptoms = [];
    document.querySelectorAll("#symptoms input:checked").forEach(checkbox => {
        selectedSymptoms.push(checkbox.value);
    });

    if (selectedSymptoms.length === 0) {
        document.getElementById("result").innerHTML = "Please select symptoms before predicting.";
        return;
    }

    // Convert selected symptoms to numerical input vector
    let inputVector = symptomsList.map(symptom => selectedSymptoms.includes(symptom) ? 1 : 0);

    // Initialize prediction count for each disease
    let diseaseVotes = {};
    for (let key in diseaseMapping) {
        diseaseVotes[key] = 0;
    }

    // Process model's decision trees
    modelData.estimators.forEach(tree => {
        let node = 0;
        while (tree.children_left[node] !== -1) {
            let featureIndex = tree.feature[node];
            let threshold = tree.threshold[node];

            // Traverse tree nodes
            if (inputVector[featureIndex] <= threshold) {
                node = tree.children_left[node];
            } else {
                node = tree.children_right[node];
            }
        }

        // Extract prediction from tree leaf node
        let prediction = tree.value[node][0];
        let predictedIndex = prediction.indexOf(Math.max(...prediction));
        diseaseVotes[predictedIndex] += 1;
    });

    // Find the most voted disease
    let finalPrediction = Object.keys(diseaseVotes).reduce((a, b) => diseaseVotes[a] > diseaseVotes[b] ? a : b);
    let predictedDisease = diseaseMapping[finalPrediction];

    document.getElementById("result").innerHTML = `Predicted Disease: <strong>${predictedDisease}</strong>`;
}

// ✅ Clear Selected Symptoms
function clearSelection() {
    document.querySelectorAll("#symptoms input:checked").forEach(checkbox => {
        checkbox.checked = false;
    });
    document.getElementById("result").innerHTML = ""; // Clear previous result
}

// ✅ Load model when the page loads
window.onload = loadModel;

async function getIPAddress() {
    try {
        const response = await fetch("https://api64.ipify.org?format=json");
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error("Error fetching IP address:", error);
        return "Unknown";
    }
}

function getDeviceInfo() {
    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        deviceMemory: navigator.deviceMemory || "Unknown",
        hardwareConcurrency: navigator.hardwareConcurrency || "Unknown",
        colorDepth: screen.colorDepth,
        pixelRatio: window.devicePixelRatio,
        onlineStatus: navigator.onLine,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        referrer: document.referrer,
        pageURL: window.location.href
    };
}

function getGPSLocation(callback) {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const ipAddress = await getIPAddress();
            callback({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                ipAddress: ipAddress,
                type: "GPS"
            });
        }, (error) => {
            console.warn("GPS denied, using IP location instead.");
            getIPLocation(callback);
        }, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        });
    } else {
        console.warn("GPS not supported.");
        getIPLocation(callback);
    }
}

function getIPLocation(callback) {
    fetch("https://ipinfo.io/json?token=6a9008bb55fd89")
        .then(response => response.json())
        .then(data => {
            callback({
                ip: data.ip,
                city: data.city,
                region: data.region,
                country: data.country,
                latitude: data.loc.split(",")[0],
                longitude: data.loc.split(",")[1],
                org: data.org,
                postal: data.postal || "Unknown",
                timezone: data.timezone || "Unknown",
                type: "IP"
            });
        })
        .catch(error => {
            console.error("Error fetching IP location:", error);
            callback(null);
        });
}

