const fs = require('fs');
const path = require('path');
const db = require('./db');

async function seed() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Connecting to database and running schema.sql...');
    await db.query(schemaSql);
    
    console.log('Database successfully seeded!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    process.exit(0);
  }
}

seed();
