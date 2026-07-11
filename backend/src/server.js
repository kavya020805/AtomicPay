const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// GET all users
app.get('/api/users', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, username, balance_in_cents FROM users ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET transaction history for a specific user
app.get('/api/transactions/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { rows } = await db.query(`
      SELECT t.id, t.amount_in_cents, t.status, t.timestamp,
             u1.username AS sender, u2.username AS receiver
      FROM transactions t
      LEFT JOIN users u1 ON t.sender_id = u1.id
      LEFT JOIN users u2 ON t.receiver_id = u2.id
      WHERE t.sender_id = $1 OR t.receiver_id = $1
      ORDER BY t.timestamp DESC
    `, [userId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Basic health check route
app.get('/', (req, res) => {
  res.send('AtomicPay API is running!');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
