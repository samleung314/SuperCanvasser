var express = require('express');
var router = express.Router();
var winston = require('../winston');

/* GET users listing. */
router.get('/', function(req, res, next) {
  winston.info('Get users listing')
  res.send('respond with a resource');
});

module.exports = router;
