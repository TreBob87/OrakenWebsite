// Call displayTeamCarUsage on page load
window.onload = function()
{
    displayTeamCarUsage()
}
function displayTeamCarUsage() {
    const display = document.getElementById('carUsageDisplay');
    const loadedData = localStorage.getItem('teamCarUsage');
    if (loadedData) {
        const teamCarUsage = JSON.parse(loadedData);
        let content = '<ul>';
        for (const [team, cars] of Object.entries(teamCarUsage)) {
            content += `<li><strong>${team}:</strong> ${cars.join(', ')}</li>`;
        }
        content += '</ul>';
        display.innerHTML = content;
    } else {
        display.innerHTML = '<p>No car usage data available.</p>';
    }
}



function convertTeamCarUsageToCSV(teamCarUsage) {
    let csvContent = "Car ID,Colors\n"; // Start with the header

    // Build CSV content
    Object.entries(teamCarUsage).forEach(([carId, colors]) => {
        let colorString = colors.join(';');
        csvContent += `${carId},${colorString}\n`;
    });

    // Convert to Blob
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

function downloadCSV(csvBlob, fileName) {
    // Create an object URL for the blob
    let url = URL.createObjectURL(csvBlob);
    let link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up
}

function exportTeamCarUsage() {
    const loadedData = localStorage.getItem('teamCarUsage');
    if (!loadedData) {
        console.error('No teamCarUsage data available.');
        return;
    }
    const teamCarUsage = JSON.parse(loadedData);
    const teamCarUsageCSV = convertTeamCarUsageToCSV(teamCarUsage);
    downloadCSV(teamCarUsageCSV, "teamCarUsage.csv");
}

function updateTimersDisplay() {
    const timersContainer = document.getElementById('timersContainer');
    timersContainer.innerHTML = ''; // Clear existing timer displays

    for (const [carId, startTime] of Object.entries(carUsageStartTime)) {
        const currentTime = new Date().getTime();
        const duration = Math.floor((currentTime - startTime) / 1000); // Convert milliseconds to seconds

        const timerDisplay = document.createElement('p');
        timerDisplay.textContent = `Car ${carId}: ${duration} seconds on track`;
        timersContainer.appendChild(timerDisplay);
    }
}

// Call updateTimersDisplay at a set interval to refresh the timer displays
setInterval(updateTimersDisplay, 1000); // Update every second
