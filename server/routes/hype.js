const express = require('express');
const router = express.Router();
const hypeCtrl = require('../controllers/hype');

router.get('/hypemeter', hypeCtrl.getHypeMeter);

module.exports = router;