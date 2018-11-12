var express = require('express');
var router = express.Router();
var winston = require('../../winston');
var shared = require('./shared');

/* GET home page. */
router.get('/', async function(req, res, next) {
    winston.info('Index page access')
    await shared.setLogged(req); // Wait for database
    if (!shared.loggedIn) { //if you are logged out
        res.render('login', { title: "SuperCanvasser", logged: logValue, message: "Welcome. Please login.",  admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser})
        winston.info('Prompt for login')
    } else {
        res.render('index', { title: "SuperCanvasser", logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser})
        winston.info('User already logged in')
    }
});

// Import all other routers
router.use(require('./assignments'));
router.use(require('./availability'));
router.use(require('./campaigns'));
router.use(require('./canvass'));
router.use(require('./globals'));
router.use(require('./login'));
router.use(require('./tasks'));
router.use(require('./users'));

module.exports = router;
