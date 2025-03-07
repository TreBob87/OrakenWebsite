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

    // Load counts from Firebase database
    const { kartsOnTrackCount, kartsInPitCount } = await loadKartCounts();

    // Use the loaded counts to create boxes
    createBoxes('kartsOnTrack', kartsOnTrackCount);
    createBoxes('kartsInPit', kartsInPitCount);
    await loadSortOrderState();
    await loadBoxColors();

    // Add event listeners
    document.getElementById('kartPerformance').addEventListener('click', pickColor);
    document.getElementById('kartsOnTrack').addEventListener('click', handleBoxClick);
    document.getElementById('kartsInPit').addEventListener('click', handleBoxClick);
    document.getElementById('resetButton').addEventListener('click', resetColors);
    document.getElementById('undoSwapButton').addEventListener('click', undoLastSwap);

    document.addEventListener('click', function(event) {
        if (!event.target.classList.contains('box')) {
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
    const kartsOnTrackRef = ref(database, 'kartsOnTrackCount');
    const kartsInPitRef = ref(database, 'kartsInPitCount');

    try {
        const kartsOnTrackSnapshot = await get(kartsOnTrackRef);
        const kartsInPitSnapshot = await get(kartsInPitRef);

        const kartsOnTrackCount = kartsOnTrackSnapshot.val() || 45;
        const kartsInPitCount = kartsInPitSnapshot.val() || 5;

        return { kartsOnTrackCount, kartsInPitCount };
    } catch (error) {
        console.error('Error fetching kart counts from Firebase:', error);
        return { kartsOnTrackCount: 45, kartsInPitCount: 5 };
    }
}

let selectedKartBox = null;
let replacementIdCounter = 70;
let checked;
let selectedColor = '';
let lastClickedBox = { track: null, pit: null };
let teamCarUsage = {}; // Object to track car usage by teams

const replaceKartButton = document.getElementById('replaceKartButton');
const replaceKartPopup = document.getElementById('replaceKartPopup');
const kartSelectionContainer = document.getElementById('kartSelectionContainer');
const confirmReplacementButton = document.getElementById('confirmReplacementButton');

function createBoxes(containerId, count) {
    const container = document.getElementById(containerId);
    let startId = 0;
    if (containerId === 'kartsInPit') {
        const kartsOnTrack = document.querySelectorAll('#kartsOnTrack .box');
        if (kartsOnTrack.length > 0) {
            startId = parseInt(kartsOnTrack[kartsOnTrack.length - 1].getAttribute('data-car-id'));
        }
    }

    for (let i = 1; i < count + 1; i++) {
        const box = document.createElement('div');
        box.classList.add('box');
        const carId = startId + i;
        box.id = `${containerId}-${carId}`;
        box.setAttribute('data-car-id', carId.toString());
        box.style.backgroundColor = 'grey';

        if (containerId === 'kartsOnTrack') {
            box.textContent = i;
            // Initialize or update the team's initial car in teamCarUsage
            if (!teamCarUsage[i]) {
                teamCarUsage[i] = [carId.toString()];
            }
            // Attach long press listener for team usage popup (supports desktop & mobile)
            addLongPressListener(box);
        } else {
            box.textContent = i;
            box.style.fontWeight = 'bold';
            box.style.textDecoration = 'underline';
        }

        container.appendChild(box);
    }
    saveTeamCarUsage();
}

async function loadBoxColors() {
    const boxes = document.querySelectorAll('.box');
    boxes.forEach(box => {
        const boxRef = ref(database, 'boxColors/' + box.id);
        onValue(boxRef, (snapshot) => {
            if (snapshot.exists()) {
                box.style.backgroundColor = snapshot.val();
            }
        });
    });
}

async function saveBoxColor(box) {
    const boxRef = ref(database, 'boxColors/' + box.id);
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
    if (event.target.classList.contains('box')) {
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
        if (selectedColor && event.target.parentNode.id === 'kartsInPit') {
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
        if (selectedColor && event.target.parentNode.id === 'kartsOnTrack') {
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
        if (parentID === 'kartsOnTrack') {
            lastClickedBox.track = box;
        } else if (parentID === 'kartsInPit') {
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
            const kartsOnTrackCount = parseInt(prompt("Enter the number of Karts-on-Track:", "45"), 10);
            const kartsInPitCount = parseInt(prompt("Enter the number of Karts-in-Pit:", "5"), 10);
            const validKartsOnTrackCount = isNaN(kartsOnTrackCount) ? 45 : kartsOnTrackCount;
            const validKartsInPitCount = isNaN(kartsInPitCount) ? 5 : kartsInPitCount;
            await set(ref(database, 'kartsOnTrackCount'), validKartsOnTrackCount);
            await set(ref(database, 'kartsInPitCount'), validKartsInPitCount);
            await remove(ref(database, 'boxColors'));
            teamCarUsage = {};
            await saveTeamCarUsage();
            document.getElementById('kartsOnTrack').innerHTML = '';
            document.getElementById('kartsInPit').innerHTML = '';
            createBoxes('kartsOnTrack', validKartsOnTrackCount);
            createBoxes('kartsInPit', validKartsInPitCount);
            replacementIdCounter = 70;
        } catch (error) {
            console.error('Failed to reset colors:', error);
        }
    }
}

async function loadTeamCarUsage() {
    try {
        const teamCarUsageRef = ref(database, 'teamCarUsage');
        const snapshot = await get(teamCarUsageRef);
        if (snapshot.exists()) {
            teamCarUsage = snapshot.val();
            console.log('Team Car Usage:', teamCarUsage);
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
        const teamCarUsageRef = ref(database, 'teamCarUsage');
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

            // Swap data-car-id values
            if (!checked) {
                let tempId = trackBox.getAttribute('data-car-id');
                trackBox.setAttribute('data-car-id', pitBox.getAttribute('data-car-id'));
                pitBox.setAttribute('data-car-id', tempId);
                const teamNumber = trackBox.textContent;
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
    let longPressTriggered = false;
    const longPressDuration = 1000; // 1 second

    // Mouse events for desktop
    box.addEventListener('mousedown', function(e) {
        longPressTriggered = false;
        timer = setTimeout(() => {
            longPressTriggered = true;
            showTeamUsage(box.textContent);
        }, longPressDuration);
    });
    box.addEventListener('mouseup', function(e) {
        clearTimeout(timer);
    });
    box.addEventListener('mouseleave', function(e) {
        clearTimeout(timer);
    });

    // Touch events for mobile (note: e.preventDefault() removed)
    box.addEventListener('touchstart', function(e) {
        longPressTriggered = false;
        timer = setTimeout(() => {
            longPressTriggered = true;
            showTeamUsage(box.textContent);
        }, longPressDuration);
        // Removed e.preventDefault() so that short taps still trigger click events.
    });
    box.addEventListener('touchend', function(e) {
        clearTimeout(timer);
    });
    box.addEventListener('touchcancel', function(e) {
        clearTimeout(timer);
    });
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

document.addEventListener('DOMContentLoaded', function () {
    const qualiModeCheckbox = document.querySelector('#qualiMode .switch-input');
    qualiModeCheckbox.addEventListener('change', function () {
        if (qualiModeCheckbox.checked) {
            checked = true;
        } else {
            checked = false;
            const kartsOnTrack = document.querySelectorAll('#kartsOnTrack .box');
            kartsOnTrack.forEach((kart) => teamCarUsage[kart.textContent][teamCarUsage[kart.getAttribute('data-car-id')].length - 1] = kart.getAttribute('data-car-id') + " " + kart.style.backgroundColor);
            saveTeamCarUsage();
        }
    });
});

replaceKartButton.addEventListener('click', function () {
    kartSelectionContainer.innerHTML = '';
    const kartsOnTrack = document.querySelectorAll('#kartsOnTrack .box');
    const kartsInPit = document.querySelectorAll('#kartsInPit .box');
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
        selectedKartBox.setAttribute('data-car-id', replacementIdCounter.toString());
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
    const kartsInPitContainer = document.getElementById('kartsInPit');
    const boxes = Array.from(kartsInPitContainer.getElementsByClassName('box'));
    boxes.sort((a, b) => {
        const idA = parseInt(a.getAttribute('data-car-id'));
        const idB = parseInt(b.getAttribute('data-car-id'));
        return isAscending ? idA - idB : idB - idA;
    });
    kartsInPitContainer.innerHTML = '';
    boxes.forEach(box => kartsInPitContainer.appendChild(box));
}

document.querySelector('#sortMode .sortButton-input').addEventListener('change', updateSortOrder);

async function saveSortOrderState(isAscending) {
    try {
        const sortOrderRef = ref(database, 'sortOrder');
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
        const sortOrderRef = ref(database, 'sortOrder');
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
