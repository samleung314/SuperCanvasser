var router = require('express').Router();
var winston = require('../../winston');
var mongoose = require('mongoose');
var db = mongoose.connection;

/* Canvasser edit availability*/
router.post('/editAvailability', async function (req, res, next) {
    var v = req.body;
    var dates = v.dates.split(",");
    if (dates === undefined || dates.length == 0 || dates[0] == "") {
        db.collection('users').updateOne({ 'username': req.cookies.name }, { // Remove all available dates
            $set: {
                availability: null
            }
        });
        winston.info('All available dates cleared.');
    } else {
        db.collection('users').updateOne({ 'username': req.cookies.name }, { // Update the user in the database
            $set: {
                availability: dates
            }
        });
        winston.info('Canvasser availability updated.');
    }
    res.redirect('back');
});

module.exports = router;
