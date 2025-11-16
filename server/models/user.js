const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  firstName: String,
  lastName: String,
  brokerage: { 
  type: mongoose.Schema.Types.ObjectId, 
  ref: 'Brokerage' 
  },
  customFeePerShare: { type: Number, default: 0.00 },
  customFeeMinimum: { type: Number, default: 0.00 },
  verified: { type: Boolean, default: false },
  verificationCode: String,
  verificationCodeExpires: Date
});

module.exports = mongoose.model('User', userSchema);
