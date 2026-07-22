const express = require('express');
const router = express.Router();
const { getTransactions, getTransactionEvents } = require('../controllers/transaction.controller');
const { authenticateToken } = require('../middleware/auth');

// GET /api/transactions — paginated transaction history
router.get('/', authenticateToken, getTransactions);

// GET /api/transactions/:id/events — Kafka event trail for a transaction
router.get('/:id/events', authenticateToken, getTransactionEvents);

module.exports = router;
