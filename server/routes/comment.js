const express = require('express');
const router = express.Router();
const commentCtrl = require('../controllers/comment');
const { isLoggedIn } = require('../controllers/user');

// Get comments for a stock (public)
router.get('/', commentCtrl.getComments);

// Create a new comment (protected)
router.post('/', isLoggedIn, commentCtrl.createComment);

// Delete a comment (protected)
router.delete('/:commentId', isLoggedIn, commentCtrl.deleteComment);

module.exports = router;