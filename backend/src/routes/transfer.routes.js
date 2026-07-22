const express = require('express');
const router = express.Router();
const { transfer, getTransferStatus } = require('../controllers/transfer.controller');
const { authenticateToken } = require('../middleware/auth');
const { transferLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');

// POST /api/transfer — execute a P2P transfer
router.post(
  '/',
  authenticateToken,
  transferLimiter,
  validate([
    { field: 'receiverId', type: 'string', minLength: 1 },
    { field: 'amount', type: 'number', min: 0.01 },
  ]),
  transfer
);

// GET /api/transfer/:id/status — check transfer status
router.get('/:id/status', authenticateToken, getTransferStatus);

module.exports = router;
