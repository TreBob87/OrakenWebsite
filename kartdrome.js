window.onload = function() {
    createBoxes('kartsOnTrack', 45, 'Kart ');
    createBoxes('kartsInPit', 5, 'Lane ');
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
        console.log(labelPrefix)
        if (labelPrefix === 'Kart ') {
            box.textContent = i;
        }
        else {
            box.textContent = labelPrefix + i;
        }

        container.appendChild(box);
        if (containerId === 'kartsOnTrack') {
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

        if (selectedColor !== '') {
            box.style.backgroundColor = selectedColor;
            saveBoxColor(box);
            selectedColor = '';
            document.body.style.cursor = 'default'; // Reset cursor
        } else {
            if (parentID === 'kartsOnTrack') {
                lastClickedBox.track = box;
                swapColors();
            } else if (parentID === 'kartsInPit') {
                lastClickedBox.pit = box;
                swapColors();
            }
        }
    }
}

function swapColors() {
    if (lastClickedBox.track && lastClickedBox.pit) {
        const trackBox = lastClickedBox.track;
        const pitBox = lastClickedBox.pit;

        [trackBox.style.backgroundColor, pitBox.style.backgroundColor] =
            [pitBox.style.backgroundColor, trackBox.style.backgroundColor];

        saveBoxColor(trackBox);
        saveBoxColor(pitBox);

        lastClickedBox.track = null;
        lastClickedBox.pit = null;
    }
}

function resetColors() {
    if (confirm('Are you sure you want to reset all colors and change the number of karts?')) {
        // Ask for the number of karts on track and in pit
        const kartsOnTrackCount = parseInt(prompt("Enter the number of Karts-on-Track:", "15"), 10);
        const kartsInPitCount = parseInt(prompt("Enter the number of Karts-in-Pit:", "5"), 10);

        // Validate input and provide default values if invalid
        const validKartsOnTrackCount = isNaN(kartsOnTrackCount) ? 45 : kartsOnTrackCount;
        const validKartsInPitCount = isNaN(kartsInPitCount) ? 5 : kartsInPitCount;

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

        // Optionally, if you want to remove all localStorage entries not related to the current setup,
        // you could list all keys, filter out those not matching the current setup, and remove them.
        // This would require a more complex logic to identify which keys belong to the current setup
        // and is not shown here due to the simplicity of the current identifier scheme.
    }
}
