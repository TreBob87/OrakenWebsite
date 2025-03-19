import { ref, set, get, remove, onValue } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { database, auth } from "./firebase.js";

onAuthStateChanged(auth, (user) => {
    if (user) {
        const uid = user.uid;
        console.log(uid);
    } else {
        window.location.href = 'login.html';
    }
});

let skipNextClick = false;  // Global flag to skip click after a long press
let lastSwap = null;        // Global variable to store last swap data

window.onload = async function() {
    await loadTeamCarUsage();
    await loadKartUsage();

    // Load counts from Firebase database
    const { kartsOnTrackCountP, kartsInPitCountP } = await loadKartCounts();
    
    // Use the loaded counts to create boxes
    createBoxes('kartsOnTrackP', kartsOnTrackCountP);
    createBoxes('kartsInPitP', kartsInPitCountP);
    await loadSortOrderState();
    await loadBoxColors();

    // Add event listeners
    document.getElementById('kartPerformanceP').addEventListener('click', pickColor);
    document.getElementById('kartsOnTrackP').addEventListener('click', handleBoxClick);
    document.getElementById('kartsInPitP').addEventListener('click', handleBoxClick);
    document.getElementById('resetButton').addEventListener('click', resetColors);
    document.getElementById('undoSwapButton').addEventListener('click', undoLastSwap);

    document.addEventListener('click', function(event) {
        if (!event.target.classList.contains('boxP')) {
            if (currentlyHighlighted) {
                currentlyHighlighted.classList.remove('highlighted');
                currentlyHighlighted = null;
            }
            lastClickedBox.track = null;
            lastClickedBox.pit = null;
        }
    }, true);

    // Event listener to close the team usage popup
    document.getElementById('closeTeamUsagePopup').addEventListener('click', function() {
        document.getElementById('teamUsagePopup').style.display = 'none';
    });
};

async function loadKartCounts() {
    const kartsOnTrackRef = ref(database, 'kartsOnTrackCountP');
    const kartsInPitRef = ref(database, 'kartsInPitCountP');

    try {
        const kartsOnTrackSnapshot = await get(kartsOnTrackRef);
        const kartsInPitSnapshot = await get(kartsInPitRef);

        const kartsOnTrackCountP = kartsOnTrackSnapshot.val() || 45;
        const kartsInPitCountP = kartsInPitSnapshot.val() || 5;

        return { kartsOnTrackCountP, kartsInPitCountP };
    } catch (error) {
        console.error('Error fetching kart counts from Firebase:', error);
        return { kartsOnTrackCountP: 45, kartsInPitCountP: 5 };
    }
}

let selectedKartBox = null;
let replacementIdCounter = 1;
let checked;
let selectedColor = '';
let lastClickedBox = { track: null, pit: null };
let teamCarUsage = {};
let kartUsage = {};
const qualiModeCheckbox = document.getElementById('qualiModeToggle');

const replaceKartButton = document.getElementById('replaceKartButton');
const replaceKartPopup = document.getElementById('replaceKartPopup');
const cancelReplacementButton = document.getElementById('cancelButton')
const kartSelectionContainer = document.getElementById('kartSelectionContainer');
const confirmReplacementButton = document.getElementById('confirmReplacementButton');

function createBoxes(containerId, count) {
    const container = document.getElementById(containerId);
    let startId = 0;
    if (containerId === 'kartsInPitP') {
        const kartsOnTrack = document.querySelectorAll('#kartsOnTrackP .boxP');
        if (kartsOnTrack.length > 0) {
            startId = parseInt(kartsOnTrack[kartsOnTrack.length - 1].getAttribute('data-car-id'));
        }
    }

    for (let i = 1; i < count + 1; i++) {
        const box = document.createElement('div');
        box.classList.add('boxP');
        const carId = startId + i;
        box.id = `${containerId}-${carId}`;
        box.style.backgroundColor = 'grey';
        // Attach long press listener for team usage popup (supports desktop & mobile)
        addLongPressListener(box);
        

        if (containerId === 'kartsOnTrackP') {
            box.textContent = i;
            box.setAttribute('data-car-id', carId.toString());
            
            // Initialize or update the team's initial car in teamCarUsage
            if (!teamCarUsage[i]) {
                teamCarUsage[i] = [carId.toString()];
            }
            
        } else {
            box.textContent = i;
            box.style.fontWeight = 'bold';
            box.style.textDecoration = 'underline';
            box.setAttribute('data-car-id',"P" + carId.toString());
        }

        container.appendChild(box);
    }
    saveTeamCarUsage();
}

