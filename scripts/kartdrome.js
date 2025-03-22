// scripts/kartdrome.js

import { auth } from '../scripts/firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { 
    createBoxes, loadKartCounts, resetColors, loadSortOrderState, 
    updateSortOrder, saveSortOrderState, listenToSortOrderChanges 
} from './utils/boxes.js';

import { loadBoxColors, pickColor } from './utils/colors.js';
import { handleBoxClick, setSelectedColor, resetLastClickedBox } from './utils/boxClickHandler.js';
import { undoLastSwap } from './utils/swap.js';
import { loadTeamCarUsage, loadKartUsage, resetTeamCarUsage } from './utils/teamUsage.js';
import { initKartReplacement } from './utils/kartReplacement.js';
import { initQualiModeToggle, isQualiModeActive } from './utils/qualiMode.js';

// ✅ Ensure user is authenticated before accessing the page
onAuthStateChanged(auth, user => {
    if (!user) window.location.href = '../login.html';
});

document.addEventListener('DOMContentLoaded', async () => {
    // ✅ Load Team Car Usage & Kart Usage data
    await loadTeamCarUsage();
    await loadKartUsage();
    listenToSortOrderChanges();
    initQualiModeToggle();

    // ✅ Load kart counts from database
    const { kartsOnTrackCount, kartsInPitCount } = await loadKartCounts();

    // ✅ Generate boxes dynamically
    createBoxes('kartsOnTrack', kartsOnTrackCount);
    createBoxes('kartsInPit', kartsInPitCount);

    // ✅ Load sort order and box colors from Firebase
    await loadSortOrderState();
    await loadBoxColors();

    // ✅ Set up Sort Mode Toggle
    const sortToggle = document.getElementById('sortModeToggle');
    sortToggle.addEventListener('change', (e) => {
        const isAscending = e.target.checked;
        updateSortOrder(isAscending);
        saveSortOrderState(isAscending);
    });

    // ✅ Event listener for selecting kart performance color
    document.getElementById('kartPerformance').addEventListener('click', (e) => {
        const color = pickColor(e);
        setSelectedColor(color);
    });

    // ✅ Event listeners for box clicks & actions
    document.getElementById('kartsOnTrack').addEventListener('click', handleBoxClick);
    document.getElementById('kartsInPit').addEventListener('click', handleBoxClick);
    document.getElementById('resetButton').addEventListener('click', resetColors);
    document.getElementById('undoSwapButton').addEventListener('click', undoLastSwap);


    // ✅ Initialize Kart Replacement functionality
    initKartReplacement();

    // ✅ Close Team Usage Popup
    document.getElementById('closeTeamUsagePopup').addEventListener('click', () => {
        document.getElementById('teamUsagePopup').style.display = 'none';
    });
});
