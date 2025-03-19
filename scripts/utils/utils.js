//utils.js

import { showTeamUsage, showLastUsedTeamForPitKart } from './teamUsage.js';

export function addLongPressListener(box) {
    let timer;
    const duration = 1000;

    const startPress = () => {
        timer = setTimeout(() => {
            const isPitLane = box.parentNode.id === 'kartsInPit';
            const kartId = box.getAttribute('data-car-id');

            console.log("Long-pressed box details:", { isPitLane, kartId });

            if (isPitLane) {
                showLastUsedTeamForPitKart(kartId);
            } else {
                showTeamUsage(box.textContent.trim());
            }
        }, duration);
    };

    const cancelPress = () => clearTimeout(timer);

    box.addEventListener('mousedown', startPress);
    box.addEventListener('mouseup', cancelPress);
    box.addEventListener('mouseleave', cancelPress);
    box.addEventListener('touchstart', startPress, {passive: true});
    box.addEventListener('touchend', cancelPress);
    box.addEventListener('touchcancel', cancelPress);
}