async function loadBoxColors() {
    const boxes = document.querySelectorAll('.boxP');
    boxes.forEach(box => {
        const boxRef = ref(database, 'boxColorsP/' + box.id);
        onValue(boxRef, (snapshot) => {
            if (snapshot.exists()) {
                box.style.backgroundColor = snapshot.val();
            }
        });
    });
}

async function saveBoxColor(box) {
    const boxRef = ref(database, 'boxColorsP/' + box.id);
    await set(boxRef, box.style.backgroundColor);
}

function createCustomCursor(color) {
    const cursorSize = 20;
    const canvas = document.createElement('canvas');
    canvas.width = cursorSize;
    canvas.height = cursorSize;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, cursorSize, cursorSize);
    const cursorUrl = canvas.toDataURL();
    document.body.style.cursor = `url(${cursorUrl}) ${cursorSize / 2} ${cursorSize / 2}, auto`;
}

let currentlyHighlighted = null;
function pickColor(event) {
    lastClickedBox.track = null;
    lastClickedBox.pit = null;
    selectedColor = event.target.style.backgroundColor;
    createCustomCursor(selectedColor);
}

function handleBoxClick(event) {
    // If a long press was triggered, skip this click.
    if (skipNextClick) {
        skipNextClick = false;
        return;
    }
    if (event.target.classList.contains('boxP')) {
        const box = event.target;
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        if (currentlyHighlighted === box) {
            box.classList.remove('highlighted');
            currentlyHighlighted = null;
            lastClickedBox.track = null;
            lastClickedBox.pit = null;
            return;
        }
        if (currentlyHighlighted && currentlyHighlighted !== box) {
            currentlyHighlighted.classList.remove('highlighted');
        }
        if (currentlyHighlighted === null || currentlyHighlighted !== box) {
            box.classList.add('highlighted');
            currentlyHighlighted = box;
        }
        if (selectedColor && event.target.parentNode.id === 'kartsInPitP') {
            box.style.backgroundColor = selectedColor;
            saveBoxColor(box);
            selectedColor = '';
            document.body.style.cursor = 'default';
            if (currentlyHighlighted) {
                currentlyHighlighted.classList.remove('highlighted');
                currentlyHighlighted = null;
            }
            return;
        }
        if (selectedColor && event.target.parentNode.id === 'kartsOnTrackP') {
            box.style.backgroundColor = selectedColor;
            saveBoxColor(box);
            if (!checked) {
                const teamNumber = event.target.textContent;
                if (teamCarUsage[teamNumber]) {
                    teamCarUsage[teamNumber][teamCarUsage[teamNumber].length - 1] = event.target.getAttribute('data-car-id') + " " + selectedColor;
                    if (!checked) {
                        saveTeamCarUsage();
                    }
                }
            }
            selectedColor = '';
            document.body.style.cursor = 'default';
            if (currentlyHighlighted) {
                currentlyHighlighted.classList.remove('highlighted');
                currentlyHighlighted = null;
            }
            return;
        }
        const parentID = box.parentNode.id;
        if (parentID === 'kartsOnTrackP') {
            lastClickedBox.track = box;
        } else if (parentID === 'kartsInPitP') {
            lastClickedBox.pit = box;
        }
        if (lastClickedBox.track && lastClickedBox.pit) {
            swapColorsAndIds();
            lastClickedBox.track = null;
            lastClickedBox.pit = null;
            if (currentlyHighlighted) {
                currentlyHighlighted.classList.remove('highlighted');
                currentlyHighlighted = null;
            }
        }
    } else {
        if (currentlyHighlighted) {
            currentlyHighlighted.classList.remove('highlighted');
            currentlyHighlighted = null;
        }
        lastClickedBox.track = null;
        lastClickedBox.pit = null;
    }
}

async function resetColors() {
    if (confirm('Are you sure you want to reset all colors and change the number of karts?')) {
        try {
            const kartsOnTrackCountP = parseInt(prompt("Enter the number of Karts-on-Track:", "45"), 10);
            const kartsInPitCountP = parseInt(prompt("Enter the number of Karts-in-Pit:", "5"), 10);
            const validKartsOnTrackCount = isNaN(kartsOnTrackCountP) ? 45 : kartsOnTrackCountP;
            const validKartsInPitCount = isNaN(kartsInPitCountP) ? 5 : kartsInPitCountP;
            await set(ref(database, 'kartsOnTrackCountP'), validKartsOnTrackCount);
            await set(ref(database, 'kartsInPitCountP'), validKartsInPitCount);
            await remove(ref(database, 'boxColorsP'));
            teamCarUsage = {};
            kartUsage = {}
            await saveTeamCarUsage();
            document.getElementById('kartsOnTrackP').innerHTML = '';
            document.getElementById('kartsInPitP').innerHTML = '';
            createBoxes('kartsOnTrackP', validKartsOnTrackCount);
            createBoxes('kartsInPitP', validKartsInPitCount);
            replacementIdCounter = 1;
        } catch (error) {
            console.error('Failed to reset colors:', error);
        }
    }
}

