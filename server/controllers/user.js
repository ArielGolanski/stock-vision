const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_to_a_long_random_string';

// create transporter ONCE (uses Gmail service account)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,    // e.g. stockvision.app@gmail.com
    pass: process.env.EMAIL_PASS     // Gmail App Password
  }
});

// --- Register ---
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, brokerage, customFeePerShare, customFeeMinimum } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      email,
      password: hashed,
      firstName,
      lastName,
      brokerage,
      customFeePerShare, 
      customFeeMinimum,
      verified: false,
      verificationCode
    });

    // send code
    await transporter.sendMail({
      from: `"Stock Vision" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify your email',
      text: `Your verification code is: ${verificationCode}`
    });

    res.status(201).json({ message: 'User registered. Check email for code.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Verify Email ---
exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: 'Invalid code' });
    }

    user.verified = true;
    user.verificationCode = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Login ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.verified)
      return res.status(403).json({ message: 'Email not verified' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    // UPDATED: Add firstName to the token
    const token = jwt.sign({ 
      id: user._id, 
      email: user.email,
      firstName: user.firstName 
    }, JWT_SECRET, { expiresIn: '1d' });
    
    res.json({
      token,
      user: { email: user.email, firstName: user.firstName, lastName: user.lastName }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Middleware ---
exports.isLoggedIn = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(403).json({ message: 'Token required' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// --- Profile ---
exports.profile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Update Profile (Settings page) ---
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, brokerage, customFeePerShare, customFeeMinimum } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (brokerage !== undefined) user.brokerage = brokerage;
    if (customFeePerShare !== undefined) user.customFeePerShare = customFeePerShare;
    if (customFeeMinimum !== undefined) user.customFeeMinimum = customFeeMinimum;
    if (email !== undefined) {
      const existing = await User.findOne({ email, _id: { $ne: user._id } });
      if (existing) return res.status(409).json({ message: 'Email already exists' });
      user.email = email;
    }

    await user.save();
    res.json({ message: 'Profile updated', user: { firstName: user.firstName, lastName: user.lastName, email: user.email, brokerage: user.brokerage, customFeePerShare: user.customFeePerShare, customFeeMinimum: user.customFeeMinimum } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Change Password ---
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(400).json({ message: 'Old password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};