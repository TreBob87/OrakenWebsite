import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { database, auth } from "./firebase.js";

// Ensure user is logged in
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = '../login.html';
  }
});

let teamCarUsage = {};

window.addEventListener('load', () => {
  listenToTeamCarUsage(); // Real-time listener initialization

  document.getElementById('searchBtn').addEventListener('click', () => {
    const searchValue = document.getElementById('searchTerm').value.trim();
    displayTeamCarUsage(searchValue);
  });
});

/**
 * Real-time listener for 'teamCarUsage' data.
 */
function listenToTeamCarUsage() {
  const dbRef = ref(database, 'teamCarUsage');
  onValue(dbRef, (snapshot) => {
    teamCarUsage = snapshot.val() || {};
    const searchValue = document.getElementById('searchTerm').value.trim();
    displayTeamCarUsage(searchValue);
  }, (error) => {
    console.error("Failed to listen to teamCarUsage:", error);
    document.getElementById('carUsageDisplay').innerHTML =
      `<p style="color:red;">Error: ${error.message}</p>`;
  });
}

/**
 * Displays team usage history based on an optional search term.
 */
function displayTeamCarUsage(searchTerm = "") {
  let html = "<ul>";

  for (const [teamId, usageArray] of Object.entries(teamCarUsage)) {
    if (!Array.isArray(usageArray) || usageArray.length === 0) continue;

    if (!searchTerm) {
      const usageLine = usageArray.join("; ");
      html += `<li><strong>${teamId}:</strong> ${usageLine}</li>`;
      continue;
    }

    const lastEntry = usageArray[usageArray.length - 1];
    const parsed = parseUsageString(lastEntry);
    if (!parsed) continue;

    const { carId, color } = parsed;

    if (isNumeric(searchTerm)) {
      if (carId === searchTerm) {
        html += `<li><strong>${teamId}:</strong> ${lastEntry}</li>`;
      }
    } else {
      if (color.toLowerCase().includes(searchTerm.toLowerCase())) {
        html += `<li><strong>${teamId}:</strong> ${lastEntry}</li>`;
      }
    }
  }

  html += "</ul>";
  if (!html.includes("<li>")) {
    html = "<p>No matching results.</p>";
  }

  document.getElementById('carUsageDisplay').innerHTML = html;
}

/**
 * Parses usage strings such as "48 yellow at 9:48:45 PM".
 */
function parseUsageString(usageString) {
  const usageRegex = /^(\d+)\s+([a-zA-Z]+)(?:\s+at\s+(.+))?$/;
  const match = usageString.match(usageRegex);
  if (!match) return null;

  return {
    carId: match[1],
    color: match[2],
    time: match[3] || ""
  };
}

function isNumeric(str) {
  return /^\d+$/.test(str);
}
