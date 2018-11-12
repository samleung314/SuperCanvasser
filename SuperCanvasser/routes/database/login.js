var router = require('express').Router();
var winston = require('../../winston');
var mongoose = require('mongoose');
var db = mongoose.connection;

/* User login*/
router.post('/login', function (req, res, next) {
    var v = req.body;
    winston.info('Query DB for user: ' + v.user)
    db.collection('users').findOne({ 'username': v.user, 'password': v.pass }, function (err, ret) {
        if (err) return handleError(err);
        if (ret != null) {
            winston.info('User found in DB and log in')
            res.cookie('name', ret.username)
            console.log("Logged In: " + v.user);
            res.redirect('/')
        } else {
            winston.info('User not found in DB')
            res.render('login', { title: 'SuperCanvasser', logged: "Login", message: 'Invalid Credentials' });
        }
    })
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
                var user = {
                    firstName: v.fname,
                    lastName: v.lname,
                    email: v.email,
                    username: v.user,
                    password: v.pass,
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

module.exports = router;
