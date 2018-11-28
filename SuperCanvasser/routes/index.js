var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var db = mongoose.connection;
var dbHelper = require('./databaseHelper');
var winston = require('../winston');

logValue = "Login";
loggedIn = false;
manager = false;
canvasser = false;
admin = false;
username = null;
async function setLogged(req) {
    //Keeps track of whether user is logged in or out
    if (req.cookies.name == "" || req.cookies.name == null) {
        logValue = "Login"
        loggedIn = false;
    } else {
        logValue = "Logout"
        loggedIn = true;
    }
    await getUserData(req); // Wait for database to get user data
}

// Get the user role data from the database
async function getUserData(req) {
    return new Promise(function(resolve, reject) { // Create promise for retrieving user data
        username = req.cookies.name;
        if (username) {
            db.collection('users').findOne({ 'username': username }, function (err, ret) {
                if (err) return handleError(err);
                if (ret) { // User found
                    manager = ret.campaignManager;
                    canvasser = ret.canvasser;
                    admin = ret.sysAdmin;
                } else { // User not found
                    manager = false;
                    canvasser = false;
                    admin = false;
                }
                resolve(); // Database contacted, resolve
            });
        } else { // No username
            manager = false;
            canvasser = false;
            admin = false;
            resolve(); // No username provided, resolve
        }
    });
}

/* GET home page. */
router.get('/', async function(req, res, next) {
    winston.info('Index page access')
    await setLogged(req); // Wait for database
    if (!loggedIn) { //if you are logged out
        res.render('login', { title: "SuperCanvasser", logged: logValue, message: "Welcome. Please login.",  admin, manager, canvasser})
        winston.info('Prompt for login')
    } else {
        res.render('index', { title: "SuperCanvasser", logged: logValue, admin, manager, canvasser})
        winston.info('User already logged in')
    }
});

router.get('/login.hbs', function (req, res, next) {
    winston.info('Login page access')
    if (!loggedIn) {
        //if you are logged out
        //login
        winston.info('Prompt for login')
        res.render('login', { title: 'SuperCanvasser', logged: logValue, admin, manager, canvasser });
    } else {
        //if you are logged in
        //logout
        winston.info('User logged out')
        res.clearCookie('name');
        res.render('login', { title: "SuperCanvasser", logged: "Login", admin, manager, canvasser});
    }
});

// SysAdmin add new user
router.get('/addUser.hbs', async function (req, res, next) {
    await setLogged(req); // Wait for database
    if (admin) {
        winston.info('Admin level page, access add user')
        res.render('addUser', { title: 'SuperCanvasser', logged: logValue, admin, manager, canvasser });
    } else {
        winston.info('User is not admin, non-admin page access')
        res.render('index', { title: "SuperCanvasser", logged: logValue, admin, manager, canvasser });
    }
});

// New user register as canvasser
router.get('/register.hbs', async function (req, res, next) {
    await setLogged(req); // Wait for database
    if (!admin && !manager && !canvasser) {
        winston.info('User is not admin, manager, or canvasser, prompt to register')
        res.render('register', { title: 'SuperCanvasser', logged: logValue, message: "This page is for canvasser registration. To become a manager please contact an administrator." });
    } else {
        winston.info('User is already logged in, direct to index page')
        res.render('index', { title: "SuperCanvasser", logged: logValue, admin, manager, canvasser });
    }
});

// Canvasser edit availability page
router.get('/editAvailability.hbs', async function (req, res, next) {
    await setLogged(req); // Wait for database
    if (canvasser) {
        winston.info('User is a canvasser, prepare info for the availability calendar.');
        var user = await dbHelper.getUser(req.cookies.name);
        var dates = user.availability;
        var length = 0; //number of dates already marked available
        if (dates != null) {
            length = dates.length;
        }
        var availability = [];
        var quote = "'";
        for (var i = 0; i < length; i++){
            var date = new Date(dates[i]);
            availability.push(quote.concat(date, quote));
        }
        res.render('editAvailability', { title: "SuperCanvasser", logged: logValue, admin, manager, canvasser, availability: availability});
    } else {
        winston.info('User is not a canvasser, redirect to index page')
        res.render('index', { title: "SuperCanvasser", logged: logValue, admin, manager, canvasser });
    } 
});

function campaignCompare(a, b) {
    if (a.id < b.id) {
        return -1;
    } else if (a.id > b.id) {
        return 1;
    }
    return 0;
}

