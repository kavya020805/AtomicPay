const db = require('../config/db');

/**
 * GET /api/users
 * List all users (excluding passwords).
 */
async function getAllUsers(req, res) {
  const result = await db.query(
    `SELECT u.id, u.username, u.email, u.created_at, w.balance_in_cents
     FROM users u
     JOIN wallets w ON w.user_id = u.id
     ORDER BY u.username ASC`
  );
  res.json(result.rows);
}

/**
 * GET /api/users/search?q=<query>
 * Search users by username (for recipient selection).
 */
async function searchUsers(req, res) {
  const { q } = req.query;
  if (!q || q.length < 1) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const result = await db.query(
    `SELECT u.id, u.username, u.email
     FROM users u
     WHERE u.username ILIKE $1 AND u.id != $2
     ORDER BY u.username ASC
     LIMIT 10`,
    [`%${q}%`, req.user.id]
  );

  res.json(result.rows);
}

/**
 * GET /api/users/:id
 * Get a specific user's public profile.
 */
async function getUserById(req, res) {
  const { id } = req.params;

  const result = await db.query(
    `SELECT u.id, u.username, u.email, u.created_at, w.balance_in_cents
     FROM users u
     JOIN wallets w ON w.user_id = u.id
     WHERE u.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(result.rows[0]);
}

module.exports = { getAllUsers, searchUsers, getUserById };
