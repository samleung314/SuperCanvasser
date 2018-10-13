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

// Campaign main page
router.get('/campaign.hbs', async function(req, res, next) {
    await setLogged(req); // Wait for database
    if (manager) {
        res.render('campaign', {title: "SuperCanvasser", logged: logValue});
    } else {
        res.render('index', {title: "SuperCanvasser", logged: logValue});
    } 
})

router.get('/addCampaign.hbs', async function(req, res, next) {
    await setLogged(req); // Wait for database
    var managers = await dbHelper.getManagers(); // Load list of managers and canvassers
    var canvassers = await dbHelper.getCanvassers();
    if (manager) {
        res.render('addCampaign', {title: "SuperCanvasser", logged: logValue, managers, canvassers});
    } else {
        res.render('index', {title: "SuperCanvasser", logged: logValue});
    } 
})

module.exports = router;
