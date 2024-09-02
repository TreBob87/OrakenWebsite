import { ref, get } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { database, auth} from "./firebase.js";

onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
        const uid = user.uid;
        console.log(uid);

        // ...
    } else {
        // User is signed out
        window.location.href = 'login.html'
    }
});

// Call displayTeamCarUsage on page load
window.onload = function()
{
    displayTeamCarUsage()
    displayTeamKartUsage()

    document.getElementById('dubai').addEventListener('click', exportTeamCarUsage)
    document.getElementById('kt').addEventListener('click', exportTeamKartUsage)
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

async function displayTeamKartUsage() {
    const dbRef = ref(database, 'teamKartUsage');
    try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            const teamKartUsage = snapshot.val();  // Gets the actual data from Firebase
            let content = '<ul>';
            for (const [team, cars] of Object.entries(teamKartUsage)) {
                content += `<li><strong>${team}:</strong> ${cars.join(', ')}</li>`;
            }
            content += '</ul>';
            document.getElementById('kartUsageDisplay').innerHTML = content;
        } else {
            document.getElementById('kartUsageDisplay').innerHTML = '<p>No car usage data available.</p>';
        }
    } catch (error) {
        console.error('Failed to load team car usage:', error);
    }
}

async function exportTeamCarUsage() {
    const dbRef = ref(database, 'teamCarUsage');
    try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            const loadedData = snapshot.val();  // Gets the actual data from Firebase
            const teamCarUsageCSV = convertTeamCarUsageToCSV(loadedData);
            downloadCSV(teamCarUsageCSV, "teamCarUsage.csv");
        } else {
            document.getElementById('carUsageDisplay').innerHTML = '<p>No car usage data available.</p>';
        }
    } catch (error) {
        console.error('Failed to load team car usage:', error);
    }
}
function convertTeamCarUsageToCSV(teamCarUsage) {
    let csvContent = "Car ID,Colors\n"; // Start with the header

    // Build CSV content
    Object.entries(teamCarUsage).forEach(([carId, colors]) => {
        let colorString = colors.join(';');
        csvContent += `${carId},${colorString}\n`;
    });

    // Convert to Blob
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

async function exportTeamKartUsage() {
    const dbRef = ref(database, 'teamKartUsage');
    try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            const loadedData = snapshot.val();  // Gets the actual data from Firebase
            const teamKartUsageCSV = convertTeamKartUsageToCSV(loadedData);
            downloadCSV(teamKartUsageCSV, "teamKartUsage.csv");
        } else {
            document.getElementById('kartUsageDisplay').innerHTML = '<p>No car usage data available.</p>';
        }
    } catch (error) {
        console.error('Failed to load team car usage:', error);
    }
}

function convertTeamKartUsageToCSV(teamKartUsage) {
    let csvContent = "Car ID,Colors\n"; // Start with the header

    // Build CSV content
    Object.entries(teamKartUsage).forEach(([carId, colors]) => {
        let colorString = colors.join(';');
        csvContent += `${carId},${colorString}\n`;
    });

    // Convert to Blob
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

function downloadCSV(csvBlob, fileName) {
    // Create an object URL for the blob
    let url = URL.createObjectURL(csvBlob);
    let link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up
}