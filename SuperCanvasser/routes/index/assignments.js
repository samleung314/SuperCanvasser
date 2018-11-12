var router = require('express').Router();
var winston = require('../../winston');
var shared = require('./shared');
var dbHelper = require('../database/databaseHelper');

// View Upcoming Canvassing Assignments page for hw 7 ;)
router.get('/upcoming/:id', async function(req, res, next) {
    var id = req.params.id;
    tasks = await dbHelper.getTasks(id); // Load the tasks based on the canvassing id    console.log(id);
    winston.info('Viewing Upcoming Canvassing Assignment: ' + id)
    if (shared.manager) {
        winston.info('View Upcoming Canvassing Assignment: Manager level access')
        res.render('upcoming', { title: "SuperCanvasser", subtitle: "Viewing Upcoming Canvassing Assignments", tasks, logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser}); 
    } else {
        winston.info('View Upcoming Canvassing Assignment: Non-manager level access')
        res.render('upcoming', { title: "SuperCanvasser", subtitle: "Viewing Upcoming Canvassing Assignments", tasks, logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser}); 
    }
})

module.exports = router;
