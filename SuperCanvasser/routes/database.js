var express = require('express');
var url = require('url');
var router = express.Router();
var mongoose = require('mongoose');
var db = mongoose.connection;
var dbHelper = require('./databaseHelper');
var winston = require('../winston');

router.get('/', function (req, res, next) {
});

/* User login*/
router.post('/login', function (req, res, next) {
    var v = req.body;
    winston.info('Query DB for user: ' + v.user)
    db.collection('users').findOne({ 'username': v.user, 'password': v.pass }, function (err, ret) {
        if (err) return handleError(err);
        if (ret != null) {
            winston.info('User found in DB and log in')
            res.cookie('name', ret.username)
            console.log("Logged In: " + v.user);
            res.redirect('/')
        } else {
            winston.info('User not found in DB')
            res.render('login', { title: 'SuperCanvasser', logged: "Login", message: 'Invalid Credentials' });
        }
    })
});

/* When adding a user into the database*/
router.post('/addUser', function (req, res, next) {
    var v = req.body;
    if (v.fname == '' || v.lname == '' || v.email == '' || v.user == '' || v.pass == '') {
        winston.info('Add User: User fields not complete')
        res.render('addUser', { title: 'SuperCanvasser', message: 'All fields are required; please enter all information.' });
    } else {
        db.collection('users').findOne({ 'username': v.user }, function (err, ret) {
            if (err) return handleError(err);
            if (ret != null) {
                winston.info('Add User: Username already taken')
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
                winston.info('Add User: Sucessfully added')
                res.redirect('/addUser.hbs');
            } else {
                winston.info('Add User: Account role not selected')
                res.render('addUser', { title: 'SuperCanvasser', message: 'Please select at least one account role.' });
            }
        })
    }
});

/* Person registering as a canvasser*/
router.post('/register', function (req, res, next) {
    var v = req.body;
    if (v.fname == '' || v.lname == '' || v.email == '' || v.user == '' || v.pass == '') {
        winston.info('Canvasser Registration: Fields missing')
        res.render('register', { title: 'SuperCanvasser', message: 'All fields are required; please enter all information.' });
    } else {
        db.collection('users').findOne({ 'username': v.user }, function (err, ret) {
            if (err) return handleError(err);
            if (ret != null) {
                winston.info('Canvasser Registration: Username already taken')
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
                winston.info('Canvasser Registration: User registered, redirect to index for login')
                res.render('login', { title: 'SuperCanvasser', message: 'Welcome! Please login' });
            }
        })
    }
});

// Function for detecting errors in adding or editting a campaign
function campaignError(v, managers, canvassers) {
    var message = ''; // Compliation of error messages

    // Error checking, add to error message if something is missing
    if (!v['start-date'] || !v['end-date']) {
        message += '<p>Please enter both a start date and an end date</p>';
    }
    if (v['start-date'] && v['end-date']) {
        var startDate = v['start-date'];
        var endDate = v['end-date'];
        if (Date.parse(startDate) > Date.parse(endDate)) {
            message += '<p>Please make sure that the end date is after the start date</p>';
        }
    }
    if (!v.talk) {
        message += '<p>Please enter some talking points</p>';
    }
    if (!v.question1) {
        message += '<p>Please enter at least one question</p>';
    }
    if (!v.duration) {
        message += '<p>Please enter an average visiting duration</p>';
    }
    if (!v.location) {
        message += '<p>Please enter at least one location</p>';
    }

    // Error checking for missing managers and canvassers
    if (managers.length == 0) {
        message += '<p>Please select at least one manager</p>';
    }
    if (canvassers.length == 0) {
        message += '<p>Please select at least one canvasser</p>';
    }
    winston.info('Adding/Editing Campaign errors: ' + message)
    return message;
}

// Add a campaign
router.post('/addCampaign', async function(req, res, next) {
    var v = req.body;

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

    // Construct the campaign object from the gathered data
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

    var message = campaignError(v, managers, canvassers); // Check for errors
    if (message) { // If there was an error, reload the form
        res.redirect(url.format({
            pathname: '/addCampaign',
            query: { // Pass the message on, as well as what the user originally entered so it can be reloaded
                message,
                campaign: JSON.stringify(campaign),
            }
        }));
    } else { // Otherwise add the campaign to the database
        winston.info('Add Campaign: Campaign added succesfully to DB')
        var id = await dbHelper.getCampaignID();
        campaign.id = id;
        db.collection('campaigns').insertOne(campaign);
        res.redirect('/campaigns.hbs'); // Go back to campaigns page
    }
})

