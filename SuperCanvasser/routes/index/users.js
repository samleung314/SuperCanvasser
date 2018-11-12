var router = require('express').Router();
var winston = require('../../winston');
var shared = require('./shared');
var dbHelper = require('../database/databaseHelper');

function userCompare(a, b) {
  if (a.username < b.username) {
      return -1;
  } else if (a.username > b.username) {
      return 1;
  }
  return 0;
}

// Users main page
router.get('/users', async function(req, res, next) {
  await shared.setLogged(req); // Wait for database
  var users = await dbHelper.getUsers();
  users.sort(userCompare);
  winston.info('Access users main page')
  if (shared.admin) {
      winston.info('User is admin, access admin main page')
      res.render('users', {title: "SuperCanvasser", logged: logValue, users, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser});
  } else {
      res.render('index', {title: "SuperCanvasser", logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser});
  } 
})

// Edit User page
router.get('/editUser/:id', async function(req, res, next) {
  var id = req.params.id;
  var user = await dbHelper.getUser(id); // Load the user based on the username
  user = JSON.stringify(user);
  winston.info('Edit User: ' + id)
  if (shared.admin) {
      winston.info('Edit User: Admin level access')
      res.render('editUser', {title: "SuperCanvasser", subtitle: "Edit User", logged: logValue, user, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser, editUser: true, action: '/database/editUser'}); 
  } else {
      winston.info('Edit User: Non-admin level access')
      res.render('index', {title: "SuperCanvasser", logged: logValue, admin: shared.admin, manager: shared.manager, canvasser: shared.canvasser});
  }
})

module.exports = router;
