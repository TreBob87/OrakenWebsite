// scripts/utils/colors.js
import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { database } from "../firebase.js";
import { teamCarUsage, saveTeamCarUsage } from "./teamUsage.js";
import { isQualiModeActive } from "./qualiMode.js";

export async function loadBoxColors() {
  const boxes = document.querySelectorAll('.box');
  boxes.forEach(box => {
    const boxRef = ref(database, 'boxColors/' + box.id);
    onValue(boxRef, (snapshot) => {
      if (snapshot.exists()) {
        box.style.backgroundColor = snapshot.val();
      }
    });
  });
}

export async function saveBoxColor(box) {
  const boxRef = ref(database, 'boxColors/' + box.id);
  await set(boxRef, box.style.backgroundColor);

  // If the box is in kartsOnTrack and Quali Mode is OFF, update usage.
  if (box.parentNode.id === 'kartsOnTrack' && !isQualiModeActive()) {
    const teamNumber = box.textContent.trim();
    if (!teamCarUsage[teamNumber]) return;
    const lastIndex = teamCarUsage[teamNumber].length - 1;
    if (lastIndex >= 0) {
      const lastEntry = teamCarUsage[teamNumber][lastIndex];
      const timestampMatch = lastEntry.match(/at\s+(.+)$/);
      const timestamp = timestampMatch ? timestampMatch[1] : "";
      teamCarUsage[teamNumber][lastIndex] = `${box.getAttribute('data-car-id')} ${box.style.backgroundColor} ${timestamp ? `at ${timestamp}` : ""}`;
      await saveTeamCarUsage();
    }
  }
}

export function pickColor(event) {
  const selectedColor = event.target.style.backgroundColor;
  createCustomCursor(selectedColor);
  return selectedColor;
}

export function createCustomCursor(color) {
  const cursorSize = 20;
  const canvas = document.createElement('canvas');
  canvas.width = cursorSize;
  canvas.height = cursorSize;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, cursorSize, cursorSize);
  const cursorUrl = canvas.toDataURL();
  document.body.style.cursor = `url(${cursorUrl}) ${cursorSize / 2} ${cursorSize / 2}, auto`;
}
