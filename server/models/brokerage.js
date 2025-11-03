// server/models/brokerage.js

const mongoose = require('mongoose');

const brokerageSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  }, 
  usTradeFeePerShare: { 
    type: Number, 
    required: true 
  },
  usTradeFeeMinimum: { 
    type: Number, 
    required: true 
  },
});

module.exports = mongoose.model('Brokerage', brokerageSchema);