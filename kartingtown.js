// Import the Firebase modules you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, set, get, remove, onValue } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";


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
const auth = getAuth(app);
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

async function loadKartCounts() {
    const kartsOnTrackRef = ref(database, 'kartsOnTrackCountKT');
    const kartsInPitRef = ref(database, 'kartsInPitCountKT');

    try {
        const kartsOnTrackKTSnapshot = await get(kartsOnTrackRef);
        const kartsInPitKTSnapshot = await get(kartsInPitRef);

        const kartsOnTrackCountKT = kartsOnTrackKTSnapshot.val() || 45; // Default to 45 if not found
        const kartsInPitCountKT = kartsInPitKTSnapshot.val() || 5; // Default to 5 if not found

        return { kartsOnTrackCountKT, kartsInPitCountKT };
    } catch (error) {
        console.error('Error fetching kart counts from Firebase:', error);
        return { kartsOnTrackCount: 15, kartsInPitCount: 3 };
    }
}

window.onload = async function() {
    loadTeamKartUsage()
    // Load counts from Firebase database
    const { kartsOnTrackCountKT, kartsInPitCountKT } = await loadKartCounts();

    // Use the loaded counts to create boxes
    createBoxes('kartsOnTrackKT', kartsOnTrackCountKT);
    createBoxes('kartsInPitKT', kartsInPitCountKT);
    loadBoxColors();

    // Add event listeners
    document.getElementById('kartPerformance').addEventListener('click', pickColor);
    document.getElementById('kartsOnTrackKT').addEventListener('click', handleBoxClick);
    document.getElementById('kartsInPitKT').addEventListener('click', handleBoxClick);

    // Add an event listener to the document body
    document.body.addEventListener('click', function(event) {
        if (!event.target.classList.contains('box')) {
            selectedColor = '';
            document.body.style.cursor = 'default'; // Reset the cursor
        }
    });

    //Reset button
    document.getElementById('resetButton').addEventListener('click', resetColors);
    document.addEventListener('click', () => {
        document.querySelectorAll('.box.highlighted').forEach(box => {
            box.classList.remove('highlighted');
        });
        selectedColor = '';
        document.body.style.cursor = 'default';  // Reset the cursor
    });

};

let selectedColor = '';
let lastClickedBox = { track: null, pit: null };
let teamKartUsage = {}; // Object to track kart usage by teams


async function resetColors() {
    if (confirm('Are you sure you want to reset all colors and change the number of karts?')) {
        try {
            // Ask and validate the new counts
            const kartsOnTrackCountKT = parseInt(prompt("Enter the number of Karts-on-Track:", "15"), 10);
            const kartsInPitCountKT = parseInt(prompt("Enter the number of Karts-in-Pit:", "3"), 10);

            const validKartsOnTrackCountKT = isNaN(kartsOnTrackCountKT) ? 15 : kartsOnTrackCountKT;
            const validKartsInPitCountKT = isNaN(kartsInPitCountKT) ? 3 : kartsInPitCountKT;

            await set(ref(database, 'kartsOnTrackCountKT'), validKartsOnTrackCountKT);
            await set(ref(database, 'kartsInPitCountKT'), validKartsInPitCountKT);

            await remove(ref(database, 'boxColorsKT')); // Remove box colors from database

            teamKartUsage = {};
            await saveTeamKartUsage(); // Save the reset state to Firebase

            document.getElementById('kartsOnTrackKT').innerHTML = '';
            document.getElementById('kartsInPitKT').innerHTML = '';

            createBoxes('kartsOnTrackKT', validKartsOnTrackCountKT);
            createBoxes('kartsInPitKT', validKartsInPitCountKT);
        } catch (error) {
            console.error('Failed to reset colors:', error);
        }
    }
}

function handleBoxClick(event) {
    if (event.target.classList.contains('box')) {

        // Remove highlighting when a box in the track or pit is clicked
        document.querySelectorAll('.box.highlighted').forEach(box => {
            box.classList.remove('highlighted');
        });
        // Vibrate the device for 50 milliseconds as feedback on box click
        if (navigator.vibrate) {
            navigator.vibrate(50); // You can adjust the duration as needed
        }

        if (selectedColor && event.target.parentNode.id === 'kartsOnTrackKT') {
            // Apply selected color and reset
            event.target.style.backgroundColor = selectedColor;
            saveBoxColor(event.target); // Save the color change

            // Update teamkartUsage with the new color
            const teamNumber = event.target.textContent;
            if (teamKartUsage[teamNumber]) {
                // Assuming the last entry should be updated with the new color
                teamKartUsage[teamNumber][teamKartUsage[teamNumber].length - 1] = event.target.getAttribute('data-kart-id') + " " + selectedColor;
                saveTeamKartUsage(); // Save the updated team kart usage
            }

            selectedColor = '';
            document.body.style.cursor = 'default'; // Reset cursor to default
        }
        else if (selectedColor && event.target.parentNode.id === 'kartsInPitKT') {
            event.target.style.backgroundColor = selectedColor;
            saveBoxColor(event.target); // Save the color change
            selectedColor = '';
            document.body.style.cursor = 'default'; // Reset cursor to default
        }

        else {
            // Proceed with swap logic if no color is selected
            if (event.target.parentNode.id === 'kartsOnTrackKT') {
                moveColors(event.target);
            }
        }
    }
}