// Edit a campaign
router.post('/editCampaign', async function(req, res, next) {
    var v = req.body;
    var id = JSON.parse(v['original-campaign']).id;

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

    var message = campaignError(v, managers, canvassers); // Check for errors
    if (message) { // If there was an error, reload the form
        var campaign = { // Construct the campaign object from the gathered data
            id,
            managers,
            startDate: v['start-date'],
            endDate: v['end-date'],
            talk: v.talk,
            questions,
            duration: v.duration,
            locations: v.location.split('\n'), // Make an array of locations
            canvassers  
        };
        res.redirect(url.format({
            pathname: '/editCampaign/' + id,
            query: { // Pass the message on, as well as what the user editted so it can be reloaded
                message,
                campaign: JSON.stringify(campaign)
            }
        }));
    } else { // Otherwise add the campaign to the database
        db.collection('campaigns').updateOne({'id': id}, { // Update the campaign in the database
            $set: {
                managers,
                startDate: v['start-date'],
                endDate: v['end-date'],
                talk: v.talk,
                questions,
                duration: v.duration,
                locations: v.location.split('\n'), // Make an array of locations
                canvassers              
            }
        });
        winston.info('Add Campaign: Campaign ' + id + ' edited succesfully and saved into DB')
        res.redirect('/campaigns.hbs'); // Go back to campaigns page
    }
})

// Edit a user
router.post('/editUser', async function(req, res, next) {
    var v = req.body;
    var username = JSON.parse(v['original-user']).username;

    winston.info('Edit User: User ' + username + ' sucessfully edited and saved in DB' )
    db.collection('users').updateOne({'username': username}, { // Update the user in the database
        $set: {
            username: v.username,
            password: v.password,
            email: v.email,
            firstName: v['first-name'],
            lastName: v['last-name'],
            canvasser: Boolean(v.userType.includes('canvasser')),
            campaignManager: Boolean(v.userType.includes('campaign-manager')),
            sysAdmin: Boolean(v.userType.includes('system-admin'))           
        }
    });
    var campaign = { // Construct the campaign object from the gathered data
        username: v.username,
        password: v.password,
        email: v.email,
        firstName: v['first-name'],
        lastName: v['last-name'],
        canvasser: Boolean(v.userType.includes('canvasser')),
        campaignManager: Boolean(v.userType.includes('campaign-manager')),
        sysAdmin: Boolean(v.userType.includes('system-admin'))
    };
    res.redirect('/users'); // Go back to users page
})

// Edit globals
router.post('/editGlobals', async function(req, res, next) {
    var v = req.body;
    var id = JSON.parse(v['original-globals'])._id;

    winston.info('Edit Globals: Globals changed successfully and saved in DB')
    db.collection('globals').updateOne({'_id': id}, {
        $set: {
            workDayDuration: v['work-day-duration'],
            avgTravelTime: v['average-travel-time'],         
        }
    });
    res.redirect('/editGlobals');
})

// Start canvass
router.post('/startCanvass', async function(req, res, next) {
    var v = req.body;
    var start = v.start; // Get the starting location

    if (!start) { // If there is no starting location specified, prompt the user again
        res.redirect('/startCanvass');
    } else {
        var date = new Date();
        date = date.toLocaleString('en-US');
        date = date.split(',')[0]; // Get the date so we can update the task object

        winston.info('Start Canvass: User ' + req.cookies.name + ' sucessfully started canvassing with current location ' + start );
        db.collection('tasks').updateOne({'username': req.cookies.name, 'date': date}, { // Update the user in the database
            $set: { // Update task object in database with new starting location (so there is now a current location)
                currentLocation: start,       
            }
        });

        res.redirect('/canvass'); // Redirect the user to start canvassing
    }
});

// Canvass
router.post('/canvass', async function(req, res, next) {
    var v = req.body;
    
    var date = new Date();
    date = date.toLocaleString('en-US');
    date = date.split(',')[0]; // Get the date
    var task = await dbHelper.getTask(req.cookies.name, date); // Use date and username to query database for task
    var completedLocations = task.completedLocations;
    completedLocations.push(v.destination); // Add current destination to completed locations list

    db.collection('tasks').updateOne({'username': req.cookies.name, 'date': date}, {
        $set: { // Update the task with new completed locations and set current location to the location we just completed
            currentLocation: v.destination,
            completedLocations
        }
    })
    
    var responses = [];
    for (var i = 0;i < Object.keys(v).length - 4;i += 1) { // We know there are 4 other keys besides the questions, so Object.keys(v).length - 4 is the number of questions there are
        responses.push(v['question' + i]); // Parse responses from all questions
    }
    var result = { // Construct a result object
        username: req.cookies.name,
        time: Date(),
        location: v.destination,
        spoke: v.spoke,
        rating: v.rating,
        responses,
        notes: v.notes,
        campaignID: task.campaignID
    };
    db.collection('results').insertOne(result); // Insert it into the database

    winston.info('Canvass: User ' + req.cookies.name + ' sucessfully canvassed at location ' + v.destination );
    res.redirect('/canvass'); // Allow the user to continue canvassing
});

module.exports = router;
