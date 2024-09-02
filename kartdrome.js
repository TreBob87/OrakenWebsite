import { ref, set, get, remove, onValue } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {database, auth} from "./firebase.js";

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

window.onload = async function() {
    await loadTeamCarUsage();

    // Load counts from Firebase database
    const { kartsOnTrackCount, kartsInPitCount } = await loadKartCounts();

    // Use the loaded counts to create boxes
    createBoxes('kartsOnTrack', kartsOnTrackCount);
    createBoxes('kartsInPit', kartsInPitCount);
    await loadBoxColors();

    // Add event listeners
    document.getElementById('kartPerformance').addEventListener('click', pickColor);
    document.getElementById('kartsOnTrack').addEventListener('click', handleBoxClick);
    document.getElementById('kartsInPit').addEventListener('click', handleBoxClick);
    document.getElementById('resetButton').addEventListener('click', resetColors);

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
};
async function loadKartCounts() {
    const kartsOnTrackRef = ref(database, 'kartsOnTrackCount');
    const kartsInPitRef = ref(database, 'kartsInPitCount');

    try {
        const kartsOnTrackSnapshot = await get(kartsOnTrackRef);
        const kartsInPitSnapshot = await get(kartsInPitRef);

        const kartsOnTrackCount = kartsOnTrackSnapshot.val() || 45; // Default to 45 if not found
        const kartsInPitCount = kartsInPitSnapshot.val() || 5; // Default to 5 if not found

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
        // Adjust the startId for kartsInPit based on kartsOnTrack
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
        } else {
            box.textContent = i;

            box.style.fontWeight = 'bold';
            box.style.textDecoration = 'underline';
        }

        container.appendChild(box);
    }
    // Save the updated team car usage after initialization or any change
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

//added code
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
let currentlyHighlighted = null; // Track the currently highlighted box
function pickColor(event) {

    lastClickedBox.track = null;
    lastClickedBox.pit = null;
    // Assume event.target is the element representing the color choice
    selectedColor = event.target.style.backgroundColor; // Or any other way you're setting this
    createCustomCursor(selectedColor); // Optional, if you want to visually indicate the selected color
}


