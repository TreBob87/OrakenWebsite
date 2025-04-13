// scripts/utils/boxClickHandler.js

import { saveBoxColor } from './colors.js';
import { swapColorsAndIds } from './swap.js';

let selectedColor = '';
let currentlyHighlighted = null;
let lastClickedBox = { track: null, pit: null };

export function setSelectedColor(color) {
    selectedColor = color;
}

// Handle box clicks for colors and swaps
export async function handleBoxClick(event) {
    const box = event.target.closest('.box');
    if (!box) return;

    const parentID = box.parentNode.id;

    // Clear highlight if the same box is clicked again
    if (currentlyHighlighted === box) {
        box.classList.remove('highlighted');
        currentlyHighlighted = null;
        if (parentID === 'kartsOnTrack') lastClickedBox.track = null;
        if (parentID === 'kartsInPit') lastClickedBox.pit = null;
        return;
    }

    if (currentlyHighlighted && currentlyHighlighted !== box) {
        currentlyHighlighted.classList.remove('highlighted');
    }

    box.classList.add('highlighted');
    currentlyHighlighted = box;

    // COLOR PICKING MODE: If a color is already selected, apply it immediately.
    if (selectedColor) {
        box.style.backgroundColor = selectedColor;
        await saveBoxColor(box);
        selectedColor = ''; // Reset selected color
        document.body.style.cursor = 'default';

        currentlyHighlighted.classList.remove('highlighted');
        currentlyHighlighted = null;
        return; // Stop further processing.
    }

    // SWAP MODE: Save references for swap.
    if (parentID === 'kartsOnTrack') {
        lastClickedBox.track = box;
    } else if (parentID === 'kartsInPit') {
        lastClickedBox.pit = box;
    }

    if (lastClickedBox.track && lastClickedBox.pit) {
        lastClickedBox.track.classList.remove('highlighted');
        lastClickedBox.pit.classList.remove('highlighted');
        await swapColorsAndIds(lastClickedBox.track, lastClickedBox.pit, currentlyHighlighted);
        lastClickedBox.track = null;
        lastClickedBox.pit = null;
        currentlyHighlighted = null;
    }
}

export function resetLastClickedBox() {
    lastClickedBox.track = null;
    lastClickedBox.pit = null;
}

// Clears current selection states
function clearSelection() {
    lastClickedBox.track = null;
    lastClickedBox.pit = null;
    clearHighlight();
}

function clearHighlight() {
    if (currentlyHighlighted) {
        currentlyHighlighted.classList.remove('highlighted');
        currentlyHighlighted = null;
    }
}

// Clear highlights if clicked outside of boxes
document.addEventListener('click', (event) => {
    if (!event.target.closest('.box')) {
        clearSelection();
    }
});

// NEW: If a color is selected and the user clicks anywhere outside the kartPerformance container,
// clear the selected color and reset the cursor.
document.addEventListener('click', (event) => {
    const kartPerf = document.getElementById('kartPerformance');
    // If a color is selected and the click is not inside the kartPerformance container:
    if (selectedColor && (!kartPerf || !kartPerf.contains(event.target))) {
        selectedColor = '';
        document.body.style.cursor = 'default';
    }
});
