const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  ticker: { 
    type: String, 
    required: true,
    index: true // Index for faster queries by ticker
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  firstName: { 
    type: String, 
    required: true 
  },
  content: { 
    type: String, 
    required: true,
    maxlength: 1000 // Prevent extremely long comments
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Compound index for efficient queries
commentSchema.index({ ticker: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);