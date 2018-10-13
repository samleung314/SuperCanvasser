var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var db = mongoose.connection;

router.get('/', function (req, res, next) {
});

/* User login*/
router.post('/login', function (req, res, next) {
    var v = req.body;
    db.collection('users').findOne({ 'username': v.user, 'password': v.pass }, function (err, ret) {
        if (err) return handleError(err);
        if (ret != null) {
            res.cookie('name', ret.name)
            console.log("Logged In: " + v.user);
            res.redirect('/')
        } else {
            res.render('login', { title: 'SuperCanvasser', logged: "Login", message: 'Invalid Credentials' });
        }
    })
});


/* When adding a user into the database*/
router.post('/addUser', function (req, res, next) {
    var v = req.body;
    if (v.fname == '' || v.lname == '' || v.email == '' || v.user == '' || v.pass == '') {
        res.render('addUser', { title: 'SuperCanvasser', message: 'All fields are required; please enter all information.' });
    } else {
        db.collection('users').findOne({ 'username': v.user }, function (err, ret) {
            if (err) return handleError(err);
            if (ret != null) {
                res.render('addUser', { title: 'SuperCanvasser', message: 'Username already taken. Please enter another.' });
            } else if (v.canvasser || v.campaignManager || v.sysAdmin) {
                var user = {
                    firstName: v.fname,
                    lastName: v.lname,
                    email: v.email,
                    username: v.user,
                    password: v.pass,
                    canvasser: Boolean(v.canvasser),
                    campaignManager: Boolean(v.campaignManager),
                    sysAdmin: Boolean(v.sysAdmin)
                };
                db.collection('users').insertOne(user);
                res.render('addUser', { title: 'SuperCanvasser', message: 'User successfully added.' });
            } else {
                res.render('addUser', { title: 'SuperCanvasser', message: 'Please select at least one account role.' });
            }
        })
    }
});

/* Person registering as a canvasser*/
router.post('/register', function (req, res, next) {
    var v = req.body;
    if (v.fname == '' || v.lname == '' || v.email == '' || v.user == '' || v.pass == '') {
        res.render('register', { title: 'SuperCanvasser', message: 'All fields are required; please enter all information.' });
    } else {
        db.collection('users').findOne({ 'username': v.user }, function (err, ret) {
            if (err) return handleError(err);
            if (ret != null) {
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
                res.render('login', { title: 'SuperCanvasser', message: 'Welcome! Please login' });
            }
        })
    }
});

module.exports = router;
