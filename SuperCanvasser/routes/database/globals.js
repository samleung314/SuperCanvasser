var router = require('express').Router();
var winston = require('../../winston');
var mongoose = require('mongoose');
var db = mongoose.connection;

// Edit globals
router.post('/editGlobals', async function(req, res, next) {
    var v = req.body;
    var id = JSON.parse(v['original-globals'])._id;

    winston.info('Edit Globals: Globals changed successfully and saved in DB')
    db.collection('globals').updateOne({'_id': id}, {
        $set: {
            workDayDuration: v['work-day-duration'],
            avgTravelTime: v['average-travel-time'],         
        }
    });
    res.redirect('/editGlobals');
})

module.exports = router;
