const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
// Express 5 handles async errors natively — no need for express-async-errors

const db = require('./config/db');
const { getRedisClient, disconnectRedis } = require('./config/redis');
const { connectProducer, disconnectProducer, createTopics } = require('./config/kafka');
const { startConsumers, stopConsumers } = require('./consumers/index');

// Route imports
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const transferRoutes = require('./routes/transfer.routes');
const transactionRoutes = require('./routes/transaction.routes');

const app = express();
const port = process.env.PORT || 3000;

// ─── Core Middleware ────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// ─── API Routes ─────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/transactions', transactionRoutes);

// ─── Health Check ───────────────────────────────
app.get('/health', async (req, res) => {
  const healthStatus = { status: 'ok', uptime: process.uptime() };

  // Check PostgreSQL
  try {
    await db.query('SELECT 1');
    healthStatus.postgres = 'connected';
  } catch {
    healthStatus.postgres = 'disconnected';
  }

  // Check Redis
  try {
    const redis = getRedisClient();
    await redis.ping();
    healthStatus.redis = 'connected';
  } catch {
    healthStatus.redis = 'disconnected';
  }

  res.json(healthStatus);
});

// ─── Root Route ─────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'AtomicPay API',
    version: '2.0.0',
    docs: '/health',
  });
});

// ─── Global Error Handler ───────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Server Startup ─────────────────────────────
async function startServer() {
  try {
    // 1. Test PostgreSQL connection
    await db.query('SELECT 1');
    console.log('✅ PostgreSQL connected');

    // 2. Initialize Redis
    getRedisClient();

    // 3. Create Kafka topics
    try {
      await createTopics([
        { topic: 'payment.events', numPartitions: 3 },
      ]);
    } catch (err) {
      console.warn('⚠️ Kafka topic creation skipped (Kafka may not be running):', err.message);
    }

    // 4. Connect Kafka producer
    try {
      await connectProducer();
    } catch (err) {
      console.warn('⚠️ Kafka producer connection skipped:', err.message);
    }

    // 5. Start Kafka consumers
    try {
      await startConsumers();
    } catch (err) {
      console.warn('⚠️ Kafka consumers skipped:', err.message);
    }

    // 6. Start Express server
    app.listen(port, () => {
      console.log(`\n🚀 AtomicPay v2.0 running on http://localhost:${port}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  Endpoints:');
      console.log('  POST /api/auth/register');
      console.log('  POST /api/auth/login');
      console.log('  POST /api/auth/logout');
      console.log('  GET  /api/auth/me');
      console.log('  GET  /api/users');
      console.log('  GET  /api/users/search?q=...');
      console.log('  POST /api/transfer');
      console.log('  GET  /api/transfer/:id/status');
      console.log('  GET  /api/transactions');
      console.log('  GET  /api/transactions/:id/events');
      console.log('  GET  /health');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

// ─── Graceful Shutdown ──────────────────────────
async function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  try {
    await stopConsumers();
    await disconnectProducer();
    await disconnectRedis();
    await db.pool.end();
    console.log('✅ All connections closed. Goodbye!');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();

module.exports = app;