// Campaign main page
router.get('/campaigns.hbs', async function(req, res, next) {
    winston.info('Access campaign main page')
    await setLogged(req); // Wait for database
    var campaigns = await dbHelper.getCampaigns();
    campaigns.sort(campaignCompare);
    if (manager) {
        winston.info('Manager access, manage campaigns')
        res.render('campaigns', {title: "SuperCanvasser", logged: logValue, campaigns, admin, manager, canvasser});
    } else {
        winston.info('Non-manager access, redirect to index page')
        res.render('index', {title: "SuperCanvasser", logged: logValue, admin, manager, canvasser});
    } 
})

// Add Campaign page
router.get('/addCampaign', async function(req, res, next) {
    winston.info('Access add campaign page')
    var message = req.query.message; // Load message and campaign (if failed to add)
    var campaign = req.query.campaign;
    await setLogged(req); // Wait for database
    var managers = await dbHelper.getManagers(); // Load list of managers and canvassers
    var canvassers = await dbHelper.getCanvassers();
    if (manager) {
        if (campaign) { // If we have the campaign, reload the addCampaign view with the old campaign information
            res.render('addCampaign', {title: "SuperCanvasser", subtitle: "Add Campaign", logged: logValue, managers, canvassers, action: '/database/addCampaign', message, campaign, editCampaign: true, admin, manager, canvasser});
        } else {
            res.render('addCampaign', {title: "SuperCanvasser", subtitle: "Add Campaign", logged: logValue, managers, canvassers, action: '/database/addCampaign', message, admin, manager, canvasser});
        }
    } else {
        res.render('index', {title: "SuperCanvasser", logged: logValue, admin, manager, canvasser});
    } 
})

// View Campaign page
router.get('/campaign/:id', async function(req, res, next) {
    var id = parseInt(req.params.id); // Get the ID
    await setLogged(req);
    var campaign = await dbHelper.getCampaign(id); // Load the campaign based on the ID
    campaign.talk = campaign.talk.split('\n');
    var edit = true;
    winston.info('Access campaign: ' + id)
    if (Date.now() > Date.parse(campaign.startDate)) { // Only allow editting if the campaign has not started
        winston.info('Campaign edit allowed, has not started')
        edit = false;
    }
    if (manager) {
        winston.info('View Campaign: Manager level access')
        res.render('campaign', {title: "SuperCanvasser", logged: logValue, campaign, edit, admin, manager, canvasser});
    } else {
        winston.info('View Campaign: Non-manager access, redirect to index')
        res.render('index', {title: "SuperCanvasser", logged: logValue, admin, manager, canvasser});
    }   
})

// Edit Campaign page
router.get('/editCampaign/:id', async function(req, res, next) {
    var message = req.query.message; // Load message and campaign (if failed to edit)
    var campaign = req.query.campaign;
    var id = parseInt(req.params.id);
    await setLogged(req);
    var managers = await dbHelper.getManagers(); // Load list of managers and canvassers
    var canvassers = await dbHelper.getCanvassers();
    winston.info('Access Edit Campaign ID: ' + id)
    if (!campaign) { // If there is no previous campaign edit attempt
        campaign = await dbHelper.getCampaign(id); // Load the campaign based on the ID
        campaign = JSON.stringify(campaign);
    }
    if (manager) {
        winston.info('Edit Campaign: Manager level access')
        res.render('addCampaign', {title: "SuperCanvasser", subtitle: "Edit Campaign " + id, logged: logValue, campaign, managers, canvassers, action: '/database/editCampaign', editCampaign: true, message, admin, manager, canvasser});
    } else {
        winston.info('Edit Campaign: Non-manager level access, redirect to index')
        res.render('index', {title: "SuperCanvasser", logged: logValue, admin, manager, canvasser});
    }       
})

function userCompare(a, b) {
    if (a.username < b.username) {
        return -1;
    } else if (a.username > b.username) {
        return 1;
    }
    return 0;
}

// Users main page
router.get('/users', async function(req, res, next) {
    await setLogged(req); // Wait for database
    var users = await dbHelper.getUsers();
    console.log(users);
    users.sort(userCompare);
    winston.info('Access users main page')
    if (admin) {
        winston.info('User is admin, access admin main page')
        res.render('users', {title: "SuperCanvasser", logged: logValue, users, admin, manager, canvasser});
    } else {
        res.render('index', {title: "SuperCanvasser", logged: logValue, admin, manager, canvasser});
    } 
})

