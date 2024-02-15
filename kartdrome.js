window.onload = function() {
    loadTeamCarUsage();
    // Load counts from localStorage or use default values
    const kartsOnTrackCount = parseInt(localStorage.getItem('kartsOnTrackCount'), 10) || 45;
    const kartsInPitCount = parseInt(localStorage.getItem('kartsInPitCount'), 10) || 5;

    // Use the loaded or default counts to create boxes
    createBoxes('kartsOnTrack', kartsOnTrackCount, 'Kart ');
    createBoxes('kartsInPit', kartsInPitCount, 'Lane ');
    loadBoxColors();

    // Add event listeners
    document.getElementById('kartPerformance').addEventListener('click', pickColor);
    document.getElementById('kartsOnTrack').addEventListener('click', handleBoxClick);
    document.getElementById('kartsInPit').addEventListener('click', handleBoxClick);
    document.getElementById('resetButton').addEventListener('click', resetColors);

    // Add an event listener to the whole document to handle clicks outside boxes
    document.addEventListener('click', function(event) {
        if (!event.target.classList.contains('box')) {
            // If the click is not on a box, remove highlighting from the currently highlighted box
            if (currentlyHighlighted) {
                currentlyHighlighted.classList.remove('highlighted');
                currentlyHighlighted = null; // Reset the reference to the currently highlighted box
            }
        }
    }, true);
};

let selectedColor = '';
let lastClickedBox = { track: null, pit: null };
let teamCarUsage = {}; // Object to track car usage by teams

function createBoxes(containerId, count, labelPrefix) {
    const container = document.getElementById(containerId);
    let startId = 0;
    if (containerId === 'kartsInPit') {
        // Adjust the startId for kartsInPit based on kartsOnTrack
        const kartsOnTrack = document.querySelectorAll('#kartsOnTrack .box');
        if (kartsOnTrack.length > 0) {
            const lastKartOnTrackId = parseInt(kartsOnTrack[kartsOnTrack.length - 1].getAttribute('data-car-id'));
            startId = lastKartOnTrackId;
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
        }

        container.appendChild(box);
    }
    // Save the updated team car usage after initialization or any change
    saveTeamCarUsage();
}



function loadBoxColors() {
    const boxes = document.querySelectorAll('.box');
    boxes.forEach(box => {
        const savedColor = localStorage.getItem(box.id);
        if (savedColor) {
            box.style.backgroundColor = savedColor;
        }
    });
}

function saveBoxColor(box) {
    localStorage.setItem(box.id, box.style.backgroundColor);
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
    if (event.currentTarget.id === 'kartPerformance') {
        // Do nothing if the click is within the kartPerformance section
        return;
    }

    if (event.target.classList.contains('box')) {
        const box = event.target;

        // Vibrate the device for 50 milliseconds as feedback on box click
        if (navigator.vibrate) {
            navigator.vibrate(50); // You can adjust the duration as needed
        }

        // Check if a color has been selected from kartPerformance
        if (selectedColor) {
            // Apply the selected color to the box
            box.style.backgroundColor = selectedColor;
            saveBoxColor(box); // Save the color change

            // Reset the selectedColor to indicate the color assignment is complete
            selectedColor = '';
            document.body.style.cursor = 'default'; // Reset cursor to default

            // Do not proceed with any highlighting since a color assignment was made
            return;
        }

        // Remove highlighting from the previously selected box
        if (currentlyHighlighted && currentlyHighlighted !== box) {
            currentlyHighlighted.classList.remove('highlighted');
        }

        // If no color is selected (i.e., color assignment isn't in progress), toggle highlighting
        box.classList.toggle('highlighted');
        currentlyHighlighted = box.classList.contains('highlighted') ? box : null;


        // Only apply the selected color if one is currently chosen
        if (selectedColor) {
            box.style.backgroundColor = selectedColor;
            saveBoxColor(box); // Persist the color change

            document.body.style.cursor = 'default'; // Reset cursor to default

            selectedColor = ''; // Clear the selectedColor after applying it

            return; // Exit the function to prevent any further action
        }

        // Swapping logic (remains unchanged)
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
            }
        }
    }
    else {
        // If the click is not on a box, clear the last clicked boxes
        lastClickedBox.track = null;
        lastClickedBox.pit = null;
    }
}







