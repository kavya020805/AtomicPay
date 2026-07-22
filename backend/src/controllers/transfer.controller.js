const { executeTransfer } = require('../services/transfer.service');
const { getPaymentStatus } = require('../services/redis.service');
const db = require('../config/db');

/**
 * POST /api/transfer
 * Execute a P2P money transfer.
 */
async function transfer(req, res) {
  const { receiverId, amount, note } = req.body;
  const senderId = req.user.id;
  const idempotencyKey = req.headers['idempotency-key'] || null;

  const amountInCents = Math.round(parseFloat(amount) * 100);

  if (isNaN(amountInCents) || amountInCents <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const result = await executeTransfer({
    senderId,
    receiverId,
    amountInCents,
    idempotencyKey,
    note,
  });

  if (!result.success) {
    return res.status(result.status || 400).json({ error: result.error });
  }

  res.json({
    message: result.isIdempotent
      ? 'Transfer successful (idempotency cache hit)'
      : 'Transfer successful',
    transaction: result.transaction,
    isIdempotent: result.isIdempotent,
  });
}

/**
 * GET /api/transfer/:id/status
 * Get transfer status — checks Redis cache first, then DB.
 */
async function getTransferStatus(req, res) {
  const { id } = req.params;

  // Try Redis cache first
  const cached = await getPaymentStatus(id);
  if (cached) {
    return res.json({ ...cached, source: 'cache' });
  }

  // Fall back to DB
  const result = await db.query(
    'SELECT id, status, amount_in_cents, sender_id, receiver_id, completed_at FROM transactions WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  res.json({ ...result.rows[0], source: 'database' });
}

module.exports = { transfer, getTransferStatus };
