var mongoose = require('mongoose');
var db = mongoose.connection;
var winston = require('../winston');

// Helper class for accessing database information internally
module.exports = {
    getManagers: async function() { // Get the list of managers
        return new Promise(function(resolve, reject) {
            db.collection('users').find({'campaignManager': true}, function (err, ret) {
                if (ret) {
                    winston.info('MongoDB found managers, return array')
                    resolve(ret.toArray()); // Resolve, return found managers
                }
                winston.info('MongoDB did not find managers')
                resolve(); // Resolve, no managers found
            })
        });
    },

    getCanvassers: async function() { // Get the list of canvassers
        return new Promise(function(resolve, reject) {
            db.collection('users').find({'canvasser': true}, function (err, ret) {
                if (ret) {
                    winston.info('MongoDB found canvassers, return array')
                    resolve(ret.toArray()); // Resolve, return found canvassers
                }
                winston.info('MongoDB did not find canvassers')
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
    },

    getUsers: async function(username) { // Get all users
        return new Promise(function(resolve, reject) {
            db.collection('users').find({"isID": {"$exists": false}}, function(err, ret) {
                if (ret) {
                    resolve(ret.toArray()); // Resolve, return found users
                }
                resolve(); // Resolve, no user found
            })
        })
    },

    getUser: async function(username) { // Get a user using username
        return new Promise(function(resolve, reject) {
            db.collection('users').findOne({'username': username}, function(err, ret) {
                if (ret) {
                    resolve(ret); // Resolve, return found user
                }
                resolve(); // Resolve, no user found
            })
        })
    }, 

    getUsers: async function() { // Get all users
        return new Promise(function(resolve, reject) {
            db.collection('users').find({"isID": {"$exists": false}}, function(err, ret) {
                if (ret) {
                    resolve(ret.toArray()); // Resolve, return found users
                }
                resolve(); // Resolve, no user found
            })
        })
    },

    getGlobals: async function() { // Get all globals
        return new Promise(function(resolve, reject) {
            db.collection('globals').findOne({"_id": 1}, function(err, ret) {
                if (ret) {
                    resolve(ret); // Resolve, return found globals
                }
                resolve(); // Resolve, no global found
            })
        })
    },

    findTask: async function(username, date) { // Get a task given a username and a date
        return new Promise(function(resolve, reject) {
            db.collection('tasks').findOne({'username': username, 'date': date}, function(err, ret) {
                if (ret) {
                    resolve(ret); // Resolve, return found user
                }
                resolve(); // Resolve, no user found
            })
        })
    },

    getTasks: async function(campaignId) { // Get all tasks for specific canvassing assignment
        return new Promise(function(resolve, reject) {
            intId = parseInt(campaignId)
            db.collection('tasks').find({'campaignID': intId}, function(err, ret) {
                if (ret) {
                    resolve(ret.toArray()); // Resolve, return found tasks
                }
                resolve(); // Resolve, no tasks found
            })
        })
    },

    getUpcomingTasks: async function(username) { // Get all tasks for specific canvassing assignment
        return new Promise(function(resolve, reject) {
            db.collection('tasks').find({'username': username}, function(err, ret) {
                if (ret) {
                    resolve(ret.toArray()); // Resolve, return found tasks
                }
                resolve(); // Resolve, no tasks found
            })
        })
    },

    getTask: async function(campaignId, taskId) { // Get task for specific canvassing assignment
        return new Promise(function(resolve, reject) {
            campaignIntId = parseInt(campaignId);
            taskIntId = parseInt(taskId);
            db.collection('tasks').findOne({'taskID': taskIntId, "campaignID": campaignIntId}, function(err, ret) {
                if (ret) {
                    resolve(ret); // Resolve, return found task
                }
                resolve(); // Resolve, no task found
            })
        })
    },

    getResults: async function(campaignId) { // Get all results for a given campaign
        return new Promise(function(resolve, reject) {
            intId = parseInt(campaignId)
            db.collection('results').find({'campaignID': intId}, function(err, ret) {
                if (ret) {
                    resolve(ret.toArray()); // Resolve, return found task
                }
                resolve(); // Resolve, no task found
            })
        });
    }
}
