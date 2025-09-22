const User = require('models/user');
const bcrypt = require('bcrypt');

// Create new user
const createUser = async (email, password, firstName, lastName) => {
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashed, firstName, lastName });
  await user.save();
  return { id: user._id, email, firstName, lastName };
};

// Get user by email
const getUserByEmail = async (email) => {
  return await User.findOne({ email }).lean();
};

// Check password
const checkPassword = async (user, password) => {
  return await bcrypt.compare(password, user.password);
};

module.exports = { createUser, getUserByEmail, checkPassword };
