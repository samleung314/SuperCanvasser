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
        var username = req.cookies.name;
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
        res.render('login', { title: "SuperCanvasser", logged: logValue, message: "Welcome. Please login.", admin: admin, manager: manager, canvasser})
        winston.info('Prompt for login')
    } else {
        res.render('index', { title: "SuperCanvasser", logged: logValue, manager, admin: admin, canvasser})
        winston.info('User already logged in')
    }
});

router.get('/login.hbs', function (req, res, next) {
    winston.info('Login page access')
    if (!loggedIn) {
        //if you are logged out
        //login
        winston.info('Prompt for login')
        res.render('login', { title: 'SuperCanvasser', logged: logValue });
    } else {
        //if you are logged in
        //logout
        winston.info('User logged out')
        res.clearCookie('name');
        res.render('login', { title: "SuperCanvasser", logged: "Login"});
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
        res.render('campaigns', { title: "SuperCanvasser", logged: logValue, campaigns, manager: manager, admin: admin, canvasser});
    } else {
        winston.info('Non-manager access, redirect to index page')
        res.render('index', {title: "SuperCanvasser", logged: logValue});
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
            res.render('addCampaign', { title: "SuperCanvasser", subtitle: "Add Campaign", logged: logValue, managers, canvassers, action: '/database/addCampaign', message, campaign, editCampaign: true, manager: manager, admin: admin, canvasser});
        } else {
            res.render('addCampaign', { title: "SuperCanvasser", subtitle: "Add Campaign", logged: logValue, managers, canvassers, action: '/database/addCampaign', message, admin: admin, manager: manager, canvasser});
        }
    } else {
        res.render('index', {title: "SuperCanvasser", logged: logValue});
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
        res.render('campaign', { title: "SuperCanvasser", logged: logValue, campaign, edit, manager: manager, admin: admin, canvasser});
    } else {
        winston.info('View Campaign: Non-manager access, redirect to index')
        res.render('index', { title: "SuperCanvasser", logged: logValue, admin: admin, canvasser});
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
        res.render('addCampaign', { title: "SuperCanvasser", subtitle: "Edit Campaign " + id, logged: logValue, campaign, managers, canvassers, action: '/database/editCampaign', editCampaign: true, message, manager: manager, admin: admin, canvasser});
    } else {
        winston.info('Edit Campaign: Non-manager level access, redirect to index')
        res.render('index', {title: "SuperCanvasser", logged: logValue});
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
        res.render('users', { title: "SuperCanvasser", logged: logValue, users, admin: admin, manager: manager, canvasser});
    } else {
        res.render('index', {title: "SuperCanvasser", logged: logValue});
    } 
})

// Edit User page
router.get('/editUser/:id', async function(req, res, next) {
    var id = req.params.id;
    console.log(id);
    user = await dbHelper.getUser(id); // Load the user based on the username
    user = JSON.stringify(user);
    winston.info('Edit User: ' + id)
    if (admin) {
        winston.info('Edit User: Admin level access')
        res.render('editUser', { title: "SuperCanvasser", subtitle: "Edit User", logged: logValue, user, admin: admin, editUser: true, action: '/database/editUser', manager: manager, canvasser}); 
    } else {
        winston.info('Edit User: Non-admin level access')
        res.render('index', {title: "SuperCanvasser", logged: logValue});
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
        res.render('editGlobals', { title: "SuperCanvasser", subtitle: "Edit Globals", logged: logValue, globals, admin: admin, editGlobals: true, action: '/database/editGlobals', manager: manager, canvasser});
    } else {
        winston.info('Edit Globals: Non-admin access, redirect to index')
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
    if (admin) {
        winston.info('View Tasks: Manager level access')
        res.render('viewTasks', { title: "SuperCanvasser", subtitle: "View Tasks", tasks, logged: logValue, user, admin: admin, manager: manager, canvasser}); 
    } else {
        winston.info('View Tasks: Non-manager level access')
        res.render('index', {title: "SuperCanvasser", logged: logValue});
    }
})

module.exports = router;
