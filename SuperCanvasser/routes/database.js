var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var db = mongoose.connection;
var dbHelper = require('./databaseHelper');

router.get('/', function (req, res, next) {
});

/* User login*/
router.post('/login', function (req, res, next) {
    var v = req.body;
    db.collection('users').findOne({ 'username': v.user, 'password': v.pass }, function (err, ret) {
        if (err) return handleError(err);
        if (ret != null) {
            res.cookie('name', ret.username)
            console.log("Logged In: " + v.user);
            res.redirect('/')
        } else {
            res.render('login', { title: 'SuperCanvasser', logged: "Login", message: 'Invalid Credentials' });
        }
    })
});


/* When adding a user into the database*/
router.post('/addUser', function (req, res, next) {
    var v = req.body;
    if (v.fname == '' || v.lname == '' || v.email == '' || v.user == '' || v.pass == '') {
        res.render('addUser', { title: 'SuperCanvasser', message: 'All fields are required; please enter all information.' });
    } else {
        db.collection('users').findOne({ 'username': v.user }, function (err, ret) {
            if (err) return handleError(err);
            if (ret != null) {
                res.render('addUser', { title: 'SuperCanvasser', message: 'Username already taken. Please enter another.' });
            } else if (v.canvasser || v.campaignManager || v.sysAdmin) {
                var user = {
                    firstName: v.fname,
                    lastName: v.lname,
                    email: v.email,
                    username: v.user,
                    password: v.pass,
                    canvasser: Boolean(v.canvasser),
                    campaignManager: Boolean(v.campaignManager),
                    sysAdmin: Boolean(v.sysAdmin)
                };
                db.collection('users').insertOne(user);
                res.render('addUser', { title: 'SuperCanvasser', message: 'User successfully added.' });
            } else {
                res.render('addUser', { title: 'SuperCanvasser', message: 'Please select at least one account role.' });
            }
        })
    }
});

/* Person registering as a canvasser*/
router.post('/register', function (req, res, next) {
    var v = req.body;
    if (v.fname == '' || v.lname == '' || v.email == '' || v.user == '' || v.pass == '') {
        res.render('register', { title: 'SuperCanvasser', message: 'All fields are required; please enter all information.' });
    } else {
        db.collection('users').findOne({ 'username': v.user }, function (err, ret) {
            if (err) return handleError(err);
            if (ret != null) {
                res.render('register', { title: 'SuperCanvasser', message: 'Username already taken. Please enter another.' });
            } else {
                var user = {
                    firstName: v.fname,
                    lastName: v.lname,
                    email: v.email,
                    username: v.user,
                    password: v.pass,
                    canvasser: true,
                    campaignManager: false,
                    sysAdmin: false
                };
                db.collection('users').insertOne(user);
                res.render('login', { title: 'SuperCanvasser', message: 'Welcome! Please login' });
            }
        })
    }
});

// Add a campaign
router.post('/addCampaign', async function(req, res, next) {
    var v = req.body;
    var allManagers = await dbHelper.getManagers(); // Load the list of managers and canvassers
    var allCanvassers = await dbHelper.getCanvassers();
    var logValue = 'Logout';
    // Prepare the data that will have to be sent if we have to reload the form
    var addCampaign = {title: "SuperCanvasser", logged: logValue, managers: allManagers, canvassers: allCanvassers, message: ''};
    
    // Error checking, add to error message if something is missing
    if (!v['start-date'] || !v['end-date']) {
        addCampaign.message += '<p>Please enter both a start date and an end date</p>';
    }
    if (!v.talk) {
        addCampaign.message += '<p>Please enter some talking points</p>';
    }
    if (!v.question1) {
        addCampaign.message += '<p>Please enter at least one question</p>';
    }
    if (!v.duration) {
        addCampaign.message += '<p>Please enter an average visiting duration</p>';
    }
    if (!v.location) {
        addCampaign.message += '<p>Please enter at least one location</p>';
    }

    // Populate the managers, canvassers, and questions array
    var keys = Object.keys(v); // Load the keys from the object
    var managers = [];
    var canvassers = [];
    var questions = [];
    for (var i = 0;i < keys.length;i += 1) { // Iterate over all keys
        var key = keys[i];
        if (key.indexOf('manager') == 0) { // Find any managers, canvassers, or questions
            managers.push(v[key]);
        } else if (key.indexOf('canvasser') == 0) {
            canvassers.push(v[key]);
        } else if (key.indexOf('question') == 0) {
            questions.push(v[key]);
        }
    }

    // Error checking for missing managers and canvassers
    if (managers.length == 0) {
        addCampaign.message += '<p>Please select at least one manager</p>';
    }
    if (canvassers.length == 0) {
        addCampaign.message += '<p>Please select at least one canvasser</p>';
    }

    if (addCampaign.message) { // If there was an error, reload the form
        res.render('addCampaign', addCampaign);
    } else { // Otherwise add the campaign to the database
        var campaign = {
            managers,
            startDate: v['start-date'],
            endDate: v['end-date'],
            talk: v.talk,
            questions,
            duration: v.duration,
            locations: v.location.split('\n'), // Make an array of locations
            canvassers
        };
        db.collection('campaigns').insertOne(campaign);
        res.render('campaign', {title: "SuperCanvasser", logged: logValue}); // Go back to campaigns page
    }
})

module.exports = router;