async function loadTeamCarUsage() {
    try {
        const teamCarUsageRef = ref(database, 'teamCarUsageP');
        const snapshot = await get(teamCarUsageRef);
        if (snapshot.exists()) {
            teamCarUsage = snapshot.val();
            console.log('Team Kart Usage:', teamCarUsage);
        } else {
            console.log('No team car usage data available');
            teamCarUsage = {};
        }
    } catch (error) {
        console.error('Failed to load team car usage:', error);
    }
}

async function saveTeamCarUsage() {
    try {
        const teamCarUsageRef = ref(database, 'teamCarUsageP');
        await set(teamCarUsageRef, teamCarUsage);
    } catch (error) {
        console.error('Failed to save team car usage:', error);
    }
}

/**
 * Swaps the colors and IDs of two boxes and records the previous state in lastSwap.
 * Also, appends a new usage entry to the team's history.
 */
function swapColorsAndIds() {
    if (currentlyHighlighted && (lastClickedBox.track && lastClickedBox.pit)) {
        const trackBox = lastClickedBox.track;
        const pitBox = lastClickedBox.pit;
        if (currentlyHighlighted === trackBox || currentlyHighlighted === pitBox) {
            // Record the current state before swap for undo
            lastSwap = {
                teamNumber: trackBox.textContent,
                trackBox: {
                    id: trackBox.id,
                    dataCarId: trackBox.getAttribute('data-car-id'),
                    color: trackBox.style.backgroundColor
                },
                pitBox: {
                    id: pitBox.id,
                    dataCarId: pitBox.getAttribute('data-car-id'),
                    color: pitBox.style.backgroundColor
                }
            };

            // Perform swap of colors
            let tempColor = trackBox.style.backgroundColor;
            trackBox.style.backgroundColor = pitBox.style.backgroundColor;
            pitBox.style.backgroundColor = tempColor;
            const teamNumber = trackBox.textContent.trim();
            const pitKartId = pitBox.getAttribute('data-car-id');

            // Swap data-car-id values
            if (!checked) {
                let tempId = trackBox.getAttribute('data-car-id');
                trackBox.setAttribute('data-car-id', pitBox.getAttribute('data-car-id'));
                pitBox.setAttribute('data-car-id', tempId);
                console.log(teamNumber, trackBox.getAttribute('data-car-id'))
                addKartUsage(pitKartId, teamNumber)
                
                if (!teamCarUsage[teamNumber]) {
                    teamCarUsage[teamNumber] = [];
                }
                // Append new usage entry to the team's history
                teamCarUsage[teamNumber].push(trackBox.getAttribute('data-car-id') + " " + trackBox.style.backgroundColor + " at " + new Date().toLocaleTimeString());
                
            }
            saveBoxColor(trackBox);
            saveBoxColor(pitBox);
            saveTeamCarUsage();
            lastClickedBox.track = null;
            lastClickedBox.pit = null;
            currentlyHighlighted.classList.remove('highlighted');
            currentlyHighlighted = null;
        }
    }
}

/**
 * Undoes the last swap by reverting the boxes to their previous state
 * and removing the last entry from the team's usage history.
 */
function undoLastSwap() {
    if (!lastSwap) {
        alert("No swap to undo.");
        return;
    }
    // Retrieve the boxes by their IDs
    const trackBox = document.getElementById(lastSwap.trackBox.id);
    const pitBox = document.getElementById(lastSwap.pitBox.id);
    if (!trackBox || !pitBox) {
        alert("Unable to undo swap: boxes not found.");
        return;
    }
    // Revert box states to recorded values
    trackBox.setAttribute('data-car-id', lastSwap.trackBox.dataCarId);
    trackBox.style.backgroundColor = lastSwap.trackBox.color;
    pitBox.setAttribute('data-car-id', lastSwap.pitBox.dataCarId);
    pitBox.style.backgroundColor = lastSwap.pitBox.color;

    // Remove the last usage entry for the team (if it exists)
    const teamNumber = lastSwap.teamNumber;
    if (teamCarUsage[teamNumber] && teamCarUsage[teamNumber].length > 0) {
        teamCarUsage[teamNumber].pop();
        saveTeamCarUsage();
    }
    // Save the reverted colors
    saveBoxColor(trackBox);
    saveBoxColor(pitBox);
    // Clear the lastSwap record
    lastSwap = null;
    alert("Last swap undone.");
}

