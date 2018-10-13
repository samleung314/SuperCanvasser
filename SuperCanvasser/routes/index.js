var express = require('express');
var router = express.Router();

logValue = "Login";
loggedIn = false;
function setLogged(req) {
    //Keeps track of whether user is logged in or out
    if (req.cookies.name == "" || req.cookies.name == null) {
        logValue = "Login"
        loggedIn = false;
    } else {
        logValue = "Logout"
        loggedIn = true;
    }
}

/* GET home page. */
router.get('/', function(req, res, next) {
    setLogged(req);
    if (!loggedIn) { //if you are logged out
        res.render('login', { title: "SuperCanvasser", logged: logValue, message: "Welcome. Please login."})
    } else {
        res.render('index', { title: "SuperCanvasser", logged: logValue})
    }
});

router.get('/login.hbs', function (req, res, next) {
    if (!loggedIn) {
        //if you are logged out
        //login
        res.render('login', { title: 'SuperCanvasser', logged: logValue });
    } else {
        //if you are logged in
        //logout
        res.clearCookie('name');
        res.render('login', { title: "SuperCanvasser", logged: "Login"});
    }
});

router.get('/addUser.hbs', function (req, res, next) {
    res.render('addUser', { title: 'SuperCanvasser', logged: logValue });
});

router.get('/register.hbs', function (req, res, next) {
    res.render('register', { title: 'SuperCanvasser', logged: logValue, message: "This page is for canvasser registration. To become a manager please contact an administrator." });
});

module.exports = router;
