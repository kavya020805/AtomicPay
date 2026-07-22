const db = require('../config/db');

/**
 * GET /api/transactions
 * Get transaction history for the authenticated user.
 * Supports pagination via ?page=1&limit=20
 */
async function getTransactions(req, res) {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;

  const result = await db.query(
    `SELECT t.id, t.amount_in_cents, t.status, t.note, t.idempotency_key,
            t.created_at, t.completed_at,
            us.username AS sender_username, us.id AS sender_id,
            ur.username AS receiver_username, ur.id AS receiver_id
     FROM transactions t
     JOIN users us ON t.sender_id = us.id
     JOIN users ur ON t.receiver_id = ur.id
     WHERE t.sender_id = $1 OR t.receiver_id = $1
     ORDER BY t.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  // Get total count for pagination
  const countResult = await db.query(
    'SELECT COUNT(*) FROM transactions WHERE sender_id = $1 OR receiver_id = $1',
    [userId]
  );

  const total = parseInt(countResult.rows[0].count, 10);

  res.json({
    transactions: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/**
 * GET /api/transactions/:id/events
 * Get Kafka-processed events for a specific transaction.
 */
async function getTransactionEvents(req, res) {
  const { id } = req.params;

  const result = await db.query(
    `SELECT id, event_type, payload, processed_by, created_at
     FROM payment_events
     WHERE transaction_id = $1
     ORDER BY created_at ASC`,
    [id]
  );

  res.json(result.rows);
}

module.exports = { getTransactions, getTransactionEvents };
