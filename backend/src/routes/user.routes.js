const express = require('express');
const router = express.Router();
const { getAllUsers, searchUsers, getUserById } = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth');

// GET /api/users — list all users
router.get('/', authenticateToken, getAllUsers);

// GET /api/users/search?q=<query> — search users by username
router.get('/search', authenticateToken, searchUsers);

// GET /api/users/:id — get specific user
router.get('/:id', authenticateToken, getUserById);

module.exports = router;