/**
 * Attaches a long-press listener to a team box.
 * When the user presses and holds for 1 second (mouse or touch),
 * it opens the team usage popup.
 * Also sets skipNextClick flag on touch to avoid triggering swap.
 */
function addLongPressListener(box) {
    let timer;
    const duration = 1000;

    const startPress = () => {
        timer = setTimeout(() => {
            const isPitLane = box.parentNode.id === 'kartsInPitP';
            const kartId = box.getAttribute('data-car-id');

            console.log("Long-pressed box details:", { isPitLane, kartId });

            if (isPitLane) {
                showLastUsedTeamForPitKart(kartId);
            } else {
                showTeamUsage(box.textContent.trim());
            }
        }, duration);
    };

    const cancelPress = () => clearTimeout(timer);

    box.addEventListener('mousedown', startPress);
    box.addEventListener('mouseup', cancelPress);
    box.addEventListener('mouseleave', cancelPress);
    box.addEventListener('touchstart', startPress, {passive: true});
    box.addEventListener('touchend', cancelPress);
    box.addEventListener('touchcancel', cancelPress);
}


/**
 * Displays the team usage popup for the given team number.
 * It shows all usage entries (previous karts used) for that team.
 */
function showTeamUsage(teamNumber) {
    const popup = document.getElementById('teamUsagePopup');
    const teamNumberElem = document.getElementById('teamNumberPopup');
    const listElem = document.getElementById('teamUsageList');
    teamNumberElem.textContent = teamNumber;
    const usageArr = teamCarUsage[teamNumber] || [];
    listElem.innerHTML = "";
    usageArr.forEach(record => {
        const li = document.createElement('li');
        li.textContent = record;
        listElem.appendChild(li);
    });
    popup.style.display = 'flex';
}
// --- End Updated Functionality ---


qualiModeCheckbox.addEventListener('change', function () {
    if (qualiModeCheckbox.checked) {
        checked = true;
    } else {
        checked = false;
        const kartsOnTrack = document.querySelectorAll('#kartsOnTrackP .boxP');
        kartsOnTrack.forEach((kart) => teamCarUsage[kart.textContent][teamCarUsage[kart.getAttribute('data-car-id')].length - 1] = kart.getAttribute('data-car-id') + " " + kart.style.backgroundColor);
        saveTeamCarUsage();
    }
});

replaceKartButton.addEventListener('click', function () {
    kartSelectionContainer.innerHTML = '';
    const kartsOnTrack = document.querySelectorAll('#kartsOnTrackP .boxP');
    const kartsInPit = document.querySelectorAll('#kartsInPitP .boxP');
    kartsOnTrack.forEach(kart => {
        const kartOption = document.createElement('div');
        kartOption.classList.add('kart-option');
        kartOption.textContent = `Track: Kart ${kart.textContent} (ID: ${kart.getAttribute('data-car-id')})`;
        kartOption.dataset.carId = kart.getAttribute('data-car-id');
        kartOption.addEventListener('click', function () {
            if (selectedKartBox) {
                selectedKartBox.classList.remove('selected');
            }
            selectedKartBox = kart;
            document.querySelectorAll('.kart-option').forEach(option => {
                option.classList.remove('highlighted');
            });
            kartOption.classList.add('highlighted');
        });
        kartSelectionContainer.appendChild(kartOption);
    });
    kartsInPit.forEach(kart => {
        const kartOption = document.createElement('div');
        kartOption.classList.add('kart-option');
        kartOption.textContent = `Pitlane: Kart ${kart.textContent} (ID: ${kart.getAttribute('data-car-id')})`;
        kartOption.dataset.carId = kart.getAttribute('data-car-id');
        kartOption.addEventListener('click', function () {
            if (selectedKartBox) {
                selectedKartBox.classList.remove('selected');
            }
            selectedKartBox = kart;
            document.querySelectorAll('.kart-option').forEach(option => {
                option.classList.remove('highlighted');
            });
            kartOption.classList.add('highlighted');
        });
        kartSelectionContainer.appendChild(kartOption);
    });
    replaceKartPopup.style.display = 'block';
});

