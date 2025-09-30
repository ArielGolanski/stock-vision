const Comment = require('../models/Comment');

// Get all comments for a specific stock
exports.getComments = async (req, res) => {
  try {
    const { ticker } = req.query;
    
    if (!ticker) {
      return res.status(400).json({ message: 'Ticker is required' });
    }

    const comments = await Comment.find({ ticker })
      .sort({ createdAt: -1 }) // Most recent first
      .limit(100) // Limit to prevent overwhelming data
      .lean();

    res.json({ comments });
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new comment
exports.createComment = async (req, res) => {
  try {
    const { ticker, content } = req.body;
    
    if (!ticker || !content) {
      return res.status(400).json({ message: 'Ticker and content are required' });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ message: 'Comment too long (max 1000 characters)' });
    }

    const comment = await Comment.create({
      ticker: ticker.toUpperCase(),
      userId: req.user.id,
      firstName: req.user.firstName || 'Anonymous', // Use firstName from token or fallback
      content: content.trim()
    });

    res.status(201).json({ 
      message: 'Comment created successfully',
      comment 
    });
  } catch (err) {
    console.error('Create comment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a comment (only by the author)
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if the user is the author
    if (comment.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await Comment.findByIdAndDelete(commentId);
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};