// Edit User page
router.get('/editUser/:id', async function(req, res, next) {
    var id = req.params.id;
    console.log(id);
    var user = await dbHelper.getUser(id); // Load the user based on the username
    user = JSON.stringify(user);
    winston.info('Edit User: ' + id)
    if (admin) {
        winston.info('Edit User: Admin level access')
        res.render('editUser', {title: "SuperCanvasser", subtitle: "Edit User", logged: logValue, user, admin, manager, canvasser, editUser: true, action: '/database/editUser'}); 
    } else {
        winston.info('Edit User: Non-admin level access')
        res.render('index', {title: "SuperCanvasser", logged: logValue, admin, manager, canvasser});
    }
})

// Edit global variables page
router.get('/editGlobals', async function(req, res, next) {
    await setLogged(req); // Wait for database
    var globals = await dbHelper.getGlobals();
    globals = JSON.stringify(globals);
    console.log(globals);
    if (admin) {
        winston.info('Edit Globals: Admin level access')
        res.render('editGlobals', {title: "SuperCanvasser", subtitle: "Edit Globals", logged: logValue, globals, admin, manager, canvasser, editGlobals:true, action: '/database/editGlobals'});
    } else {
        winston.info('Edit Globals: Non-admin access, redirect to index')
        res.render('index', {title: "SuperCanvasser", logged: logValue, admin, manager, canvasser});
    } 
})

// Start canvassing
router.get('/startCanvass', async function(req, res, next) {
    await setLogged(req); // Wait for database
    var date = new Date();
    date = date.toLocaleString('en-US');
    date = date.split(',')[0]; // Get the date (only the month, day, year)
    var task = await dbHelper.findTask(req.cookies.name, date); // Query the database for a task using your username and the date
    if (canvasser) {
        if (task) { // If the task exists
            if (task.locations.length == task.completedLocations.length) { // and all locations are completed
                winston.info('Start Canvass: Canvasser level access'); // then the canvassing is complete and no task is shown
                res.render('noTask', {title: "SuperCanvasser", noTask: false, username: req.cookies.name, currentLocation, date, logged: logValue, admin, manager, canvasser});
            } else {
                winston.info('Start Canvass: Canvasser level access');
                var currentLocation = false;
                if (task.currentLocation) { // Otherwise check if there is already a current location (picking up from where we left off), and prompt for current location options
                    currentLocation = true;
                }
                res.render('startCanvass', {title: "SuperCanvasser", username: req.cookies.name, currentLocation, date, logged: logValue, admin, manager, canvasser});
            }
        } else { // No task
            winston.info('Start Canvass: No task found');
            res.render('noTask', {title: "SuperCanvasser", noTask: true, username: req.cookies.name, date, logged: logValue, admin, manager, canvasser});
        }
    } else {
        winston.info('Start Canvass: Non-canvasser access, redirect to index');
        res.render('index', {title: "SuperCanvasser", logged: logValue, admin, manager, canvasser});
    }
});

