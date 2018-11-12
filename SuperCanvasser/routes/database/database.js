var express = require('express');
var router = express.Router();

router.use(require('./availability'));
router.use(require('./campaigns'));
router.use(require('./canvass'));
router.use(require('./globals'));
router.use(require('./login'));
router.use(require('./users'));

module.exports = router;