function handleBoxClick(event) {
    // Check if the click is within the kartPerformance section

    if (event.target.classList.contains('box')) {
        const box = event.target;

        // Vibrate the device for 50 milliseconds as feedback on box click
        if (navigator.vibrate) {
            navigator.vibrate(50); // You can adjust the duration as needed
        }

        // If the box is already highlighted and clicked again, remove the highlight and clear currentlyHighlighted
        if (currentlyHighlighted === box) {
            box.classList.remove('highlighted');
            currentlyHighlighted = null; // Deselect the box
            lastClickedBox.track = null;
            lastClickedBox.pit = null;
            return; // Exit early since the same box was clicked
        }

        // Remove highlighting from any previously selected box
        if (currentlyHighlighted && currentlyHighlighted !== box) {
            currentlyHighlighted.classList.remove('highlighted');
        }

        // Highlight the newly clicked box
        if (currentlyHighlighted === null || currentlyHighlighted !== box) {
            box.classList.add('highlighted');
            currentlyHighlighted = box; // Update the currently highlighted box
        }

        // Check if a color has been selected from kartPerformance
        if (selectedColor && event.target.parentNode.id === 'kartsInPit') {
            // Apply the selected color to the box
            box.style.backgroundColor = selectedColor;
            saveBoxColor(box); // Save the color change
            // Reset the selectedColor to indicate the color assignment is complete
            selectedColor = '';
            document.body.style.cursor = 'default'; // Reset cursor to default
            // Do not proceed with any highlighting since a color assignment was made
            // If there's a currently highlighted box, remove the highlight
            if (currentlyHighlighted) {
                currentlyHighlighted.classList.remove('highlighted');
                currentlyHighlighted = null; // Clear the reference to prevent unintended behavior
            }
            return;
        }

        if (selectedColor && event.target.parentNode.id === 'kartsOnTrack') {
            // Apply selected color and reset
            box.style.backgroundColor = selectedColor;
            saveBoxColor(box); // Save the color change

            if (!checked) {
                // Update teamCarUsage with the new color
                const teamNumber = event.target.textContent;
                if (teamCarUsage[teamNumber]) {
                    // Assuming the last entry should be updated with the new color
                    teamCarUsage[teamNumber][teamCarUsage[teamNumber].length - 1] = event.target.getAttribute('data-car-id') + " " + selectedColor;
                    if (!checked) {
                        saveTeamCarUsage(); // Save the updated team car usage
                    }
                }
            }


            selectedColor = '';
            document.body.style.cursor = 'default'; // Reset cursor to default
            // Do not proceed with any highlighting since a color assignment was made
            // If there's a currently highlighted box, remove the highlight
            if (currentlyHighlighted) {
                currentlyHighlighted.classList.remove('highlighted');
                currentlyHighlighted = null; // Clear the reference to prevent unintended behavior
            }
            return;
        }

        // Prepare for swapping logic, if applicable
        const parentID = box.parentNode.id;
        if (parentID === 'kartsOnTrack') {
            lastClickedBox.track = box;
        } else if (parentID === 'kartsInPit') {
            lastClickedBox.pit = box;
        }

        if (lastClickedBox.track && lastClickedBox.pit) {
            swapColorsAndIds();
            // Reset selections to require new clicks before another swap
            lastClickedBox.track = null;
            lastClickedBox.pit = null;
            if (currentlyHighlighted) {
                currentlyHighlighted.classList.remove('highlighted');
                currentlyHighlighted = null; // Clear the currently highlighted box
            }
        }
    } else {
        // If the click is not on a box, clear the last clicked boxes and any highlights
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

            await remove(ref(database, 'boxColors')); // Remove box colors from database

            teamCarUsage = {};
            await saveTeamCarUsage(); // Save the reset state to Firebase

            document.getElementById('kartsOnTrack').innerHTML = '';
            document.getElementById('kartsInPit').innerHTML = '';

            createBoxes('kartsOnTrack', validKartsOnTrackCount);
            createBoxes('kartsInPit', validKartsInPitCount);
            replacementIdCounter = 70
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

function swapColorsAndIds() {
    // Ensure that a box is highlighted before allowing a swap
    if (currentlyHighlighted && (lastClickedBox.track && lastClickedBox.pit)) {
        const trackBox = lastClickedBox.track;
        const pitBox = lastClickedBox.pit;

        // Proceed only if one of the boxes to be swapped is the one that's currently highlighted
        if (currentlyHighlighted === trackBox || currentlyHighlighted === pitBox) {
            // Perform the color and ID swap
            let tempColor = trackBox.style.backgroundColor;
            trackBox.style.backgroundColor = pitBox.style.backgroundColor;
            pitBox.style.backgroundColor = tempColor;

            if (!checked) {
                let tempId = trackBox.getAttribute('data-car-id');
                trackBox.setAttribute('data-car-id', pitBox.getAttribute('data-car-id'));
                pitBox.setAttribute('data-car-id', tempId);

                // Update the teamsKarUsage to reflect the swap
                // Assuming teamCarUsage needs to be updated based on the swap logic provided

                const teamNumber = trackBox.textContent; // Adjusted for generic use
                if (!teamCarUsage[teamNumber]) {
                    teamCarUsage[teamNumber] = [];
                }
                teamCarUsage[teamNumber].push(trackBox.getAttribute('data-car-id') + " " + trackBox.style.backgroundColor);
            }

            // Save changes
            saveBoxColor(trackBox);
            saveBoxColor(pitBox);
            saveTeamCarUsage(); // Ensure this function saves teamCarUsage to localStorage

            // Reset the selected boxes and currently highlighted box
            lastClickedBox.track = null;
            lastClickedBox.pit = null;
            currentlyHighlighted.classList.remove('highlighted');
            currentlyHighlighted = null;
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const qualiModeCheckbox = document.querySelector('#qualiMode .switch-input');

    // Add an event listener for when the checkbox state changes
    qualiModeCheckbox.addEventListener('change', function () {
        if (qualiModeCheckbox.checked) {
            console.log('Quali Mode is ON');
            checked = true;
        } else {
            console.log('Quali Mode is OFF');
            checked = false;
            const kartsOnTrack = document.querySelectorAll('#kartsOnTrack .box')
            kartsOnTrack.forEach((kart) => teamCarUsage[kart.textContent][teamCarUsage[kart.getAttribute('data-car-id')].length - 1] = kart.getAttribute('data-car-id') + " " + kart.style.backgroundColor);
            saveTeamCarUsage()
        }
    });
});

replaceKartButton.addEventListener('click', function () {
    // Populate the popup with the current karts
    kartSelectionContainer.innerHTML = ''; // Clear previous options
    const kartsOnTrack = document.querySelectorAll('#kartsOnTrack .box');
    const kartsInPit = document.querySelectorAll('#kartsInPit .box');

    kartsOnTrack.forEach(kart => {
        const kartOption = document.createElement('div');
        kartOption.classList.add('kart-option');
        kartOption.textContent = `Track: Kart ${kart.textContent} (ID: ${kart.getAttribute('data-car-id')})`;
        kartOption.dataset.carId = kart.getAttribute('data-car-id');
        kartOption.addEventListener('click', function () {
            // Highlight the selected kart
            if (selectedKartBox) {
                selectedKartBox.classList.remove('selected');
            }
            selectedKartBox = kart;
            document.querySelectorAll('.kart-option').forEach(option => {
                option.classList.remove('highlighted'); // Remove highlight from all options
            });
            kartOption.classList.add('highlighted'); // Highlight the selected option
        });
        kartSelectionContainer.appendChild(kartOption);
    });

    kartsInPit.forEach(kart => {
        const kartOption = document.createElement('div');
        kartOption.classList.add('kart-option');
        kartOption.textContent = `Pitlane: Kart ${kart.textContent} (ID: ${kart.getAttribute('data-car-id')})`;
        kartOption.dataset.carId = kart.getAttribute('data-car-id');
        kartOption.addEventListener('click', function () {
            // Highlight the selected kart
            if (selectedKartBox) {
                selectedKartBox.classList.remove('selected');
            }
            selectedKartBox = kart;
            document.querySelectorAll('.kart-option').forEach(option => {
                option.classList.remove('highlighted'); // Remove highlight from all options
            });
            kartOption.classList.add('highlighted'); // Highlight the selected option
        });
        kartSelectionContainer.appendChild(kartOption);
    });

    // Show the popup
    replaceKartPopup.style.display = 'block';
});

confirmReplacementButton.addEventListener('click', function () {
    if (selectedKartBox) {
        // Replace the kart's data-car-id
        selectedKartBox.setAttribute('data-car-id', replacementIdCounter.toString());
        selectedKartBox.style.backgroundColor = 'grey'
        replacementIdCounter++;

        // Update the teamCarUsage if necessary
        const teamNumber = selectedKartBox.textContent;
        if (teamCarUsage[teamNumber]) {
            teamCarUsage[teamNumber][teamCarUsage[teamNumber].length] = selectedKartBox.getAttribute('data-car-id') + " " + selectedKartBox.style.backgroundColor;
            saveTeamCarUsage(); // Save the updated team car usage
        }

        // Save the updated box color and ID
        saveBoxColor(selectedKartBox);

        // Hide the popup
        replaceKartPopup.style.display = 'none';
        selectedKartBox = null;
    } else {
        alert('Please select a kart to replace.');
    }
});

// Close popup when clicking outside of it
document.addEventListener('click', function (event) {
    if (replaceKartPopup.style.display === 'block' && !replaceKartPopup.contains(event.target) && !replaceKartButton.contains(event.target)) {
        replaceKartPopup.style.display = 'none';
    }
});

let isAscending = true; // Flag to track the sort order

function toggleSortOrder() {
    isAscending = !isAscending; // Toggle the sort order flag
    const kartsInPitContainer = document.getElementById('kartsInPit');
    const boxes = Array.from(kartsInPitContainer.getElementsByClassName('box'));

    // Sort boxes based on the flag
    boxes.sort((a, b) => {
        const idA = parseInt(a.getAttribute('data-car-id'));
        const idB = parseInt(b.getAttribute('data-car-id'));
        return isAscending ? idA - idB : idB - idA;
    });

    // Remove existing boxes and reappend in the new order
    kartsInPitContainer.innerHTML = '';
    boxes.forEach(box => kartsInPitContainer.appendChild(box));
}

// Add event listener to the toggle button
document.getElementById('toggleSortOrderButton').addEventListener('click', toggleSortOrder);
