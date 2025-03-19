// teamUsage.js
import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { database } from "../firebase.js";

export let teamCarUsage = {};
export let kartUsage = {};

export async function saveTeamCarUsage() {
    const refUsage = ref(database, 'teamCarUsage');
    await set(refUsage, teamCarUsage);
}

export async function loadTeamCarUsage() {
    const refUsage = ref(database, 'teamCarUsage');
    const snapshot = await get(refUsage);
    teamCarUsage = snapshot.val() || {};

    const refLastUsed = ref(database, 'kartLastUsedByTeam');
}


/**
 * Displays the team usage popup for the given team number.
 * It shows all usage entries (previous karts used) for that team.
 */
export function showTeamUsage(teamNumber) {
    const popup = document.getElementById('teamUsagePopup');
    const teamNumberElem = document.getElementById('teamNumberPopup');
    const listElem = document.getElementById('teamUsageList');
    teamNumberElem.textContent = teamNumber;
    const usageArr = teamCarUsage[teamNumber] || [];
    listElem.innerHTML = "";
    usageArr.forEach(record => {
        const li = document.createElement('li');
        li.textContent = record;
        listElem.appendChild(li);
    });
    popup.style.display = 'flex';
}

export function resetTeamCarUsage() {
    teamCarUsage = {};  
    kartUsage = {};
}

export async function loadKartUsage() {
    const snapshot = await get(ref(database, 'kartUsage'));
    kartUsage = snapshot.val() || {};
    console.log("Kart usage loaded:", kartUsage);
}

export async function saveKartUsage() {
    await set(ref(database, 'kartUsage'), kartUsage);
}

// clearly add team usage entry when kart is used:
export async function addKartUsage(kartId, teamNumber) {
    if (!kartUsage[kartId]) {
        kartUsage[kartId] = [];
    }
    kartUsage[kartId].push(`${teamNumber} at ${new Date().toLocaleTimeString()}`);
    await saveKartUsage();
}

// clearly display last used team for pit kart:
export function showLastUsedTeamForPitKart(kartId) {
    const popup = document.getElementById('teamUsagePopup');
    const teamNumberElem = document.getElementById('teamNumberPopup');
    const listElem = document.getElementById('teamUsageList');

    const usageHistory = kartUsage[kartId];

    teamNumberElem.textContent = `Kart ${kartId}`;
    listElem.innerHTML = "";

    const li = document.createElement('li');
    li.textContent = usageHistory && usageHistory.length
        ? `Last used by ${usageHistory[usageHistory.length - 1]}`
        : "No recorded team usage yet.";

    listElem.appendChild(li);
    popup.style.display = 'flex';
}