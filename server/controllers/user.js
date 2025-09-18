const userService = require('../services/user');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

// Register
const register = async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  const existingUser = await userService.getUserByEmail(email);
  if (existingUser) return res.status(409).json({ message: 'Email already exists' });

  const newUser = await userService.createUser(email, password, firstName, lastName);
  if (!newUser) return res.status(500).json({ message: 'Error creating user' });

  res.status(201).json(newUser);
};

// Login
const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await userService.getUserByEmail(email);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const isValid = await userService.checkPassword(user, password);
  if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
  res.status(200).json({ token, user });
};

// Protected profile route
const profile = async (req, res) => {
  try {
    // req.user.email comes from the decoded JWT
    const user = await userService.getUserByEmail(req.user.email); // implement in service
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      message: `Welcome ${user.email}`,
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Middleware to check token
const isLoggedIn = (req, res, next) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  } else {
    return res.status(403).json({ message: 'Token required' });
  }
};

module.exports = { register, login, profile, isLoggedIn };
