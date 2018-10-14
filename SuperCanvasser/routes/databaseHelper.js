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
    },

    getCampaignID: async function() { // Get the next campaign ID, increment campaign ID as a side effect
        return new Promise(function(resolve, reject) {
            db.collection('campaigns').findOne({'isID': true}, function (err, ret) { // Get the ID object
                if (ret) { // If successful, increment the ID object
                    db.collection('campaigns').updateOne({'isID': true}, {$set: {id: ret.id + 1}}, function (err, ret) {});
                    resolve(ret.id); // Resolve, return the ID
                }
                resolve(); // Resolve, no ID found
            })
        })
    },

    getCampaigns: async function() { // Get the list of campaigns
        return new Promise(function(resolve, reject) {
            db.collection('campaigns').find({"isID": {"$exists": false}}, function(err, ret) {
                if (ret) {
                    resolve(ret.toArray()); // Resolve, return found campaigns
                }
                resolve(); // Resolve, no campaigns found
            })
        });
    },

    getCampaign: async function(id) { // Get a campaign using ID
        return new Promise(function(resolve, reject) {
            db.collection('campaigns').findOne({'id': id}, function(err, ret) {
                if (ret) {
                    resolve(ret); // Resolve, return found campaign
                }
                resolve(); // Resolve, no campaign found
            })
        })
    }
}
