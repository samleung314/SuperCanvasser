var router = require('express').Router();
var winston = require('../../winston');
var shared = require('./shared');
var dbHelper = require('../database/databaseHelper');

// Start canvassing
router.get('/startCanvass', async function(req, res, next) {
    await shared.setLogged(req); // Wait for database
    var date = new Date();
    date = date.toLocaleString('en-US');
    date = date.split(',')[0]; // Get the date (only the month, day, year)
    var task = await dbHelper.findTask(req.cookies.name, date); // Query the database for a task using your username and the date
    if (shared.canvasser) {
        if (task) { // If the task exists
            if (task.locations.length == task.completedLocations.length) { // and all locations are completed
                winston.info('Start Canvass: Canvasser level access'); // then the canvassing is complete and no task is shown
                res.render('noTask', {title: "SuperCanvasser", noTask: false, username: req.cookies.name, currentLocation, date, logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser});
            } else {
                winston.info('Start Canvass: Canvasser level access');
                var currentLocation = false;
                if (task.currentLocation) { // Otherwise check if there is already a current location (picking up from where we left off), and prompt for current location options
                    currentLocation = true;
                }
                res.render('startCanvass', {title: "SuperCanvasser", username: req.cookies.name, currentLocation, date, logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser});
            }
        } else { // No task
            winston.info('Start Canvass: No task found');
            res.render('noTask', {title: "SuperCanvasser", noTask: true, username: req.cookies.name, date, logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser});
        }
    } else {
        winston.info('Start Canvass: Non-canvasser access, redirect to index');
        res.render('index', {title: "SuperCanvasser", logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser});
    }
});

// Canvass
router.get('/canvass', async function(req, res, next) {
    await shared.setLogged(req); // Wait for database
    var date = new Date();
    date = date.toLocaleString('en-US');
    date = date.split(',')[0]; // Get the date (only the month, day, year)
    var task = await dbHelper.findTask(req.cookies.name, date); // Query the database for a task using your username and the date

    if (shared.canvasser) {
        if (task) { // If the task exists
            var destination = "";
            var locations = []; // Locations that have not yet been completed
            for (var i = 0;i < task.locations.length;i++) {
                var loc = task.locations[i];
                if (task.completedLocations.indexOf(loc) == -1) {
                    if (!destination) { // First incomplete destination is next destination, assuming list of destinations sorted in order of visiting
                        destination = loc;
                    }
                    locations.push(loc);
                }
            }
        
            var campaign = await dbHelper.getCampaign(task.campaignID); // Load the campaign based on the ID
            campaign.talk = campaign.talk.split('\n');
            var questions = [];
            for (var i = 0;i < campaign.questions.length;i += 1) { // For each question
                var q = {};
                q.question = campaign.questions[i]; // Map the question to an object containing the question and an ID
                q.id = i;
                questions.push(q);
            }
            campaign.questions = questions; // Set questions to the mapped question values instead

            if (locations.length == 0) { // If all locations are completed
                winston.info('Canvass: No remaining locations in task'); // then the canvassing is complete and no task is shown
                res.render('noTask', {title: "SuperCanvasser", noTask: false, username: req.cookies.name, date, logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser});
            } else if (task.currentLocation) { // If there is a selected current location
                winston.info('Canvass: Canvasser level access'); // allow the user to canvass
                res.render('canvass', {title: "SuperCanvasser", task, locations, destination, campaign, logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser});
            } else { // Otherwise make them choose a current location
                winston.info('Canvass: No current location');
                res.render('startCanvass', {title: "SuperCanvasser", logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser});
            }
        } else { // No task
            winston.info('Canvass: No task found');
            res.render('noTask', {title: "SuperCanvasser", noTask: true, username: req.cookies.name, date, logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser});           
        }
    } else {
        winston.info('Canvass: Non-canvasser access, redirect to index');
        res.render('index', {title: "SuperCanvasser", logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser});
    }
});

module.exports = router;
