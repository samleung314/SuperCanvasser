function init() { // Initialize the editGlobal view using global information stored in original-globals
    var globals = JSON.parse(document.getElementById('original-globals').value); // Get the globals information object

    document.getElementById('input-work-day-duration').value = globals.workDayDuration;
    document.getElementById('input-average-travel-time').value = globals.avgTravelTime;
}

init();