const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./config/db');

const DEMO_USERS = [
  { username: 'Alice',   email: 'alice@atomicpay.com',   password: 'password123' },
  { username: 'Bob',     email: 'bob@atomicpay.com',     password: 'password123' },
  { username: 'Charlie', email: 'charlie@atomicpay.com', password: 'password123' },
];

const INITIAL_BALANCE_CENTS = 100000; // $1,000.00

async function seed() {
  const client = await db.pool.connect();
  try {
    // 1. Run schema.sql to create tables
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('📦 Running schema.sql...');
    await client.query(schemaSql);
    console.log('✅ Schema created successfully');

    // 2. Insert demo users with hashed passwords
    console.log('👤 Creating demo users...');
    for (const user of DEMO_USERS) {
      const passwordHash = await bcrypt.hash(user.password, 12);
      
      // Insert user
      const userResult = await client.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        [user.username, user.email, passwordHash]
      );
      const userId = userResult.rows[0].id;

      // Create wallet with initial balance
      await client.query(
        'INSERT INTO wallets (user_id, balance_in_cents) VALUES ($1, $2)',
        [userId, INITIAL_BALANCE_CENTS]
      );

      console.log(`  ✅ ${user.username} (${user.email}) — $${INITIAL_BALANCE_CENTS / 100}`);
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Demo Credentials:');
    console.log('  Email: alice@atomicpay.com');
    console.log('  Password: password123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (err) {
    console.error('❌ Error seeding database:', err.message);
    throw err;
  } finally {
    client.release();
    await db.pool.end();
    process.exit(0);
  }
}

seed();
