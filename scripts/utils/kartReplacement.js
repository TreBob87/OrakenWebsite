// scripts/utils/kartReplacement.js

import { saveBoxColor } from './colors.js';
import { saveTeamCarUsage, teamCarUsage } from './teamUsage.js';

let replacementIdCounter = 1;
let selectedKartBox = null;

// Initialize kart replacement popup
export function initKartReplacement() {
    const replaceKartButton = document.getElementById('replaceKartButton');
    const replaceKartPopup = document.getElementById('replaceKartPopup');
    const kartSelectionContainer = document.getElementById('kartSelectionContainer');
    const confirmReplacementButton = document.getElementById('confirmReplacementButton');
    const cancelReplacementButton = document.getElementById('cancelButton')

    // Open popup and list karts
    replaceKartButton.addEventListener('click', () => {
        kartSelectionContainer.innerHTML = '';
        const allKarts = [...document.querySelectorAll('#kartsOnTrack .box'), ...document.querySelectorAll('#kartsInPit .box')];

        allKarts.forEach(kart => {
            const kartOption = document.createElement('div');
            kartOption.classList.add('kart-option');
            const location = kart.parentElement.id === 'kartsOnTrack' ? 'Track' : 'Pitlane';
            kartOption.textContent = `${location}: Kart ${kart.textContent} (ID: ${kart.getAttribute('data-car-id')})`;

            kartOption.addEventListener('click', () => {
                if (selectedKartBox) {
                    selectedKartBox.classList.remove('highlighted');
                }
                selectedKartBox = kart;
                kartSelectionContainer.querySelectorAll('.kart-option').forEach(opt => opt.classList.remove('highlighted'));
                kartOption.classList.add('highlighted');
            });

            kartSelectionContainer.appendChild(kartOption);
        });

        replaceKartPopup.style.display = 'block';
    });

    // Confirm replacement
    confirmReplacementButton.addEventListener('click', async () => {
        if (!selectedKartBox) {
            alert('Please select a kart to replace.');
            return;
        }

        selectedKartBox.setAttribute('data-car-id', `r${replacementIdCounter++}`);
        selectedKartBox.style.backgroundColor = 'grey';

        const teamNumber = selectedKartBox.textContent.trim();
        if (teamCarUsage[teamNumber]) {
            teamCarUsage[teamNumber].push(`${selectedKartBox.getAttribute('data-car-id')} ${selectedKartBox.style.backgroundColor} at ${new Date().toLocaleTimeString()}`);
            await saveTeamCarUsage();
        }

        await saveBoxColor(selectedKartBox);
        replaceKartPopup.style.display = 'none';
        selectedKartBox = null;
    });

    // ✅ Cancel Replacement (Closes Popup)
    cancelReplacementButton.addEventListener('click', () => {
        selectedKartBox = null; // Reset selection
        replaceKartPopup.style.display = 'none';
    });

    // Close popup if clicking outside
    document.addEventListener('click', (event) => {
        if (replaceKartPopup.style.display === 'block' &&
            !replaceKartPopup.contains(event.target) &&
            !replaceKartButton.contains(event.target)) {
            replaceKartPopup.style.display = 'none';
        }
    });
}
