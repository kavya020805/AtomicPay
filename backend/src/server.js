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

// POST transfer money with ACID Transactions and Row-Level Locking
app.post('/api/transfer', async (req, res) => {
  const { senderId, receiverId, amount } = req.body;

  if (!senderId || !receiverId || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (senderId === receiverId) {
    return res.status(400).json({ error: 'Sender and receiver must be different' });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than zero' });
  }

  // Get a dedicated client from the pool for our transaction
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // To prevent deadlocks, always lock the row with the lower ID first
    const firstId = Math.min(senderId, receiverId);
    const secondId = Math.max(senderId, receiverId);

    // Lock the rows for update. Concurrent requests trying to lock these rows will block here.
    await client.query('SELECT * FROM users WHERE id = $1 FOR UPDATE', [firstId]);
    await client.query('SELECT * FROM users WHERE id = $1 FOR UPDATE', [secondId]);

    // Check sender's balance
    const senderRes = await client.query('SELECT balance_in_cents FROM users WHERE id = $1', [senderId]);
    if (senderRes.rows.length === 0) {
      throw new Error('Sender not found');
    }

    const senderBalance = senderRes.rows[0].balance_in_cents;
    if (senderBalance < amount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // Deduct from sender
    await client.query('UPDATE users SET balance_in_cents = balance_in_cents - $1 WHERE id = $2', [amount, senderId]);

    // Add to receiver
    await client.query('UPDATE users SET balance_in_cents = balance_in_cents + $1 WHERE id = $2', [amount, receiverId]);

    // Record the transaction
    await client.query(
      'INSERT INTO transactions (sender_id, receiver_id, amount_in_cents, status) VALUES ($1, $2, $3, $4)',
      [senderId, receiverId, amount, 'completed']
    );

    await client.query('COMMIT');
    res.json({ message: 'Transfer successful', amount });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Transaction failed, rolled back:', err);
    res.status(500).json({ error: 'Transaction failed' });
  } finally {
    client.release();
  }
});

// Basic health check route
app.get('/', (req, res) => {
  res.send('AtomicPay API is running!');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
