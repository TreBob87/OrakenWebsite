window.onload = function() {
    // Load counts from localStorage or use default values
    const kartsOnTrackCount = parseInt(localStorage.getItem('kartsOnTrackCount'), 10) || 15;
    const kartsInPitCount = parseInt(localStorage.getItem('kartsInPitCount'), 10) || 4;

    // Use the loaded or default counts to create boxes
    createBoxes('kartsOnTrack', kartsOnTrackCount, 'Kart ');
    createBoxes('kartsInPit', kartsInPitCount, 'Lane ');
    loadBoxColors();

    // Add event listeners
    document.getElementById('kartPerformance').addEventListener('click', pickColor);
    document.getElementById('kartsOnTrack').addEventListener('click', handleBoxClick);
    document.getElementById('kartsInPit').addEventListener('click', handleBoxClick);
    document.getElementById('resetButton').addEventListener('click', resetColors);
};

let selectedColor = '';
let lastClickedBox = { track: null, pit: null };

function createBoxes(containerId, count, labelPrefix) {
    const container = document.getElementById(containerId);
    for (let i = 1; i <= count; i++) {
        const box = document.createElement('div');
        box.classList.add('box');
        box.id = `${containerId}-${i}`;  // Unique ID for each box
        box.style.backgroundColor = 'grey';
        if (labelPrefix === 'Kart ') {
            box.textContent = i;
        }
        else {
            if (labelPrefix === 'Lane ') {
                if (i % 2 !== 0) {
                    box.textContent = labelPrefix + 1;
                }
                else {
                    box.textContent = labelPrefix + 2;
                }
            }

        }
        container.appendChild(box);

        if(containerId === 'kartsInPit') {
            if (i % 2 === 0) {
                container.appendChild(document.createElement('br'));
            }
        } else {
            if (i % 5 === 0) {
                container.appendChild(document.createElement('br'));
            }
        }
    }
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

function pickColor(event) {
    if (event.target.classList.contains('box')) {
        selectedColor = event.target.style.backgroundColor;
        createCustomCursor(selectedColor);
        lastClickedBox.track = null;
        lastClickedBox.pit = null;
    }
}

function handleBoxClick(event) {
    if (event.target.classList.contains('box')) {
        const box = event.target;
        const parentID = box.parentNode.id;
        if (navigator.vibrate) {
            navigator.vibrate(50); // You can adjust the duration as needed
        }

        // Apply selected color from kartPerformance
        if (selectedColor !== '' && (parentID === 'kartsOnTrack' || parentID.includes('kartsInPit'))) {
            box.style.backgroundColor = selectedColor;
            saveBoxColor(box);
            selectedColor = '';
            document.body.style.cursor = 'default'; // Reset cursor
            lastClickedBox.track = null;
            lastClickedBox.pit = null;
            return; // Exit to avoid further actions
        }

        // Capture selections from kartsOnTrack
        if (parentID === 'kartsOnTrack') {
            lastClickedBox.track = box; // Always record the latest kartsOnTrack selection
        }

        // Capture selections from kartsInPit
        else if (parentID.includes('kartsInPit')) {
            lastClickedBox.pit = box; // Always record the latest kartsInPit selection
        }

        // Perform the swap only if both a kartsOnTrack and a kartsInPit box have been selected
        if (lastClickedBox.track && lastClickedBox.pit) {
            swapColors();
            // After swapping, reset both to require new selections for the next swap
            lastClickedBox.track = null;
            lastClickedBox.pit = null;
        }
    }
}



function swapColors() {
    // Ensure both a track and pit box have been clicked
    if (lastClickedBox.track && lastClickedBox.pit) {
        const trackBox = lastClickedBox.track;
        const pitBox = lastClickedBox.pit;

        // Define the kartInPit variables at the top to ensure they are in scope
        const kartInPit1 = document.getElementById('kartsInPit-1');
        const kartInPit2 = document.getElementById('kartsInPit-2');
        const kartInPit3 = document.getElementById('kartsInPit-3');
        const kartInPit4 = document.getElementById('kartsInPit-4');

        // Use temporary variables for color swapping to avoid reference errors
        let tempColor;

        // Check for specific kartsInPit conditions and ensure elements are defined before accessing
        if (pitBox.id === 'kartsInPit-1' || pitBox.id === 'kartsInPit-3') {
            // Ensure kartInPit1 and kartInPit3 are not null before attempting to access
            if (kartInPit1 && kartInPit3) {
                tempColor = trackBox.style.backgroundColor;
                trackBox.style.backgroundColor = kartInPit1.style.backgroundColor;
                kartInPit1.style.backgroundColor = kartInPit3.style.backgroundColor;
                kartInPit3.style.backgroundColor = tempColor;
            }
        } else if (pitBox.id === 'kartsInPit-2' || pitBox.id === 'kartsInPit-4') {
            // Ensure kartInPit2 and kartInPit4 are not null before attempting to access
            if (kartInPit2 && kartInPit4) {
                tempColor = trackBox.style.backgroundColor;
                trackBox.style.backgroundColor = kartInPit2.style.backgroundColor;
                kartInPit2.style.backgroundColor = kartInPit4.style.backgroundColor;
                kartInPit4.style.backgroundColor = tempColor;
            }
        }

        // Save the new colors
        saveBoxColor(trackBox);
        // Only attempt to save colors for non-null elements
        if (kartInPit1) saveBoxColor(kartInPit1);
        if (kartInPit2) saveBoxColor(kartInPit2);
        if (kartInPit3) saveBoxColor(kartInPit3);
        if (kartInPit4) saveBoxColor(kartInPit4);

        // Reset last clicked boxes
        lastClickedBox.track = null;
        lastClickedBox.pit = null;
    }
}



function resetColors() {
    if (confirm('Are you sure you want to reset all colors and change the number of karts?')) {
        // Ask and validate the new counts
        const kartsOnTrackCount = parseInt(prompt("Enter the number of Karts-on-Track:", "15"), 10);
        const kartsInPitCount = parseInt(prompt("Enter the number of Karts-in-Pit:", "4"), 10);

        const validKartsOnTrackCount = isNaN(kartsOnTrackCount) ? 15 : kartsOnTrackCount;
        const validKartsInPitCount = isNaN(kartsInPitCount) ? 4 : kartsInPitCount;

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

        // Remove existing boxes from the DOM
        document.getElementById('kartsOnTrack').innerHTML = '';
        document.getElementById('kartsInPit').innerHTML = '';

        // Create new boxes with the specified numbers
        createBoxes('kartsOnTrack', validKartsOnTrackCount, 'Kart ');
        createBoxes('kartsInPit', validKartsInPitCount, 'Lane ');
    }
}
