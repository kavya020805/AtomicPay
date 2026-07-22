const db = require('../config/db');
const { hashPassword, comparePassword, generateToken } = require('../services/auth.service');
const { cacheSession, deleteSession } = require('../services/redis.service');

/**
 * POST /api/auth/register
 * Create a new user account with wallet.
 */
async function register(req, res) {
  const { username, email, password } = req.body;

  // Check if user already exists
  const existing = await db.query(
    'SELECT id FROM users WHERE email = $1 OR username = $2',
    [email, username]
  );

  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'User with that email or username already exists' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Create user
    const passwordHash = await hashPassword(password);
    const userResult = await client.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, email, passwordHash]
    );
    const user = userResult.rows[0];

    // Create wallet with $0 balance (new users start with $0; seeded users get $1000)
    await client.query(
      'INSERT INTO wallets (user_id, balance_in_cents) VALUES ($1, $2)',
      [user.id, 100000] // Give new users $1000 for demo purposes
    );

    await client.query('COMMIT');

    // Generate JWT
    const token = generateToken(user);

    // Cache session in Redis
    await cacheSession(user.id, { username: user.username, email: user.email });

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
      },
      token,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Registration error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  } finally {
    client.release();
  }
}

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token.
 */
async function login(req, res) {
  const { email, password } = req.body;

  const result = await db.query(
    'SELECT id, username, email, password_hash FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const user = result.rows[0];
  const isValidPassword = await comparePassword(password, user.password_hash);

  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Generate JWT
  const token = generateToken(user);

  // Cache session in Redis
  await cacheSession(user.id, { username: user.username, email: user.email });

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    token,
  });
}

/**
 * POST /api/auth/logout
 * Invalidate user session.
 */
async function logout(req, res) {
  await deleteSession(req.user.id);
  res.json({ message: 'Logged out successfully' });
}

/**
 * GET /api/auth/me
 * Get current authenticated user's profile with wallet.
 */
async function getMe(req, res) {
  const result = await db.query(
    `SELECT u.id, u.username, u.email, u.created_at, w.balance_in_cents
     FROM users u
     JOIN wallets w ON w.user_id = u.id
     WHERE u.id = $1`,
    [req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(result.rows[0]);
}

module.exports = { register, login, logout, getMe };
