// Import the Firebase modules you need
import { ref, set, get, remove, onValue } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { database, auth} from "../scripts/firebase.js";

onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
        const uid = user.uid;
        console.log(uid);

        // ...
    } else {
        // User is signed out
        window.location.href = '../login.html';
    }
});

let teamCarUsage = {}; // Object to track car usage by teams
async function loadKartCounts() {
    const kartsOnTrackRef = ref(database, 'kartsOnTrackCountYas');
    const kartsInPitRef = ref(database, 'kartsInPitCountYas');

    try {
        const kartsOnTrackYasSnapshot = await get(kartsOnTrackRef);
        const kartsInPitYasSnapshot = await get(kartsInPitRef);

        const kartsOnTrackCountYas = kartsOnTrackYasSnapshot.val() || 30; // Default to 45 if not found
        const kartsInPitCountYas = kartsInPitYasSnapshot.val() || 10; // Default to 5 if not found

        return { kartsOnTrackCountYas, kartsInPitCountYas };
    } catch (error) {
        console.error('Error fetching kart counts from Firebase:', error);
        return { kartsOnTrackCountYas: 45, kartsInPitCountYas: 5 };
    }
}

window.onload = async function() {

    // Load counts from Firebase
  const { kartsOnTrackCountYas, kartsInPitCountYas } = await loadKartCounts();

  // Ensure 5 per lane × 2 lanes
  const desiredPitCount = 10; // 5 per lane
  let effectivePitCount = kartsInPitCountYas;

  // If DB has old value (e.g., 4), bump to 10 and persist once
  if (kartsInPitCountYas < desiredPitCount) {
    effectivePitCount = desiredPitCount;
    await set(ref(database, 'kartsInPitCountYas'), desiredPitCount);
  }

  // Create boxes
  createBoxes('kartsOnTrackYas', kartsOnTrackCountYas, 'Kart ');
  createBoxes('kartsInPitYas', effectivePitCount, 'Lane ');
  loadBoxColors();

  // Event listeners
  document.getElementById('kartPerformance').addEventListener('click', pickColor);
  document.getElementById('kartsOnTrackYas').addEventListener('click', handleBoxClick);
  document.getElementById('kartsInPitYas').addEventListener('click', handleBoxClick);
  document.getElementById('resetButton').addEventListener('click', resetColors);
};

let selectedColor = '';
let lastClickedBox = { track: null, pit: null };

function createBoxes(containerId, count, labelPrefix) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';  // Clear existing boxes

    for (let i = 1; i <= count; i++) {
        const box = document.createElement('div');
        box.classList.add('box');
        box.id = `${containerId}-${i}`;
        box.style.backgroundColor = 'grey';  // Reset color

        // Assigning the unique identifier
        box.setAttribute('data-car-id', `${labelPrefix}-car-${i}`);

        if (containerId.includes('kartsInPitYas')) {
            // Labeling lanes as 1 or 2 instead of 3 or 4
            const laneNumber = (i % 2 === 0) ? 2 : 1;
            box.textContent = `${labelPrefix} ${laneNumber}`;
        } else {
            box.textContent = `${i}`;  // Set box label for karts on track
            if (!teamCarUsage[i]) {
                teamCarUsage[i] = [`${labelPrefix}-car-${i}`];
            }
        }

        container.appendChild(box);

        if (containerId.includes('kartsInPitYas') && i % 2 === 0) {
            container.appendChild(document.createElement('br'));
        } else if (!containerId.includes('kartsInPitYas') && i % 5 === 0) {
            container.appendChild(document.createElement('br'));
        }
    }
    saveTeamCarUsage()
}



async function loadBoxColors() {
    const boxes = document.querySelectorAll('.box');
    boxes.forEach(box => {
        const boxRefYas = ref(database, 'boxColorsYas/' + box.id);
        onValue(boxRefYas, (snapshot) => {
            if (snapshot.exists()) {
                box.style.backgroundColor = snapshot.val();
            }
        });
    });
}

