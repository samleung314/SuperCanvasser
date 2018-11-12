var router = require('express').Router();
var winston = require('../../winston');
var shared = require('./shared');
var dbHelper = require('../database/databaseHelper');

// Edit global variables page
router.get('/editGlobals', async function(req, res, next) {
    await shared.setLogged(req); // Wait for database
    var globals = await dbHelper.getGlobals();
    globals = JSON.stringify(globals);
    if (shared.admin) {
        winston.info('Edit Globals: Admin level access')
        res.render('editGlobals', {title: "SuperCanvasser", subtitle: "Edit Globals", logged: logValue, globals, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser, editGlobals:true, action: '/database/editGlobals'});
    } else {
        winston.info('Edit Globals: Non-admin access, redirect to index')
        res.render('index', {title: "SuperCanvasser", logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser});
    } 
})

module.exports = router;
