window.onload = function() {
    loadTeamCarUsage()
    // Load counts from localStorage or use default values
    const kartsOnTrackCount = parseInt(localStorage.getItem('kartsOnTrackCount'), 10) || 15;
    const kartsInPitCount = parseInt(localStorage.getItem('kartsInPitCount'), 10) || 3;

    // Use the loaded or default counts to create boxes
    createBoxes('kartsOnTrack', kartsOnTrackCount);
    createBoxes('kartsInPit', kartsInPitCount);
    loadBoxColors();

    // Add event listeners
    document.getElementById('kartPerformance').addEventListener('click', pickColor);
    document.getElementById('kartsOnTrack').addEventListener('click', handleBoxClick);
    document.getElementById('kartsInPit').addEventListener('click', handleBoxClick);

    // Add an event listener to the document body
    document.body.addEventListener('click', function(event) {
        if (!event.target.classList.contains('box')) {
            selectedColor = '';
            document.body.style.cursor = 'default'; // Reset the cursor
        }
    });

    //Reset button
    document.getElementById('resetButton').addEventListener('click', resetColors);
};

let selectedColor = '';
let lastClickedBox = { track: null, pit: null };
let teamCarUsage = {}; // Object to track car usage by teams


function resetColors() {
    if (confirm('Are you sure you want to reset all colors and change the number of karts?')) {
        // Ask and validate the new counts
        const kartsOnTrackCount = parseInt(prompt("Enter the number of Karts-on-Track:", "15"), 10);
        const kartsInPitCount = parseInt(prompt("Enter the number of Karts-in-Pit:", "3"), 10);

        const validKartsOnTrackCount = isNaN(kartsOnTrackCount) ? 15 : kartsOnTrackCount;
        const validKartsInPitCount = isNaN(kartsInPitCount) ? 3 : kartsInPitCount;

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
    }

    // Optionally, refresh the display of car usage
    displayCarUsage();
}

function handleBoxClick(event) {
    if (event.target.classList.contains('box')) {
        // Vibrate the device for 50 milliseconds as feedback on box click
        if (navigator.vibrate) {
            navigator.vibrate(50); // You can adjust the duration as needed
        }

        if (selectedColor && event.target.parentNode.id === 'kartsOnTrack') {
            // Apply selected color and reset
            event.target.style.backgroundColor = selectedColor;
            saveBoxColor(event.target); // Save the color change

            // Update teamCarUsage with the new color
            const teamNumber = event.target.textContent;
            if (teamCarUsage[teamNumber]) {
                // Assuming the last entry should be updated with the new color
                teamCarUsage[teamNumber][teamCarUsage[teamNumber].length - 1] = event.target.getAttribute('data-car-id') + " " + selectedColor;
                saveTeamCarUsage(); // Save the updated team car usage
            }

            selectedColor = '';
            document.body.style.cursor = 'default'; // Reset cursor to default
        }
        else if (selectedColor && event.target.parentNode.id === 'kartsInPit') {
            event.target.style.backgroundColor = selectedColor;
            saveBoxColor(event.target); // Save the color change
            selectedColor = '';
            document.body.style.cursor = 'default'; // Reset cursor to default
        }

        else {
            // Proceed with swap logic if no color is selected
            if (event.target.parentNode.id === 'kartsOnTrack') {
                moveColors(event.target);
            }
        }
    }
}


function moveColors(selectedTrackBox) {
    const pitBoxes = document.querySelectorAll('#kartsInPit .box');
    if (pitBoxes.length === 0) return;

    // Store the first pit box's color and car ID to cycle through
    const firstPitBoxColor = pitBoxes[0].style.backgroundColor;
    let firstPitBoxCarId = pitBoxes[0].getAttribute('data-car-id');

    // Move colors and IDs through pit boxes
    for (let i = 0; i < pitBoxes.length - 1; i++) {
        pitBoxes[i].style.backgroundColor = pitBoxes[i + 1].style.backgroundColor;
        pitBoxes[i].setAttribute('data-car-id', pitBoxes[i + 1].getAttribute('data-car-id'));
        saveBoxColor(pitBoxes[i]);
    }

    // Update the last pit box with the selected track box's color and ID
    pitBoxes[pitBoxes.length - 1].style.backgroundColor = selectedTrackBox.style.backgroundColor;
    pitBoxes[pitBoxes.length - 1].setAttribute('data-car-id', selectedTrackBox.getAttribute('data-car-id'));
    saveBoxColor(pitBoxes[pitBoxes.length - 1]);

    // Update the selected track box with the first pit box's color and stored ID
    selectedTrackBox.style.backgroundColor = firstPitBoxColor;
    selectedTrackBox.setAttribute('data-car-id', firstPitBoxCarId);
    saveBoxColor(selectedTrackBox);

    // Optionally update teamCarUsage to reflect the change
    updateTeamCarUsageAfterMove(selectedTrackBox, pitBoxes);
}

function updateTeamCarUsageAfterMove(selectedTrackBox) {
    // Extract team number from the selected track box's content
    const teamNumber = selectedTrackBox.textContent;

    // Ensure there's an entry for this team number
    if (!teamCarUsage[teamNumber]) {
        teamCarUsage[teamNumber] = [];
    }

    // Update teamCarUsage with the new car ID for this team
    teamCarUsage[teamNumber].push(selectedTrackBox.getAttribute('data-car-id') + " " + selectedTrackBox.style.backgroundColor);

    // Save the updated teamCarUsage
    saveTeamCarUsage();
}



function pickColor(event) {
    if (event.target.classList.contains('box')) {
        selectedColor = event.target.style.backgroundColor;
        createCustomCursor(selectedColor); // Create a custom cursor with the selected color
        lastClickedBox.track = null;
        lastClickedBox.pit = null;
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

        if (containerId === 'kartsOnTrack') {
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

