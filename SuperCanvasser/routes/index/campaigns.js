var router = require('express').Router();
var winston = require('../../winston');
var shared = require('./shared');
var dbHelper = require('../database/databaseHelper');

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
    await shared.setLogged(req); // Wait for database
    var campaigns = await dbHelper.getCampaigns();
    campaigns.sort(campaignCompare);
    if (shared.manager) {
        winston.info('Manager access, manage campaigns')
        res.render('campaigns', {title: "SuperCanvasser", logged: logValue, campaigns, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser});
    } else {
        winston.info('Non-manager access, redirect to index page')
        res.render('index', {title: "SuperCanvasser", logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser});
    } 
})

// Add Campaign page
router.get('/addCampaign', async function(req, res, next) {
    winston.info('Access add campaign page')
    var message = req.query.message; // Load message and campaign (if failed to add)
    var campaign = req.query.campaign;
    await shared.setLogged(req); // Wait for database
    var managers = await dbHelper.getManagers(); // Load list of managers and canvassers
    var canvassers = await dbHelper.getCanvassers();
    if (shared.manager) {
        if (campaign) { // If we have the campaign, reload the addCampaign view with the old campaign information
            res.render('addCampaign', {title: "SuperCanvasser", subtitle: "Add Campaign", logged: logValue, managers, canvassers, action: '/database/addCampaign', message, campaign, editCampaign: true, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser});
        } else {
            res.render('addCampaign', {title: "SuperCanvasser", subtitle: "Add Campaign", logged: logValue, managers, canvassers, action: '/database/addCampaign', message, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser});
        }
    } else {
        res.render('index', {title: "SuperCanvasser", logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser});
    } 
})

// View Campaign page
router.get('/campaign/:id', async function(req, res, next) {
    var id = parseInt(req.params.id); // Get the ID
    await shared.setLogged(req);
    var campaign = await dbHelper.getCampaign(id); // Load the campaign based on the ID
    campaign.talk = campaign.talk.split('\n');
    var edit = true;
    winston.info('Access campaign: ' + id)
    if (Date.now() > Date.parse(campaign.startDate)) { // Only allow editting if the campaign has not started
        winston.info('Campaign edit allowed, has not started')
        edit = false;
    }
    if (shared.manager) {
        winston.info('View Campaign: Manager level access')
        res.render('campaign', {title: "SuperCanvasser", logged: logValue, campaign, edit, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser});
    } else {
        winston.info('View Campaign: Non-manager access, redirect to index')
        res.render('index', {title: "SuperCanvasser", logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser});
    }   
})

// Edit Campaign page
router.get('/editCampaign/:id', async function(req, res, next) {
    var message = req.query.message; // Load message and campaign (if failed to edit)
    var campaign = req.query.campaign;
    var id = parseInt(req.params.id);
    await shared.setLogged(req);
    var managers = await dbHelper.getManagers(); // Load list of managers and canvassers
    var canvassers = await dbHelper.getCanvassers();
    winston.info('Access Edit Campaign ID: ' + id)
    if (!campaign) { // If there is no previous campaign edit attempt
        campaign = await dbHelper.getCampaign(id); // Load the campaign based on the ID
        campaign = JSON.stringify(campaign);
    }
    if (shared.manager) {
        winston.info('Edit Campaign: Manager level access')
        res.render('addCampaign', {title: "SuperCanvasser", subtitle: "Edit Campaign " + id, logged: logValue, campaign, managers, canvassers, action: '/database/editCampaign', editCampaign: true, message, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser});
    } else {
        winston.info('Edit Campaign: Non-manager level access, redirect to index')
        res.render('index', {title: "SuperCanvasser", logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser});
    }       
})

module.exports = router;
