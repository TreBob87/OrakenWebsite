import { ref, get } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { database, auth } from "./firebase.js";

// Optional: ensure user is logged in
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // Redirect to login if not authenticated
    window.location.href = 'login.html';
  }
});

window.addEventListener('load', () => {
  // Initially display everything (no search)
  displayTeamCarUsage();

  // When user clicks "Search," we apply the filter logic
  document.getElementById('searchBtn').addEventListener('click', () => {
    const searchValue = document.getElementById('searchTerm').value.trim();
    displayTeamCarUsage(searchValue);
  });
});

/**
 * Fetches data from 'teamCarUsage' in Firebase and displays it in two modes:
 * 1) If no searchTerm given, show the *entire* usage line for each team.
 * 2) If searchTerm is given, parse the *last* usage entry for each team:
 *    - If searchTerm is all digits, do an *exact* match on carId.
 *    - Otherwise, do a *partial* match on color (case-insensitive).
 *    Only show that team if the last entry matches.
 */
async function displayTeamCarUsage(searchTerm = "") {
  const dbRef = ref(database, 'teamCarUsage');
  try {
    const snapshot = await get(dbRef);
    if (!snapshot.exists()) {
      document.getElementById('carUsageDisplay').innerHTML =
        "<p>No car usage data found.</p>";
      return;
    }

    const teamCarUsage = snapshot.val();
    let html = "<ul>";

    // Go through each team (1, 2, 3, etc.)
    for (const [teamId, usageArray] of Object.entries(teamCarUsage)) {
      // usageArray might be:
      // ["1 purple", "48 yellow at 9:48:45 PM", "2 green at 9:48:54 PM"]
      if (!Array.isArray(usageArray) || usageArray.length === 0) {
        continue;
      }

      // If there's NO search term, show the entire usage line
      if (!searchTerm) {
        const usageLine = usageArray.join("; ");
        html += `<li><strong>${teamId}:</strong> ${usageLine}</li>`;
        continue;
      }

      // Otherwise, we have a searchTerm. We only display the *last* entry if it matches.
      const lastEntry = usageArray[usageArray.length - 1];
      const parsed = parseUsageString(lastEntry);

      // If parsing fails or returns null, skip
      if (!parsed) {
        continue;
      }

      const { carId, color } = parsed;

      // If searchTerm is numeric => exact match on carId
      if (isNumeric(searchTerm)) {
        if (carId === searchTerm) {
          // Show only the last entry
          html += `<li><strong>${teamId}:</strong> ${lastEntry}</li>`;
        }
      } else {
        // Otherwise, do a partial match on color (case-insensitive)
        if (color.toLowerCase().includes(searchTerm.toLowerCase())) {
          html += `<li><strong>${teamId}:</strong> ${lastEntry}</li>`;
        }
      }
    }

    html += "</ul>";

    // If we have no <li>, it means no matching results
    if (!html.includes("<li>")) {
      html = "<p>No matching results.</p>";
    }

    document.getElementById('carUsageDisplay').innerHTML = html;

  } catch (error) {
    console.error("Failed to load teamCarUsage:", error);
    document.getElementById('carUsageDisplay').innerHTML =
      `<p style="color:red;">Error: ${error.message}</p>`;
  }
}

/**
 * Parse a usage string of the form:
 *   "carId color"
 *   or
 *   "carId color at time"
 *
 * e.g. "48 yellow at 9:48:45 PM"
 * Returns { carId, color, time } or null if it doesn't parse.
 */
function parseUsageString(usageString) {
  // Example regex:
  // ^(\d+)         -> 1) one or more digits (carId)
  // \s+([a-zA-Z]+) -> 2) one or more letters (color)
  // (?:\s+at\s+(.+))? -> optional "at time"
  const usageRegex = /^(\d+)\s+([a-zA-Z]+)(?:\s+at\s+(.+))?$/;
  const match = usageString.match(usageRegex);
  if (!match) {
    return null;
  }
  return {
    carId: match[1],      // e.g. "48"
    color: match[2],      // e.g. "yellow"
    time: match[3] || ""  // e.g. "9:48:45 PM" or ""
  };
}

/** Helper to check if a string is purely digits (e.g. "2" => true, "12" => true, "2a" => false). */
function isNumeric(str) {
  return /^\d+$/.test(str);
}
