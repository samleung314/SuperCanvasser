var router = require('express').Router();
var winston = require('../../winston');
var shared = require('./shared');

router.get('/login.hbs', function (req, res, next) {
    winston.info('Login page access')
    if (!loggedIn) {
        //if you are logged out
        //login
        winston.info('Prompt for login')
        res.render('login', { title: 'SuperCanvasser', logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser });
    } else {
        //if you are logged in
        //logout
        winston.info('User logged out')
        res.clearCookie('name');
        res.render('login', { title: "SuperCanvasser", logged: "Login", admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser});
    }
});

// SysAdmin add new user
router.get('/addUser.hbs', async function (req, res, next) {
    await shared.setLogged(req); // Wait for database
    if (shared.admin) {
        winston.info('Admin level page, access add user')
        res.render('addUser', { title: 'SuperCanvasser', logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser });
    } else {
        winston.info('User is not admin, non-admin page access')
        res.render('index', { title: "SuperCanvasser", logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser });
    }
});

// New user register as shared.canvasser
router.get('/register.hbs', async function (req, res, next) {
    await shared.setLogged(req); // Wait for database
    if (!shared.admin && !shared.manager && !shared.canvasser) {
        winston.info('User is not admin, manager, or canvasser, prompt to register')
        res.render('register', { title: 'SuperCanvasser', logged: logValue, message: "This page is for shared.canvasser registration. To become a manager please contact an administrator." });
    } else {
        winston.info('User is already logged in, direct to index page')
        res.render('index', { title: "SuperCanvasser", logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser });
    }
});

module.exports = router;
