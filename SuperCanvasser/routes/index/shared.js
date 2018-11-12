// Shared logging functions used by all scripts
module.exports = {
    logValue: "Login",
    loggedIn: false,
    manager: false,
    canvasser: false,
    admin: false,

    setLogged: async function(req) {
        //Keeps track of whether user is logged in or out
        if (req.cookies.name == "" || req.cookies.name == null) {
            logValue = "Login"
            loggedIn = false;
        } else {
            logValue = "Logout"
            loggedIn = true;
        }
        await this.getUserData(req); // Wait for database to get user data
    },

    // Get the user role data from the database
    getUserData: async function(req) {
        return new Promise(function(resolve, reject) { // Create promise for retrieving user data
            var username = req.cookies.name;
            if (username) {
                db.collection('users').findOne({ 'username': username }, function (err, ret) {
                    if (err) return handleError(err);
                    if (ret) { // User found
                        manager = ret.campaignManager;
                        canvasser = ret.canvasser;
                        admin = ret.sysAdmin;
                    } else { // User not found
                        manager = false;
                        canvasser = false;
                        admin = false;
                    }
                    resolve(); // Database contacted, resolve
                });
            } else { // No username
                manager = false;
                canvasser = false;
                admin = false;
                resolve(); // No username provided, resolve
            }
        });
    }
}
