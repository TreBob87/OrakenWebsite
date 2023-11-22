window.onload = function() {
    createBoxes('kartsOnTrack', 45, 'Kart ');
    createBoxes('kartsInPit', 6, 'Lane ');
    loadBoxColors();

    // Add event listeners
    document.getElementById('kartPerformance').addEventListener('click', pickColor);
    document.getElementById('kartsOnTrack').addEventListener('click', handleBoxClick);
    document.getElementById('kartsInPit').addEventListener('click', handleBoxClick);
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
