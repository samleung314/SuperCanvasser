var mongoose = require('mongoose');
var db = mongoose.connection;

// Helper class for accessing database information internally
module.exports = {
    getManagers: async function() { // Get the list of managers
        return new Promise(function(resolve, reject) {
            db.collection('users').find({'campaignManager': true}, function (err, ret) {
                if (ret) {
                    resolve(ret.toArray()); // Resolve, return found managers
                }
                resolve(); // Resolve, no managers found
            })
        });
    },

    getCanvassers: async function() { // Get the list of canvassers
        return new Promise(function(resolve, reject) {
            db.collection('users').find({'canvasser': true}, function (err, ret) {
                if (ret) {
                    resolve(ret.toArray()); // Resolve, return found canvassers
                }
                resolve(); // Resolve, no canvassers found
            })
        });
    }
}
