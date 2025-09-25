const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/user');

router.post('/register', userCtrl.register);
router.post('/verify-email', userCtrl.verifyEmail);
router.post('/login', userCtrl.login);
router.get('/profile', userCtrl.isLoggedIn, userCtrl.profile);
router.put('/profile', userCtrl.isLoggedIn, userCtrl.updateProfile);
router.put('/change-password', userCtrl.isLoggedIn, userCtrl.changePassword);

module.exports = router;
