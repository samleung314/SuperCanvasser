var router = require('express').Router();
var winston = require('../../winston');
var shared = require('./shared');
var dbHelper = require('../database/databaseHelper');

// Canvasser edit availability page
router.get('/editAvailability.hbs', async function (req, res, next) {
    await shared.setLogged(req); // Wait for database
    if (shared.canvasser) {
        winston.info('User is a canvasser, prepare info for the availability calendar.');
        var user = await dbHelper.getUser(req.cookies.name);
        var dates = user.availability;
        var length = 0; //number of dates already marked available
        if (dates != null) {
            length = dates.length;
        }
        var availability = [];
        var quote = "'";
        for (var i = 0; i < length; i++){
            var date = new Date(dates[i]);
            availability.push(quote.concat(date, quote));
        }
        res.render('editAvailability', { title: "SuperCanvasser", logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser, availability: availability});
    } else {
        winston.info('User is not a canvasser, redirect to index page')
        res.render('index', { title: "SuperCanvasser", logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser });
    } 
});

module.exports = router;