function resetColors() {
    if (confirm('Are you sure you want to reset all colors and change the number of karts?')) {
        // Ask and validate the new counts
        const kartsOnTrackCount = parseInt(prompt("Enter the number of Karts-on-Track:", "45"), 10);
        const kartsInPitCount = parseInt(prompt("Enter the number of Karts-in-Pit:", "5"), 10);

        const validKartsOnTrackCount = isNaN(kartsOnTrackCount) ? 45 : kartsOnTrackCount;
        const validKartsInPitCount = isNaN(kartsInPitCount) ? 5 : kartsInPitCount;

        // Save these counts to localStorage
        localStorage.setItem('kartsOnTrackCount', validKartsOnTrackCount);
        localStorage.setItem('kartsInPitCount', validKartsInPitCount);

        // Remove existing boxes and their colors from localStorage
        const trackBoxes = document.querySelectorAll('#kartsOnTrack .box');
        const pitBoxes = document.querySelectorAll('#kartsInPit .box');
        const allBoxes = [...trackBoxes, ...pitBoxes];

        allBoxes.forEach(box => {
            localStorage.removeItem(box.id); // Remove color from localStorage
        });

        // Reset the teamCarUsage
        teamCarUsage = {};
        saveTeamCarUsage(); // Save the reset state to localStorage

        // Remove existing boxes from the DOM
        document.getElementById('kartsOnTrack').innerHTML = '';
        document.getElementById('kartsInPit').innerHTML = '';

        // Create new boxes with the specified numbers
        createBoxes('kartsOnTrack', validKartsOnTrackCount, 'Kart ');
        createBoxes('kartsInPit', validKartsInPitCount, 'Lane ');

        // Optionally, refresh the display of car usage
        displayCarUsage();
    }
}


function saveTeamCarUsage() {
    localStorage.setItem('teamCarUsage', JSON.stringify(teamCarUsage));
}


function loadTeamCarUsage() {
    const loadedData = localStorage.getItem('teamCarUsage');
    if (loadedData) {
        teamCarUsage = JSON.parse(loadedData);
    } else {
        teamCarUsage = {}; // Initialize if not present
    }
}



function displayCarUsage() {
    const display = document.getElementById('carUsageDisplay');
    let content = '<h3>Team Car Usage:</h3>';

    for (const [team, cars] of Object.entries(teamCarUsage)) {
        content += `<p><strong>${team}:</strong> ${cars.join(', ')}</p>`;
    }

    display.innerHTML = content;
}
function swapColorsAndIds() {
    if (lastClickedBox.track && lastClickedBox.pit) {
        const trackBox = lastClickedBox.track;
        const pitBox = lastClickedBox.pit;

        // Perform the color and ID swap
        let tempColor = trackBox.style.backgroundColor;
        trackBox.style.backgroundColor = pitBox.style.backgroundColor;
        pitBox.style.backgroundColor = tempColor;

        let tempId = trackBox.getAttribute('data-car-id');
        trackBox.setAttribute('data-car-id', pitBox.getAttribute('data-car-id'));
        pitBox.setAttribute('data-car-id', tempId);

        // Update the teamCarUsage to reflect the swap, including duplicates
        const teamNumber = trackBox.textContent.replace('Team ', '');
        if (!teamCarUsage[teamNumber]) {
            teamCarUsage[teamNumber] = [];
        }

        // Append the new car ID to the team's list every time a swap occurs
        teamCarUsage[teamNumber].push(trackBox.getAttribute('data-car-id'));

        // Save changes
        saveBoxColor(trackBox);
        saveBoxColor(pitBox);
        saveTeamCarUsage(); // Ensure this function saves teamCarUsage to localStorage

        // Reset the selected boxes to require new selections for another swap
        lastClickedBox.track = null;
        lastClickedBox.pit = null;
    }
}



