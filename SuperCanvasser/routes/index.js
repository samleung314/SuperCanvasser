var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var db = mongoose.connection;
var dbHelper = require('./databaseHelper');

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
    await setLogged(req); // Wait for database
    if (!loggedIn) { //if you are logged out
        res.render('login', { title: "SuperCanvasser", logged: logValue, message: "Welcome. Please login."})
    } else {
        res.render('index', { title: "SuperCanvasser", logged: logValue, manager})
    }
});

router.get('/login.hbs', function (req, res, next) {
    if (!loggedIn) {
        //if you are logged out
        //login
        res.render('login', { title: 'SuperCanvasser', logged: logValue });
    } else {
        //if you are logged in
        //logout
        res.clearCookie('name');
        res.render('login', { title: "SuperCanvasser", logged: "Login"});
    }
});

router.get('/addUser.hbs', function (req, res, next) {
    res.render('addUser', { title: 'SuperCanvasser', logged: logValue });
});

router.get('/register.hbs', function (req, res, next) {
    res.render('register', { title: 'SuperCanvasser', logged: logValue, message: "This page is for canvasser registration. To become a manager please contact an administrator." });
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
    await setLogged(req); // Wait for database
    var campaigns = await dbHelper.getCampaigns();
    campaigns.sort(campaignCompare);
    if (manager) {
        res.render('campaigns', {title: "SuperCanvasser", logged: logValue, campaigns});
    } else {
        res.render('index', {title: "SuperCanvasser", logged: logValue});
    } 
})

// Add Campaign page
router.get('/addCampaign', async function(req, res, next) {
    var message = req.query.message; // Load message and campaign (if failed to add)
    var campaign = req.query.campaign;
    await setLogged(req); // Wait for database
    var managers = await dbHelper.getManagers(); // Load list of managers and canvassers
    var canvassers = await dbHelper.getCanvassers();
    if (manager) {
        if (campaign) { // If we have the campaign, reload the addCampaign view with the old campaign information
            res.render('addCampaign', {title: "SuperCanvasser", subtitle: "Add Campaign", logged: logValue, managers, canvassers, action: '/database/addCampaign', message, campaign, editCampaign: true});
        } else {
            res.render('addCampaign', {title: "SuperCanvasser", subtitle: "Add Campaign", logged: logValue, managers, canvassers, action: '/database/addCampaign', message});
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
    if (Date.now() > Date.parse(campaign.startDate)) { // Only allow editting if the campaign has not started
        edit = false;
    }
    if (manager) {
        res.render('campaign', {title: "SuperCanvasser", logged: logValue, campaign, edit});
    } else {
        res.render('index', {title: "SuperCanvasser", logged: logValue});
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
    if (!campaign) { // If there is no previous campaign edit attempt
        campaign = await dbHelper.getCampaign(id); // Load the campaign based on the ID
        campaign = JSON.stringify(campaign);
    }
    if (manager) {
        res.render('addCampaign', {title: "SuperCanvasser", subtitle: "Edit Campaign " + id, logged: logValue, campaign, managers, canvassers, action: '/database/editCampaign', editCampaign: true, message});
    } else {
        res.render('index', {title: "SuperCanvasser", logged: logValue});
    }       
})

module.exports = router;