// Canvass
router.get('/canvass', async function(req, res, next) {
    await setLogged(req); // Wait for database
    var date = new Date();
    date = date.toLocaleString('en-US');
    date = date.split(',')[0]; // Get the date (only the month, day, year)
    var task = await dbHelper.findTask(req.cookies.name, date); // Query the database for a task using your username and the date

    if (canvasser) {
        if (task) { // If the task exists
            var destination = "";
            var destinationID = "";
            var locations = []; // Locations that have not yet been completed
            for (var i = 0;i < task.locations.length;i++) {
                var loc = task.locations[i];
                if (task.completedLocations.indexOf(loc.id) == -1) {
                    if (!destination) { // First incomplete destination is next destination, assuming list of destinations sorted in order of visiting
                        destination = loc.number + ', ' + loc.street + ', ' + loc.unit + ', ' + loc.city + ', ' + loc.state + ', ' + loc.zip;
                        destinationID = loc.id;
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
                res.render('noTask', {title: "SuperCanvasser", noTask: false, username: req.cookies.name, date, logged: logValue, admin, manager, canvasser});
            } else if (task.currentLocation) { // If there is a selected current location
                winston.info('Canvass: Canvasser level access'); // allow the user to canvass
                res.render('canvass', {title: "SuperCanvasser", task, locations, destination, destinationID, campaign, logged: logValue, admin, manager, canvasser});
            } else { // Otherwise make them choose a current location
                winston.info('Canvass: No current location');
                res.render('startCanvass', {title: "SuperCanvasser", logged: logValue, admin, manager, canvasser});
            }
        } else { // No task
            winston.info('Canvass: No task found');
            res.render('noTask', {title: "SuperCanvasser", noTask: true, username: req.cookies.name, date, logged: logValue, admin, manager, canvasser});           
        }
    } else {
        winston.info('Canvass: Non-canvasser access, redirect to index');
        res.render('index', {title: "SuperCanvasser", logged: logValue, admin, manager, canvasser});
    }
});


router.get('/viewAssignments', async function(req, res, next) {
    var campaigns = await dbHelper.getCampaigns();
    campaigns.sort(campaignCompare);
    console.log(campaigns);
    if (manager) {
        winston.info('View Tasks: Manager level access')
        res.render('viewAssignments', { title: "SuperCanvasser", subtitle: "Choose Assignment", campaigns, logged: logValue, admin: admin, manager: manager, canvasser}); 
    } else {
        winston.info('View Tasks: Non-manager level access')
        res.render('index', {title: "SuperCanvasser", logged: logValue});
    }
})

// View Tasks page
router.get('/viewTasks/:id', async function(req, res, next) {
    var id = req.params.id;
    console.log(id);
    tasks = await dbHelper.getTasks(id); // Load the tasks based on the canvassing id    console.log(id);
    console.log(tasks);
    winston.info('Viewing Tasks for Canvassing Assignment: ' + id)
    if (manager) {
        winston.info('View Tasks: Manager level access')
        res.render('viewTasks', { title: "SuperCanvasser", subtitle: "View Tasks", tasks, logged: logValue, admin: admin, manager: manager, canvasser}); 
    } else {
        winston.info('View Tasks: Non-manager level access')
        res.render('index', {title: "SuperCanvasser", logged: logValue});
    }
})

function checkDates(tasks, date) {
    var newTasks = new Array();

    for (var i = 0; i < tasks.length; i++) {
        if (compareDates(tasks[i].date, date)) {
            newTasks.push(tasks[i]);
        }
    }

    console.log("new");
    console.log(newTasks);
    return newTasks;
}

function compareDates(laterDate, earlierDate) {
    var date1 = laterDate.split("/");
    var date2 = earlierDate.split("/");

    if (parseInt(date1[2]) < parseInt(date2[2])) {
        return false;
    }

    if (parseInt(date1[0]) < parseInt(date2[0])) {
        return false;
    } else if (parseInt(date1[0]) == parseInt(date2[0])) {
        if (parseInt(date1[1]) < parseInt(date2[1])) {
            return false;
        }
    }

    return true;
}

// View Upcoming Canvassing Assignments page for hw 7 ;)
router.get('/upcoming', async function(req, res, next) {
    tasks = await dbHelper.getUpcomingTasks(username); // Load the tasks based on the canvassing id    console.log(id);

    var date = new Date();
    date = date.toLocaleString('en-US');
    date = date.split(',')[0]; // Get the date (only the month, day, year)
    console.log(date);

    tasks = checkDates(tasks, date);

    console.log(tasks);
    winston.info('Viewing Upcoming Canvassing Assignment: ' + username)
    if (manager) {
        winston.info('View Upcoming Canvassing Assignment: Manager level access')
        res.render('upcoming', { title: "SuperCanvasser", subtitle: "View Upcoming Canvassing Assignments", tasks, logged: logValue, admin: admin, manager: manager, canvasser}); 
    } else {
        winston.info('View Upcoming Canvassing Assignment: Non-manager level access')
        // res.render('upcoming', { title: "SuperCanvasser", subtitle: "Viewing Upcoming Canvassing Assignments", tasks, logged: logValue, admin: admin, manager: manager, canvasser}); 
        res.render('index', { title: "SuperCanvasser", logged: logValue, admin: admin, canvasser});
    }
})

// View Task page
router.get('/viewTask/:id', async function(req, res, next) {
    var id = parseInt(req.params.id); // Get the ID
    await setLogged(req);
    var task = await dbHelper.getTask(id); // Load the task based on the ID
    winston.info('Access Task: ' + id)

    var completedLocations = [];
    for (var i = 0;i < task.locations.length;i++) { // Iterate over all locations
        var loc = task.locations[i];
        if (task.completedLocations.indexOf(loc.id) != -1) { // If the location has been completed (its ID is present in completedLocations), add it to array of completed locations
            completedLocations.push(loc);
        }
    }

    if (manager) {
        winston.info('View Task: Manager level access')
        res.render('viewTask', { title: "SuperCanvasser", subtitle: "Viewing Task " + id, completedLocations, logged: logValue, task, manager: manager, admin: admin, canvasser});
    } else {
        winston.info('View Task: Non-manager access, redirect to index')
        // for hw 7 ;)
        // res.render('viewTask', { title: "SuperCanvasser", subtitle: "Viewing Task " + id, logged: logValue, task, manager: manager, admin: admin, canvasser});
        res.render('index', { title: "SuperCanvasser", logged: logValue, admin: admin, canvasser});
    }   
})

module.exports = router;
