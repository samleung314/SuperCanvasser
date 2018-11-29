var express = require('express');
var url = require('url');
var router = express.Router();
var mongoose = require('mongoose');
var db = mongoose.connection;
var dbHelper = require('./databaseHelper');
var winston = require('../winston');
var crypto = require('crypto');
var bcrypt = require('bcryptjs');

router.get('/', function (req, res, next) {
});

var username = "";
// Get the user role data from the database
async function getUserData(req, res) {
    return new Promise(function(resolve, reject) { // Create promise for retrieving user data
        var session = req.cookies.session;
        if (session) { 
            db.collection('sessions').findOne({'session': session}, function (err, ret) {
                if (err) return handleError(err);
                if (ret) {
                    if (ret.expires < Date.now()) { // Session expired, remove from db
                        db.collection('sessions').remove({'session': session});
                        res.clearCookie('session');
                        resolve();
                    }

                    db.collection('users').findOne({ 'username': ret.username }, function (err, ret) {
                        if (ret) { // User found
                            username = ret.username;
                        }
                        resolve(); // Database contacted, resolve
                    });
                } else { // Session not found
                    resolve(); // Database contacted, resolve
                }
            })
        } else { // No session
            resolve(); // No session provided, resolve
        }
    });
}

/* User login*/
router.post('/login', function (req, res, next) {
    var v = req.body;
    winston.info('Query DB for user: ' + v.user)

    db.collection('users').findOne({ 'username': v.user}, function (err, ret) {
        if (err) return handleError(err);
        if (ret != null && bcrypt.compareSync(v.pass, ret.password)) { // Ensure that the given password matches the hashed password
            winston.info('User found in DB and log in')
            var hash = crypto.createHash('sha256'); // Create a randomly hashed session ID
            hash.update(Math.random().toString());
            var session = hash.digest('hex');
            db.collection('sessions').remove({username: v.user}, function() { // Remove all other existing sessions for this user
                db.collection('sessions').insertOne( // Insert the session ID into the sessions collection
                    {
                        username: v.user,
                        session: session,
                        expires: Date.now() + 15 * 60 * 1000 // with an expiration date of 15 minutes
                    }, function() {
                        res.cookie('session', session);
                        res.redirect('/');
                    }
                );
            });
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
                var salt = bcrypt.genSaltSync(10); // Hash and salt the given password, then store it in the database
                var hash = bcrypt.hashSync(v.pass, salt);

                var user = {
                    firstName: v.fname,
                    lastName: v.lname,
                    email: v.email,
                    username: v.user,
                    password: hash,
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
                var salt = bcrypt.genSaltSync(10); // Hash and salt the given password, then store it in the database
                var hash = bcrypt.hashSync(v.pass, salt);

                var user = {
                    firstName: v.fname,
                    lastName: v.lname,
                    email: v.email,
                    username: v.user,
                    password: hash,
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

    var locations = v.location.split('\n');
    var parsedLocations = [];
    var locid = 1;
    for (var i = 0;i < locations.length;i += 1) { // Iterate over all locations
        var location = locations[i].split(',');
        if (location.length == 6) { // Each valid location must have 6 parts separated by commas
            var parsedLocation = {};
            parsedLocation.number = location[0].trim();
            parsedLocation.street = location[1].trim();
            parsedLocation.unit = location[2].trim();
            parsedLocation.city = location[3].trim();
            parsedLocation.state = location[4].trim();
            parsedLocation.zip = location[5].trim();
            parsedLocation.id = locid;
            locid += 1;
            parsedLocations.push(parsedLocation);
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
        locations: parsedLocations, // Make an array of locations
        canvassers,
        flag: 1
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

    var locations = v.location.split('\n');
    var parsedLocations = [];
    var locid = 1;
    for (var i = 0;i < locations.length;i += 1) { // Iterate over all locations
        var location = locations[i].split(',');
        if (location.length == 6) { // Each valid location must have 6 parts separated by commas
            var parsedLocation = {};
            parsedLocation.number = location[0].trim();
            parsedLocation.street = location[1].trim();
            parsedLocation.unit = location[2].trim();
            parsedLocation.city = location[3].trim();
            parsedLocation.state = location[4].trim();
            parsedLocation.zip = location[5].trim();
            parsedLocation.id = locid;
            locid += 1;
            parsedLocations.push(parsedLocation);
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
            locations: parsedLocations, // Make an array of locations
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
                locations: parsedLocations, // Make an array of locations
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
    await getUserData(req, res);

    if (!start) { // If there is no starting location specified, prompt the user again
        res.redirect('/startCanvass');
    } else {
        var date = new Date();
        date = date.toLocaleString('en-US');
        date = date.split(',')[0]; // Get the date so we can update the task object

        winston.info('Start Canvass: User ' + username + ' sucessfully started canvassing with current location ' + start );
        db.collection('tasks').updateOne({'username': username, 'date': date}, { // Update the user in the database
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
    await getUserData(req, res);

    var date = new Date();
    date = date.toLocaleString('en-US');
    date = date.split(',')[0]; // Get the date
    var task = await dbHelper.findTask(username, date); // Use date and username to query database for task
    var completedLocations = task.completedLocations;
    completedLocations.push(parseInt(v.destinationid)); // Add current destination to completed locations list

    db.collection('tasks').updateOne({'username': username, 'date': date}, {
        $set: { // Update the task with new completed locations and set current location to the location we just completed
            currentLocation: v.destination,
            completedLocations
        }
    })
    
    var responses = [];
    for (var i = 0;i < Object.keys(v).length - 5;i += 1) { // We know there are 4 other keys besides the questions, so Object.keys(v).length - 4 is the number of questions there are
        responses.push(v['question' + i]); // Parse responses from all questions
    }
    var result = { // Construct a result object
        username: username,
        time: Date(),
        location: v.destination,
        spoke: v.spoke,
        rating: v.rating,
        responses,
        notes: v.notes,
        campaignID: task.campaignID
    };
    db.collection('results').insertOne(result); // Insert it into the database

    winston.info('Canvass: User ' + username + ' sucessfully canvassed at location ' + v.destination);
    res.redirect('/canvass'); // Allow the user to continue canvassing
});

/* Canvasser edit availability*/
router.post('/editAvailability', async function (req, res, next) {
    var v = req.body;
    var dates = v.dates.split(",");
    if (dates === undefined || dates.length == 0 || dates[0] == "") {
        db.collection('users').updateOne({ 'username': v.username }, { // Remove all available dates
            $set: {
                availability: null
            }
        });
        winston.info('All available dates cleared.');
    } else {
        db.collection('users').updateOne({ 'username': v.username }, { // Update the user in the database
            $set: {
                availability: dates
            }
        });
        winston.info('Canvasser availability updated.');
    }
    res.redirect('back');
});

function findMinAssignmentCanvasser(assignmentMap, canvassers) {
    var min = assignmentMap[canvassers[0]].length;
    var canvasser = canvassers[0];
    for (var i = 0;i < canvassers.length;i += 1) {
        if (assignmentMap[canvassers[i]].length < min) {
            min = assignmentMap[canvassers[i]].length;
            canvasser = canvassers[i];
        }
    }
    return canvasser;
}

router.post('/generateAssignments', async function (req, res, next) {
    var v = req.body;
    var locations = [];
    var locmap = JSON.parse(v.locmap);
    var nlocations = parseInt(v.locationn);
    var distanceMat = JSON.parse(v.distancemat);
    for (var i = 0;i < nlocations;i += 1) {
        var location = JSON.parse(v['location' + i]);
        locations.push(location);
    }
    var campaignID = parseInt(v.campaignID);

    var globals = await dbHelper.getGlobals();
    var workDayDuration = parseFloat(globals.workDayDuration);
    var avgSpeed = parseFloat(globals.avgTravelTime);

    var campaign = await dbHelper.getCampaign(campaignID);
    var campaignLocations = campaign.locations;
    var dates = (Date.parse(campaign.endDate) - Date.parse(campaign.startDate)) / (24 * 60 * 60 * 1000) + 1;
    var canvassers = campaign.canvassers;
    var duration = parseFloat(campaign.duration);

    if (campaign.flag == 0) {
        res.redirect('/campaign/' + campaignID);
        return;
    }

    db.collection('campaigns').updateOne({'id': campaignID}, { // Update the campaign in the database
        $set: {
            flag: 0
        }
    });

    var avgDist = 0;
    var distancesAdded = 0;
    for (var i = 0;i < distanceMat.length;i += 1) {
        for (var j = 0;j < distanceMat[i].length;j += 1) {
            if (distanceMat[i][j] != 0) {
                avgDist += distanceMat[i][j];
                distancesAdded += 1;
            }
        }
    }
    avgDist = avgDist / distancesAdded;
    var avgTime = avgDist / avgSpeed * 60; // time in minutes
    
    var nassignments = parseInt(Math.ceil(nlocations * (avgTime + duration) / (workDayDuration * 60 * 0.9)));

    console.log(locations);

    var spawn = require("child_process").spawn;
    var VRP = spawn('python', ['algorithm.py', nassignments, JSON.stringify(locations), avgSpeed, duration, workDayDuration]);
    VRP.stderr.on('data', (data) => {
        console.log(data.toString());
    })
    VRP.stdout.on('data', async (data) => {
        console.log(data.toString());

        var VRPlocations = JSON.parse(data.toString());
        for (var i = 0;i < VRPlocations.length;i++) {
            for (var j = 0;j < VRPlocations[i].length;j++) {
                VRPlocations[i][j] = parseInt(VRPlocations[i][j]) - 1;
            }
        }
        console.log(VRPlocations);
    
        var assignmentMap = {};
        var availabilityMap = {};
        for (var i = 0;i < canvassers.length;i += 1) {
            assignmentMap[canvassers[i]] = [];
            availabilityMap[canvassers[i]] = [];
            var user = await dbHelper.getUser(canvassers[i]);
            if (user.availability) {
                user.availability.forEach((availability) => {
                    var d = new Date();
                    d.setTime(Date.parse(availability));
                    availabilityMap[canvassers[i]].push(d.toLocaleString('en-US').split(',')[0]);
                });
            }
        }
    
        var campaignDates = [];
        for (var i = 1;i < dates + 1;i += 1) {
            var d = new Date();
            d.setTime(Date.parse(campaign.startDate) + i * 24 * 60 * 60 * 1000);
            campaignDates.push(d.toLocaleString('en-US').split(',')[0]);
        }
    
        var failed = false;
        for (var i = 0;i < nassignments;i += 1) {
            var done = false;
            while (!done && !failed) {
                var minCanvasser = findMinAssignmentCanvasser(assignmentMap, canvassers);
                console.log(minCanvasser);
                var done2 = false;
                var j = 0;
                while (!done2) {
                    var date = campaignDates[j];
                    var ind = availabilityMap[minCanvasser].indexOf(date);
                    if (ind != -1) {
                        var assignment = {
                            date: date,
                            n: i
                        }
                        assignmentMap[minCanvasser].push(assignment);
                        availabilityMap[minCanvasser].splice(ind, 1);
                        done = true;
                        done2 = true;
                    }
                    j++;
                    if (j >= campaignDates.length) {
                        done2 = true;
                        canvassers.splice(canvassers.indexOf(minCanvasser), 1);
                    }
                }
                if (canvassers.length == 0) {
                    done = true;
                    failed = true;
                }
            }
        }
        console.log(availabilityMap);
        for (var canv in availabilityMap) {
            db.collection('users').updateOne({ 'username': canv }, { // Push updated availabilities
                $set: {
                    availability: availabilityMap[canv]
                }
            });
        }
        console.log(assignmentMap);
        console.log(failed);
    
        if (failed) {
            db.collection('campaigns').updateOne({'id': campaignID}, { // Update the campaign in the database
                $set: {
                    flag: 1
                }
            });
        } else {
            var taskID = 0;
            for (var i = 0;i < canvassers.length;i += 1) {
                var canvasser = canvassers[i];
                for (var j = 0;j < assignmentMap[canvasser].length;j += 1) {
                    var assignment = assignmentMap[canvasser][j];
                    var locations = [];
                    for (var k = 0;k < VRPlocations[assignment.n].length;k += 1) {
                        locations.push(campaignLocations[locmap[VRPlocations[assignment.n][k]]]);
                    }
                    var task = {
                        username: canvasser,
                        date: assignment.date,
                        campaignID: campaignID,
                        locations: locations,
                        completedLocations: [],
                        taskID: taskID
                    }
                    db.collection('tasks').insertOne(task);
                    taskID += 1;
                }
            }
            db.collection('campaigns').updateOne({ 'id': campaignID }, { // Update the campaign in the database
                $set: {
                    flag: 1
                }
            });
        }
        res.redirect('/campaign/' + campaignID);
    });
});

module.exports = router;
