window.onload = function() {

    createBoxes('kartsOnTrack', 15, 'Kart ');
    createBoxes('kartsInPit', 6, 'Lane ');
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

function resetColors() {
    if (confirm('Are you sure you want to reset all colors and change the number of karts?')) {
        // Ask for the number of karts on track and in pit
        const kartsOnTrackCount = parseInt(prompt("Enter the number of Karts-on-Track:", "15"), 10);
        const kartsInPitCount = parseInt(prompt("Enter the number of Karts-in-Pit:", "6"), 10);

        // Validate input and provide default values if invalid
        const validKartsOnTrackCount = isNaN(kartsOnTrackCount) ? 45 : kartsOnTrackCount;
        const validKartsInPitCount = isNaN(kartsInPitCount) ? 6 : kartsInPitCount;

        // Remove existing boxes
        document.getElementById('kartsOnTrack').innerHTML = '';
        document.getElementById('kartsInPit').innerHTML = '';

        // Create new boxes with the specified numbers
        createBoxes('kartsOnTrack', validKartsOnTrackCount, 'Kart ');
        createBoxes('kartsInPit', validKartsInPitCount, 'Lane ');

        // Reset colors
        const trackBoxes = document.querySelectorAll('#kartsOnTrack .box');
        const pitBoxes = document.querySelectorAll('#kartsInPit .box');
        const allBoxes = [...trackBoxes, ...pitBoxes];

        allBoxes.forEach(box => {
            box.style.backgroundColor = 'grey';
            saveBoxColor(box);
        });
    }
}


function handleBoxClick(event) {
    if (event.target.classList.contains('box')) {
        if (selectedColor) {
            // Apply selected color and reset
            event.target.style.backgroundColor = selectedColor;
            saveBoxColor(event.target);
            selectedColor = '';
        } else {
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

    const firstPitBoxColor = pitBoxes[0].style.backgroundColor;

    for (let i = 0; i < pitBoxes.length - 1; i++) {
        pitBoxes[i].style.backgroundColor = pitBoxes[i + 1].style.backgroundColor;
        saveBoxColor(pitBoxes[i]);
    }

    pitBoxes[pitBoxes.length - 1].style.backgroundColor = selectedTrackBox.style.backgroundColor;
    saveBoxColor(pitBoxes[pitBoxes.length - 1]);

    selectedTrackBox.style.backgroundColor = firstPitBoxColor;
    saveBoxColor(selectedTrackBox);
}

// ... [previous code] ...

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

function createBoxes(containerId, count, labelPrefix) {
    const container = document.getElementById(containerId);
    for (let i = 1; i <= count; i++) {
        const box = document.createElement('div');
        box.classList.add('box');
        box.id = `${containerId}-${i}`;
        box.style.backgroundColor = 'grey';
        box.textContent = labelPrefix + i;
        container.appendChild(box);

        if (i % 10 === 0) {
            container.appendChild(document.createElement('br'));
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