function moveColors(selectedTrackBox) {
    const pitBoxes = document.querySelectorAll('#kartsInPitKT .box');
    if (pitBoxes.length === 0) return;

    // Store the first pit box's color and kart ID to cycle through
    const firstPitBoxColor = pitBoxes[0].style.backgroundColor;
    let firstPitBoxkartId = pitBoxes[0].getAttribute('data-kart-id');

    // Move colors and IDs through pit boxes
    for (let i = 0; i < pitBoxes.length - 1; i++) {
        pitBoxes[i].style.backgroundColor = pitBoxes[i + 1].style.backgroundColor;
        pitBoxes[i].setAttribute('data-kart-id', pitBoxes[i + 1].getAttribute('data-kart-id'));
        saveBoxColor(pitBoxes[i]);
    }

    // Update the last pit box with the selected track box's color and ID
    pitBoxes[pitBoxes.length - 1].style.backgroundColor = selectedTrackBox.style.backgroundColor;
    pitBoxes[pitBoxes.length - 1].setAttribute('data-kart-id', selectedTrackBox.getAttribute('data-kart-id'));
    saveBoxColor(pitBoxes[pitBoxes.length - 1]);

    // Update the selected track box with the first pit box's color and stored ID
    selectedTrackBox.style.backgroundColor = firstPitBoxColor;
    selectedTrackBox.setAttribute('data-kart-id', firstPitBoxkartId);
    saveBoxColor(selectedTrackBox);

    // Optionally update teamkartUsage to reflect the change
    updateTeamKartUsageAfterMove(selectedTrackBox, pitBoxes);
}

function updateTeamKartUsageAfterMove(selectedTrackBox) {
    // Extract team number from the selected track box's content
    const teamNumber = selectedTrackBox.textContent;

    // Ensure there's an entry for this team number
    if (!teamKartUsage[teamNumber]) {
        teamKartUsage[teamNumber] = [];
    }

    // Update teamkartUsage with the new kart ID for this team
    teamKartUsage[teamNumber].push(selectedTrackBox.getAttribute('data-kart-id') + " " + selectedTrackBox.style.backgroundColor);

    // Save the updated teamkartUsage
    saveTeamKartUsage();
}



function pickColor(event) {
    if (event.target.classList.contains('box')) {
        // Remove highlighting from any previously selected box
        document.querySelectorAll('.box.highlighted').forEach(box => {
            box.classList.remove('highlighted');
        });

        selectedColor = event.target.style.backgroundColor;
        createCustomCursor(selectedColor);

        // Highlight the selected box
        event.target.classList.add('highlighted');

        lastClickedBox.track = null;
        lastClickedBox.pit = null;

        // Prevent event from bubbling to the document, where it could be deselected
        event.stopPropagation();
    }
}


function createCustomCursor(color) {
    const cursorSize = 20; // Size of the cursor
    const canvas = document.createElement('canvas');
    canvas.width = cursorSize;
    canvas.height = cursorSize;
    const ctx = canvas.getContext('2d');

    // Draw the cursor
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, cursorSize, cursorSize);

    // Set the custom cursor
    const cursorUrl = canvas.toDataURL();
    document.body.style.cursor = `url(${cursorUrl}) ${cursorSize / 2} ${cursorSize / 2}, auto`;
}

function createBoxes(containerId, count) {
    const container = document.getElementById(containerId);
    let startId = 0;
    if (containerId === 'kartsInPit') {
        // Adjust the startId for kartsInPit based on kartsOnTrack
        const kartsOnTrack = document.querySelectorAll('#kartsOnTrack .box');
        if (kartsOnTrack.length > 0) {
            const lastKartOnTrackId = parseInt(kartsOnTrack[kartsOnTrack.length - 1].getAttribute('data-kart-id'));
            startId = lastKartOnTrackId;
        }
    }

    for (let i = 1; i < count + 1; i++) {
        const box = document.createElement('div');
        box.classList.add('box');
        const kartId = startId + i;
        box.id = `${containerId}-${kartId}`;
        box.setAttribute('data-kart-id', kartId.toString());
        box.style.backgroundColor = 'grey';

        if (containerId === 'kartsOnTrackKT') {
            box.textContent = i;
            // Initialize or update the team's initial kart in teamkartUsage
            if (!teamKartUsage[i]) {
                teamKartUsage[i] = [kartId.toString()];
            }
        } else {
            box.textContent = i;
        }

        container.appendChild(box);

        if (containerId === 'kartsOnTrackKT') {
            if (i % 5 === 0) {
                container.appendChild(document.createElement('br'));
            }
        }
        else {
            if (i % 6 === 0) {
                container.appendChild(document.createElement('br'));
            }
        }
    }
    // Save the updated team kart usage after initialization or any change
    saveTeamKartUsage();
}


async function loadBoxColors() {
    const boxes = document.querySelectorAll('.box');
    boxes.forEach(box => {
        const boxRef = ref(database, 'boxColorsKT/' + box.id);
        onValue(boxRef, (snapshot) => {
            if (snapshot.exists()) {
                box.style.backgroundColor = snapshot.val();
            }
        });
    });
}


async function saveBoxColor(box) {
    const boxRef = ref(database, 'boxColorsKT/' + box.id);
    await set(boxRef, box.style.backgroundColor);
}

async function saveTeamKartUsage() {
    try {
        const teamKartUsageRef = ref(database, 'teamKartUsage');
        await set(teamKartUsageRef, teamKartUsage);
    } catch (error) {
        console.error('Failed to save team car usage:', error);
    }
}

async function loadTeamKartUsage() {
    try {
        const teamKartUsageRef = ref(database, 'teamKartUsage');
        const snapshot = await get(teamKartUsageRef);
        if (snapshot.exists()) {
            teamKartUsage = snapshot.val();
            console.log('Team Car Usage:', teamKartUsage);
        } else {
            console.log('No team car usage data available');
            teamKartUsage = {};
        }
    } catch (error) {
        console.error('Failed to load team car usage:', error);
    }
}
