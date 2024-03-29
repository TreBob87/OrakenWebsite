// Import the Firebase modules you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js';
import { getDatabase, ref, set, get, remove, onValue } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js';

// Firebase configuration
const firebaseConfig = {
    // ...
    // The value of `databaseURL` depends on the location of the database
    apiKey: "AIzaSyDg54uaZXT-xLEVFIfqmsLtxt0T_424KIQ",
    authDomain: "oraken-kart-counter.firebaseapp.com",
    projectId: "oraken-kart-counter",
    storageBucket: "oraken-kart-counter.appspot.com",
    messagingSenderId: "670891246010",
    appId: "1:670891246010:web:ce13d39cb484cf34efdd83",
    databaseURL: "https://oraken-kart-counter-default-rtdb.europe-west1.firebasedatabase.app/",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
// Call displayTeamCarUsage on page load
window.onload = function()
{
    displayTeamCarUsage()
}
async function displayTeamCarUsage() {
    const dbRef = ref(database, 'teamCarUsage');
    try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            const teamCarUsage = snapshot.val();  // Gets the actual data from Firebase
            let content = '<ul>';
            for (const [team, cars] of Object.entries(teamCarUsage)) {
                content += `<li><strong>${team}:</strong> ${cars.join(', ')}</li>`;
            }
            content += '</ul>';
            document.getElementById('carUsageDisplay').innerHTML = content;
        } else {
            document.getElementById('carUsageDisplay').innerHTML = '<p>No car usage data available.</p>';
        }
    } catch (error) {
        console.error('Failed to load team car usage:', error);
    }
}
