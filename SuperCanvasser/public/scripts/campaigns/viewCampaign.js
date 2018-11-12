function init() { // Initialize the addCampaign view using campaign information stored in original-campaign
    var campaign = JSON.parse(document.getElementById('original-campaign').value); // Get the campaign information object

    var managers = document.getElementById('managers').children; // Get the list of all managers
    for (var i = 0;i < managers.length;i += 1) {
        var manager = managers[i].children[0]; // For each manager
        if ($.inArray(manager.value, campaign.managers) != -1) { // If it is in the campaign manager list, check it
            manager.checked = true;
        }
    }

    document.getElementById('start-date').value = campaign.startDate; // Load start and end dates
    document.getElementById('end-date').value = campaign.endDate;

    document.getElementById('talk').value = campaign.talk; // Load talking points

    
    var questions = campaign.questions; // Get the list of questions
    for (var i = 0;i < questions.length;i += 1) { // For each question, add it to the next available question slot
        document.getElementById('question' + (i + 1)).value = questions[i];
        if (i < questions.length - 1) { // Then add a new question slot (except for the last question because we start with 1 extra question slot)
            addQuestion();
        }
    }

    document.getElementById('duration').value = campaign.duration; // Load campaign duration

    document.getElementById('location').value = campaign.locations.join('\n'); // Load campaign locations (from array)

    var canvassers = document.getElementById('canvassers').children; // Get the list of all canvassers
    for (var i = 0;i < canvassers.length;i += 1) {
        var canvasser = canvassers[i].children[0]; // For each canvasser
        if ($.inArray(canvasser.value, campaign.canvassers) != -1) { // If it is in the campaign canvasser list, check it
            canvasser.checked = true;
        }
    }
}

init();
