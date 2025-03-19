// scripts/utils/boxes.js
import { ref, get, set, remove, onValue } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { database } from "../firebase.js";
import { saveTeamCarUsage, resetTeamCarUsage, teamCarUsage, kartUsage, saveKartUsage } from "./teamUsage.js";
import { addLongPressListener } from "./utils.js";

export async function loadKartCounts() {
    const kartsOnTrackSnapshot = await get(ref(database, 'kartsOnTrackCount'));
    const kartsInPitSnapshot = await get(ref(database, 'kartsInPitCount'));

    return {
        kartsOnTrackCount: kartsOnTrackSnapshot.val() || 45,
        kartsInPitCount: kartsInPitSnapshot.val() || 5
    };
}



export function createBoxes(containerId, count) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; 

    let startId = containerId === 'kartsInPit' ? 1 : 1;

    for (let i = 0; i < count; i++) {
        const box = document.createElement('div');
        box.classList.add('box');
        box.id = `${containerId}-${startId + i}`;
        box.style.backgroundColor = 'grey';
        box.textContent = (i + 1).toString();

        addLongPressListener(box);  // ✅ Clearly attach listeners to BOTH!

        if (containerId === 'kartsOnTrack') {
            box.setAttribute('data-car-id', (startId + i).toString());
            if (!teamCarUsage[box.textContent]) {
                teamCarUsage[box.textContent] = [box.getAttribute('data-car-id')];
            }
        } else {
            box.style.fontWeight = 'bold';
            box.style.textDecoration = 'underline';
            box.setAttribute('data-car-id', "P" + (startId + i).toString());
        }

        container.appendChild(box);
    }
    saveTeamCarUsage();
}


export async function resetColors() {
    if (confirm("reset all colors and kart counts?")) {
        const trackCount = parseInt(prompt("Number of Karts-on-Track:", "45"), 10) || 45;
        const pitCount = parseInt(prompt("Number of Karts-in-Pit:", "5"), 10) || 5;

        await set(ref(database, 'kartsOnTrackCount'), trackCount);
        await set(ref(database, 'kartsInPitCount'), pitCount);
        await remove(ref(database, 'boxColors'));

        for (let kartId in kartUsage) {
            delete kartUsage[kartId];
        }
        await saveKartUsage();

        resetTeamCarUsage();
        await saveTeamCarUsage();

        createBoxes('kartsOnTrack', trackCount);
        createBoxes('kartsInPit', pitCount);
    }
}

export async function saveSortOrderState(isAscending) {
    try {
        const sortOrderRef = ref(database, 'sortOrder');
        await set(sortOrderRef, { isAscending });
        console.log("Sort order state saved:", isAscending);
    } catch (error) {
        console.error('Failed to save sort order state:', error);
    }
}

export async function loadSortOrderState() {
    const snapshot = await get(ref(database, 'sortOrder'));
    const isAscending = snapshot.exists() ? snapshot.val().isAscending : true;
    document.getElementById('sortModeToggle').checked = isAscending;
    updateSortOrder(isAscending);
}

export function updateSortOrder(isAscending) {
    const pitContainer = document.getElementById('kartsInPit');
    const boxes = Array.from(pitContainer.children);
    boxes.sort((a, b) => {
        const idA = parseInt(a.textContent, 10);
        const idB = parseInt(b.textContent, 10);
        return isAscending ? idA - idB : idB - idA;
    });

    pitContainer.innerHTML = '';
    boxes.forEach(box => pitContainer.appendChild(box));
}

export function listenToSortOrderChanges() {
    const sortOrderRef = ref(database, 'sortOrder');
    onValue(sortOrderRef, (snapshot) => {
        if (snapshot.exists()) {
            const { isAscending } = snapshot.val();
            const toggleElement = document.getElementById('sortModeToggle');
            if (toggleElement) {
                toggleElement.checked = isAscending;
                updateSortOrder(isAscending);
            }
        }
    });
}

