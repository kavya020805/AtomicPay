const express = require('express');
const router = express.Router();
const { register, login, logout, getMe } = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');

// POST /api/auth/register
router.post(
  '/register',
  authLimiter,
  validate([
    { field: 'username', type: 'string', minLength: 2, maxLength: 50 },
    { field: 'email', type: 'email' },
    { field: 'password', type: 'string', minLength: 6 },
  ]),
  register
);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  validate([
    { field: 'email', type: 'email' },
    { field: 'password', type: 'string', minLength: 1 },
  ]),
  login
);

// POST /api/auth/logout (requires auth)
router.post('/logout', authenticateToken, logout);

// GET /api/auth/me (requires auth)
router.get('/me', authenticateToken, getMe);

module.exports = router;
