// scripts/swap.js
import { saveBoxColor } from "./colors.js";
import { qualiModeActive } from "./qualiMode.js";
import { saveTeamCarUsage, teamCarUsage, addKartUsage } from "./teamUsage.js";

export let lastSwap = null;

export async function swapColorsAndIds(trackBox, pitBox, currentlyHighlighted, qualiModeActive) {
    // Explicit highlight check: Only perform swap if a valid box is highlighted.
    if (!currentlyHighlighted || !(currentlyHighlighted === trackBox || currentlyHighlighted === pitBox)) {
        console.log("Swap aborted: No valid box highlighted");
        return;
    }

    const teamNumber = trackBox.textContent.trim();
    const pitKartId = pitBox.getAttribute('data-car-id');

    // Record previous state for potential undo functionality
    lastSwap = {
        teamNumber,
        trackBox: {
            id: trackBox.id,
            dataCarId: trackBox.getAttribute('data-car-id'),
            color: trackBox.style.backgroundColor
        },
        pitBox: {
            id: pitBox.id,
            dataCarId: pitKartId,
            color: pitBox.style.backgroundColor
        }
    };

    // Swap the colors of the two boxes
    const tempColor = trackBox.style.backgroundColor;
    trackBox.style.backgroundColor = pitBox.style.backgroundColor;
    pitBox.style.backgroundColor = tempColor;

    // Swap the data-car-id attributes
    const tempId = trackBox.getAttribute('data-car-id');
    trackBox.setAttribute('data-car-id', pitKartId);
    pitBox.setAttribute('data-car-id', tempId);

    // If Quali Mode is OFF, update team usage data in Firebase
    if (!qualiModeActive) {
        // Define a function that updates the local teamCarUsage array and then saves it
        const updateTeamUsage = () => {
            if (!teamCarUsage[teamNumber]) {
                teamCarUsage[teamNumber] = [];
            }
            // Use the updated data-car-id from trackBox after the swap
            const newCarId = trackBox.getAttribute('data-car-id');
            const timestamp = new Date().toLocaleTimeString();
            teamCarUsage[teamNumber].push(`${newCarId} ${trackBox.style.backgroundColor} at ${timestamp}`);
            console.log("Saving last used team", { pitKartId, teamNumber });
            return saveTeamCarUsage();
        };

        // Run addKartUsage and the team usage update concurrently
        await Promise.all([
            addKartUsage(pitKartId, teamNumber),
            updateTeamUsage()
        ]);
    }

    // Update the box colors in Firebase concurrently
    await Promise.all([
        saveBoxColor(trackBox),
        saveBoxColor(pitBox)
    ]);

    currentlyHighlighted.classList.remove('highlighted');
}
 
export async function undoLastSwap() {
    if (!lastSwap) {
        alert("No swap to undo.");
        return;
    }
    const trackBox = document.getElementById(lastSwap.trackBox.id);
    const pitBox = document.getElementById(lastSwap.pitBox.id);
    if (!trackBox || !pitBox) {
        alert("Unable to undo swap: boxes not found.");
        return;
    }
    trackBox.setAttribute('data-car-id', lastSwap.trackBox.dataCarId);
    trackBox.style.backgroundColor = lastSwap.trackBox.color;
    pitBox.setAttribute('data-car-id', lastSwap.pitBox.dataCarId);
    pitBox.style.backgroundColor = lastSwap.pitBox.color;

    const teamNumber = lastSwap.teamNumber;
    if (teamCarUsage[teamNumber] && teamCarUsage[teamNumber].length > 0) {
        teamCarUsage[teamNumber].pop();
        await saveTeamCarUsage();
    }
    await Promise.all([
        saveBoxColor(trackBox),
        saveBoxColor(pitBox)
    ]);
    lastSwap = null;
    alert("Last swap undone.");
}
