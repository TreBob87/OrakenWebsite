// scripts/utils/qualiMode.js

import { ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { database } from "../firebase.js";

export let qualiModeActive = false;

/**
 * Initializes the Quali Mode toggle:
 * 1. Sets up a Firebase listener so that the saved state is loaded and applied.
 * 2. Uses a polling function to wait for the toggle element to exist before attaching a change listener.
 */
export function initQualiModeToggle() {
  // 1. Listen to real-time changes from Firebase at "qualiMode"
  const qualiModeRef = ref(database, "qualiMode");
  onValue(qualiModeRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      if (typeof data.isOn === "boolean") {
        qualiModeActive = data.isOn;
        const toggle = document.getElementById("qualiModeToggle");
        if (toggle) {
          toggle.checked = data.isOn;
        }
      }
    } else {
      console.log("No Quali Mode data found in Firebase. Defaulting to OFF.");
    }
  }, (error) => {
    console.error("Error loading Quali Mode state:", error);
  });

  // 2. Wait for the toggle element to appear and attach the change event
  const waitForToggle = () => {
    const toggle = document.getElementById("qualiModeToggle");
    if (toggle) {
      toggle.addEventListener("change", () => {
        qualiModeActive = toggle.checked;
        console.log(`Quali Mode toggled by user. Now: ${qualiModeActive ? 'ON' : 'OFF'}`);
        saveQualiModeState(qualiModeActive);
      });
    } else {
      // Retry after 100ms if the element is not yet available
      setTimeout(waitForToggle, 100);
    }
  };
  waitForToggle();
}

/**
 * Saves the current Quali Mode state to Firebase.
 */
async function saveQualiModeState(isOn) {
  try {
    await set(ref(database, "qualiMode"), { isOn });
  } catch (err) {
    console.error("Failed to save Quali Mode state:", err);
  }
}

/**
 * Returns the current Quali Mode state.
 */
export function isQualiModeActive() {
  return qualiModeActive;
}
