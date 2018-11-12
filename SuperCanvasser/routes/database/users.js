var router = require('express').Router();
var winston = require('../../winston');
var mongoose = require('mongoose');
var db = mongoose.connection;

/* When adding a user into the database*/
router.post('/addUser', function (req, res, next) {
    var v = req.body;
    if (v.fname == '' || v.lname == '' || v.email == '' || v.user == '' || v.pass == '') {
        winston.info('Add User: User fields not complete')
        res.render('addUser', { title: 'SuperCanvasser', message: 'All fields are required; please enter all information.' });
    } else {
        db.collection('users').findOne({ 'username': v.user }, function (err, ret) {
            if (err) return handleError(err);
            if (ret != null) {
                winston.info('Add User: Username already taken')
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
                winston.info('Add User: Sucessfully added')
                res.redirect('/addUser.hbs');
            } else {
                winston.info('Add User: Account role not selected')
                res.render('addUser', { title: 'SuperCanvasser', message: 'Please select at least one account role.' });
            }
        })
    }
});

// Edit a user
router.post('/editUser', async function(req, res, next) {
    var v = req.body;
    var username = JSON.parse(v['original-user']).username;

    winston.info('Edit User: User ' + username + ' sucessfully edited and saved in DB' )
    db.collection('users').updateOne({'username': username}, { // Update the user in the database
        $set: {
            username: v.username,
            password: v.password,
            email: v.email,
            firstName: v['first-name'],
            lastName: v['last-name'],
            canvasser: Boolean(v.userType.includes('canvasser')),
            campaignManager: Boolean(v.userType.includes('campaign-manager')),
            sysAdmin: Boolean(v.userType.includes('system-admin'))           
        }
    });
    res.redirect('/users'); // Go back to users page
})

module.exports = router;
