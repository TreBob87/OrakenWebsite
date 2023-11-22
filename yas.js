window.onload = function() {
    createBoxes('kartsOnTrack', 20, 'Kart ');
    createBoxes('kartsInPit', 4, 'Lane ');
    loadBoxColors();

    // Add event listeners
    document.getElementById('kartPerformance').addEventListener('click', pickColor);
    document.getElementById('kartsOnTrack').addEventListener('click', handleBoxClick);
    document.getElementById('kartsInPit').addEventListener('click', handleBoxClick);

    //Reset button
    document.getElementById('resetButton').addEventListener('click', resetColors);
};

function createBoxes(containerId, count, labelPrefix) {
    const container = document.getElementById(containerId);
    for (let i = 1; i <= count; i++) {
        const box = document.createElement('div');
        box.classList.add('box');
        box.id = `${containerId}-${i}`;  // Unique ID for each box
        box.style.backgroundColor = 'grey';
        box.textContent = labelPrefix + i;
        container.appendChild(box);

        if(containerId === 'kartsInPit') {
            if (i % 2 === 0) {
                container.appendChild(document.createElement('br'));
            }
        } else {
            if (i % 10 === 0) {
                container.appendChild(document.createElement('br'));
            }
        }
    }
}

function resetColors() {
    if (confirm('Are you sure you want to reset all colors and change the number of karts?')) {
        // Ask for the number of karts on track and in pit
        const kartsOnTrackCount = parseInt(prompt("Enter the number of Karts-on-Track:", "15"), 10);
        const kartsInPitCount = parseInt(prompt("Enter the number of Karts-in-Pit:", "4"), 10);

        // Validate input and provide default values if invalid
        const validKartsOnTrackCount = isNaN(kartsOnTrackCount) ? 45 : kartsOnTrackCount;
        const validKartsInPitCount = isNaN(kartsInPitCount) ? 6 : kartsInPitCount;

        // Remove existing boxes
        document.getElementById('kartsOnTrack').innerHTML = '';
        document.getElementById('kartsInPit').innerHTML = '';

        // Create new boxes with the specified numbers
        createBoxes('kartsOnTrack', validKartsOnTrackCount, 'Kart ');
        createBoxes('kartsInPit', validKartsInPitCount, 'Lane ');

        // Reset colors
        const trackBoxes = document.querySelectorAll('#kartsOnTrack .box');
        const pitBoxes = document.querySelectorAll('#kartsInPit .box');
        const allBoxes = [...trackBoxes, ...pitBoxes];

        allBoxes.forEach(box => {
            box.style.backgroundColor = 'grey';
            saveBoxColor(box);
        });
    }
}