async function saveBoxColor(box) {
    const boxRefYas = ref(database, 'boxColorsYas/' + box.id);
    await set(boxRefYas, box.style.backgroundColor);
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

function pickColor(event) {
    if (event.target.classList.contains('box')) {
        selectedColor = event.target.style.backgroundColor;
        createCustomCursor(selectedColor);
        lastClickedBox.track = null;
        lastClickedBox.pit = null;
    }
}


let currentlyHighlighted = null;
function handleBoxClick(event) {
    if (event.target.classList.contains('box')) {
        const box = event.target;
        const parentID = box.parentNode.id;
        // Highlight the newly clicked box
        if (currentlyHighlighted === null || currentlyHighlighted !== box) {
            box.classList.add('highlighted');
            currentlyHighlighted = box; // Update the currently highlighted box
            console.log(currentlyHighlighted)
        }
        if (currentlyHighlighted === box) {
            box.classList.remove('highlighted');
            currentlyHighlighted = null; // Deselect the box
        }

        // Remove highlighting from any previously selected box
        if (currentlyHighlighted && currentlyHighlighted !== box) {
            currentlyHighlighted.classList.remove('highlighted');
        }
        if (navigator.vibrate) {
            navigator.vibrate(50); // You can adjust the duration as needed
        }

        // Apply selected color from kartPerformance
        if (selectedColor !== '' && (parentID === 'kartsOnTrackYas' || parentID.includes('kartsInPitYas'))) {
            box.style.backgroundColor = selectedColor;
            saveBoxColor(box);
            selectedColor = '';
            document.body.style.cursor = 'default'; // Reset cursor
            lastClickedBox.track = null;
            lastClickedBox.pit = null;
            return; // Exit to avoid further actions
        }

        // Capture selections from kartsOnTrack
        if (parentID === 'kartsOnTrackYas') {
            lastClickedBox.track = box; // Always record the latest kartsOnTrack selection
        }

        // Capture selections from kartsInPit
        else if (parentID.includes('kartsInPitYas')) {
            lastClickedBox.pit = box; // Always record the latest kartsInPit selection
        }

        // Perform the swap only if both a kartsOnTrack and a kartsInPit box have been selected
        if (lastClickedBox.track && lastClickedBox.pit) {
            swapColors();
            // After swapping, reset both to require new selections for the next swap
            lastClickedBox.track = null;
            lastClickedBox.pit = null;
            currentlyHighlighted = null;
        }
    }
}

async function saveTeamCarUsage() {
    try {
        const teamCarUsageRef = ref(database, 'teamCarUsageYas'); // Use 'teamCarUsageYas' as the reference
        await set(teamCarUsageRef, teamCarUsage);
    } catch (error) {
        console.error('Failed to save team car usage:', error);
    }
}


async function loadTeamCarUsage() {
    try {
        const teamCarUsageRef = ref(database, 'teamCarUsageYas'); // Use 'teamCarUsageYas' as the reference
        const snapshot = await get(teamCarUsageRef);
        if (snapshot.exists()) {
            teamCarUsage = snapshot.val();
            // Optionally display the loaded data
            // displayCarUsage();
        } else {
            teamCarUsage = {};
        }
    } catch (error) {
        console.error('Failed to load team car usage:', error);
    }
}


function swapColors() {
  if (lastClickedBox.track && lastClickedBox.pit) {
    const trackBox = lastClickedBox.track;
    const pitBox   = lastClickedBox.pit;

    // Determine lane by odd/even pit index (same idea as your current code)
    const pitIdx = parseInt(pitBox.id.split('-').pop(), 10);
    const isLane1 = pitIdx % 2 === 1;

    // Lane 1 uses odd indices; Lane 2 uses even indices.
    // We keep the fixed order (front to back) exactly like your current approach,
    // just extended to 5 positions: [1,3,5,7,9] or [2,4,6,8,10].
    const laneIds = isLane1 ? [1, 3, 5, 7, 9] : [2, 4, 6, 8, 10];

    // Only include boxes that actually exist (in case the DB count isn’t 10 yet)
    const laneEls = laneIds
      .map(i => document.getElementById(`kartsInPitYas-${i}`))
      .filter(Boolean);

    if (laneEls.length === 0) return;

    // Perform a simple “right rotation by 1” across [track, lane[0], lane[1], ..., lane[n-1]]
    // This preserves your original three-way swap pattern but for 5 items:
    // track <= lane[0], lane[0] <= lane[1], ..., lane[n-2] <= lane[n-1], lane[n-1] <= track
    const nodes = [trackBox, ...laneEls];

    const tempColor = nodes[0].style.backgroundColor;
    const tempId    = nodes[0].getAttribute('data-car-id');

    for (let i = 0; i < nodes.length - 1; i++) {
      nodes[i].style.backgroundColor = nodes[i + 1].style.backgroundColor;
      nodes[i].setAttribute('data-car-id', nodes[i + 1].getAttribute('data-car-id'));
      saveBoxColor(nodes[i]);
    }

    const last = nodes[nodes.length - 1];
    last.style.backgroundColor = tempColor;
    last.setAttribute('data-car-id', tempId);
    saveBoxColor(last);

    // Force repaint if you like
    nodes.forEach(n => { void n.offsetHeight; });

    saveTeamCarUsage();

    lastClickedBox.track = null;
    lastClickedBox.pit = null;
    currentlyHighlighted = null;
  }
}





async function resetColors() {
    if (confirm('Are you sure you want to reset all colors and change the number of karts?')) {
        try {
            const kartsOnTrackCountYas = parseInt(prompt("Enter the number of Karts-on-Track:", "10"), 30);
            const kartsInPitCountYas = parseInt(prompt("Enter the number of Karts-in-Pit:", "4"), 10);

            const validKartsOnTrackCountYas = isNaN(kartsOnTrackCountYas) ? 30 : kartsOnTrackCountYas;
            const validKartsInPitCountYas = isNaN(kartsInPitCountYas) ? 10 : kartsInPitCountYas;

            await set(ref(database, 'kartsOnTrackCountYas'), validKartsOnTrackCountYas);
            await set(ref(database, 'kartsInPitCountYas'), validKartsInPitCountYas);

            await remove(ref(database, 'boxColorsYas')); // Remove box colors from database

            teamCarUsage = {};
            await saveTeamCarUsage(); // Save the reset state to Firebase

            document.getElementById('kartsOnTrackYas').innerHTML = '';
            document.getElementById('kartsInPitYas').innerHTML = '';

            createBoxes('kartsOnTrackYas', validKartsOnTrackCountYas, 'Kart ');
            createBoxes('kartsInPitYas', validKartsInPitCountYas, 'Lane ');
        } catch (error) {
            console.error('Failed to reset colors:', error);
        }
    }
}
