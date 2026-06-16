const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const DB_PATH     = process.env.VERCEL ? path.join('/tmp', 'radical.db') : path.join(__dirname, 'radical.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const db = new Database(DB_PATH);

// Performance settings
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema on first start
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);

// Auto-seed if the database is empty (important for ephemeral Vercel deploys)
try {
  const count = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (count === 0) {
    console.log('Database is empty. Triggering auto-seed...');
    const { seedDatabase } = require('./seed');
    seedDatabase(db);
  }
} catch (e) {
  console.error('[RADICAL] Auto-seeding database failed:', e);
}

module.exports = db;
