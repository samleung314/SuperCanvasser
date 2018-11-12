var router = require('express').Router();
var winston = require('../../winston');
var shared = require('./shared');
var dbHelper = require('../database/databaseHelper');

// View Tasks page
router.get('/viewTasks/:id', async function(req, res, next) {
    var id = req.params.id;
    tasks = await dbHelper.getTasks(id); // Load the tasks based on the canvassing id    console.log(id);
    winston.info('Viewing Tasks for Canvassing Assignment: ' + id)
    if (shared.manager) {
        winston.info('View Tasks: Manager level access')
        res.render('viewTasks', { title: "SuperCanvasser", subtitle: "View Tasks", tasks, logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser}); 
    } else {
        winston.info('View Tasks: Non-manager level access')
        res.render('index', {title: "SuperCanvasser", logged: logValue});
    }
})

// View Task page
router.get('/viewTask/:id', async function(req, res, next) {
    var id = parseInt(req.params.id); // Get the ID
    await shared.setLogged(req);
    var task = await dbHelper.getTask(id); // Load the task based on the ID
    winston.info('Access Task: ' + id)
    if (shared.manager) {
        winston.info('View Task: Manager level access')
        res.render('viewTask', { title: "SuperCanvasser", subtitle: "Viewing Task " + id, logged: logValue, task, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser});
    } else {
        winston.info('View Task: Non-manager access, redirect to index')
        // for hw 7 ;)
        res.render('viewTask', { title: "SuperCanvasser", subtitle: "Viewing Task " + id, logged: logValue, task, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser});
        //res.render('index', { title: "SuperCanvasser", logged: logValue, admin: admin, canvasser});
    }   
})

module.exports = router;
