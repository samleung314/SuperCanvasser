var router = require('express').Router();
var winston = require('../../winston');
var dbHelper = require('./databaseHelper');
var mongoose = require('mongoose');
var db = mongoose.connection;

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

module.exports = router;
