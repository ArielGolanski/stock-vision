const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');

// Public
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected
router.get('/profile', userController.isLoggedIn, userController.profile);

module.exports = router;