confirmReplacementButton.addEventListener('click', function () {
    if (selectedKartBox) {
        selectedKartBox.setAttribute('data-car-id', "r" + replacementIdCounter.toString());
        selectedKartBox.style.backgroundColor = 'grey';
        replacementIdCounter++;
        const teamNumber = selectedKartBox.textContent;
        if (teamCarUsage[teamNumber]) {
            teamCarUsage[teamNumber][teamCarUsage[teamNumber].length] = selectedKartBox.getAttribute('data-car-id') + " " + selectedKartBox.style.backgroundColor;
            saveTeamCarUsage();
        }
        saveBoxColor(selectedKartBox);
        replaceKartPopup.style.display = 'none';
        selectedKartBox = null;
    } else {
        alert('Please select a kart to replace.');
    }
});

document.addEventListener('click', function (event) {
    if (replaceKartPopup.style.display === 'block' && !replaceKartPopup.contains(event.target) && !replaceKartButton.contains(event.target)) {
        replaceKartPopup.style.display = 'none';
    }
});

let isAscending = true;

function updateSortOrder() {
    const sortModeSwitch = document.querySelector('#sortMode .sortButton-input');
    isAscending = sortModeSwitch.checked;
    const kartsInPitContainer = document.getElementById('kartsInPitP');
    const boxes = Array.from(kartsInPitContainer.getElementsByClassName('boxP'));
    boxes.sort((a, b) => {
        const idA = parseInt(a.textContent, 10);
        const idB = parseInt(b.textContent, 10);
        return isAscending ? idA - idB : idB - idA;
    });
    kartsInPitContainer.innerHTML = '';
    boxes.forEach(box => kartsInPitContainer.appendChild(box));
}

document.querySelector('#sortMode .sortButton-input').addEventListener('change', updateSortOrder);

async function saveSortOrderState(isAscending) {
    try {
        const sortOrderRef = ref(database, 'sortOrderP');
        await set(sortOrderRef, { isAscending });
    } catch (error) {
        console.error('Failed to save sort order state:', error);
    }
}

document.querySelector('#sortMode .sortButton-input').addEventListener('change', function () {
    isAscending = this.checked;
    updateSortOrder();
    saveSortOrderState(isAscending);
});

async function loadSortOrderState() {
    try {
        const sortOrderRef = ref(database, 'sortOrderP');
        const snapshot = await get(sortOrderRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            isAscending = data.isAscending;
            document.querySelector('#sortMode .sortButton-input').checked = isAscending;
            updateSortOrder();
        } else {
            console.log('No sort order data available, defaulting to ascending.');
        }
    } catch (error) {
        console.error('Failed to load sort order state:', error);
    }
}

// ✅ Cancel Replacement (Closes Popup)
cancelReplacementButton.addEventListener('click', () => {
    selectedKartBox = null; // Reset selection
    replaceKartPopup.style.display = 'none';
});

// Close popup if clicking outside
document.addEventListener('click', (event) => {
    if (replaceKartPopup.style.display === 'block' &&
        !replaceKartPopup.contains(event.target) &&
        !replaceKartButton.contains(event.target)) {
        replaceKartPopup.style.display = 'none';
    }
});

// clearly display last used team for pit kart:
function showLastUsedTeamForPitKart(kartId) {
    const popup = document.getElementById('teamUsagePopup');
    const teamNumberElem = document.getElementById('teamNumberPopup');
    const listElem = document.getElementById('teamUsageList');

    const usageHistory = kartUsage[kartId];

    teamNumberElem.textContent = `Kart ${kartId}`;
    listElem.innerHTML = "";

    if (usageHistory === undefined || usageHistory.length == 0) {
        const li = document.createElement('li');
        li.textContent = "No recorded team usage yet.";
    }
    else {
        for (let i = 0 ; i < usageHistory.length; i++ ) {
            console.log(usageHistory[i])
            const li = document.createElement('li');
            li.textContent = usageHistory[i]
            listElem.appendChild(li);
        }
    }
    

    popup.style.display = 'flex';
}

async function loadKartUsage() {
    const snapshot = await get(ref(database, 'kartUsageP'));
    kartUsage = snapshot.val() || {};
    console.log("Kart usage loaded:", kartUsage);
}

async function saveKartUsage() {
    await set(ref(database, 'kartUsageP'), kartUsage);
}

// clearly add team usage entry when kart is used:
async function addKartUsage(kartId, teamNumber) {
    if (!kartUsage[kartId]) {
        kartUsage[kartId] = [];
    }
    kartUsage[kartId].push(`${teamNumber} at ${new Date().toLocaleTimeString()}`);
    await saveKartUsage();
}