const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const userController = require('../controllers/user');
const User = require('../models/user'); // Make sure you have your User model
require('dotenv').config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ---------- Public Routes ----------
router.post('/register', userController.register);
router.post('/login', userController.login);

// ---------- Google Login ----------
router.post('/google-login', async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const email = payload.email;
        const firstName = payload.given_name;
        const lastName = payload.family_name;

        // Check if user exists
        let user = await User.findOne({ email });
        if (!user) {
            // If not, create a new user with no password
            user = await User.create({ email, firstName, lastName, password: null });
        }

        // Generate JWT for your app
        const appToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.status(200).json({ token: appToken, firstName: user.firstName });
    } catch (err) {
        console.error('Google login error:', err.message);
        res.status(400).json({ message: 'Invalid Google token' });
    }
});

// ---------- Protected ----------
router.get('/profile', userController.isLoggedIn, userController.profile);

module.exports = router;
