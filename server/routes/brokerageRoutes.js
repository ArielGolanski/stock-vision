const express = require('express');
const router = express.Router();
const brokerageController = require('../controllers/brokerageController'); 
router.get('/', brokerageController.getAllBrokerages);

module.exports = router;
