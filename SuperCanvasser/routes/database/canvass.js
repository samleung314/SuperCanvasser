var router = require('express').Router();
var winston = require('../../winston');
var dbHelper = require('./databaseHelper');
var mongoose = require('mongoose');
var db = mongoose.connection;

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
    var task = await dbHelper.findTask(req.cookies.name, date); // Use date and username to query database for task
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
