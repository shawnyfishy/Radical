const { createClient } = require('@libsql/client');
const path = require('path');
const fs   = require('fs');

// In production (Vercel), connect to Turso cloud using env vars.
// In local dev, fall back to a local SQLite file — same API, no Turso needed locally.

let client;

if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  client = createClient({
    url:       process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
} else {
  const localPath = path.join(__dirname, 'radical.db');
  client = createClient({ url: `file:${localPath}` });
}

// Run schema on every cold start — CREATE TABLE IF NOT EXISTS is safe to repeat.
async function initSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    try {
      await client.execute(stmt + ';');
    } catch (e) {
      console.log('[RADICAL] Schema stmt skipped (already exists):', e.message.slice(0, 80));
    }
  }

  // Migration: add session_id column to orders if it doesn't exist yet
  try {
    await client.execute('ALTER TABLE orders ADD COLUMN session_id TEXT');
  } catch (e) {
    // Column already exists — expected on all but the very first run
  }

  // Migration: add Delhivery shipping columns to orders if they don't exist yet
  try {
    await client.execute('ALTER TABLE orders ADD COLUMN waybill TEXT');
  } catch (e) {}
  try {
    await client.execute("ALTER TABLE orders ADD COLUMN shipping_status TEXT DEFAULT 'pending'");
  } catch (e) {}
  try {
    await client.execute('ALTER TABLE orders ADD COLUMN estimated_delivery TEXT');
  } catch (e) {}

  // Migration: add Google Sheets sync status columns to orders
  try {
    await client.execute('ALTER TABLE orders ADD COLUMN sheets_synced_at TEXT');
  } catch (e) {}
  try {
    await client.execute('ALTER TABLE orders ADD COLUMN sheets_sync_error TEXT');
  } catch (e) {}
  try {
    await client.execute('ALTER TABLE orders ADD COLUMN delhivery_error TEXT');
  } catch (e) {}

  // Migration: add unique constraint index to variants (product_id, label)
  try {
    await client.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_variants_product_label ON variants(product_id, label)');
  } catch (e) {
    // Index already exists
  }

  // Auto-seed products if the database is empty
  try {
    const result = await client.execute('SELECT COUNT(*) as count FROM products');
    const count = Number(result.rows[0].count);
    if (count === 0) {
      console.log('[RADICAL] Database empty. Auto-seeding...');
      const { seedDatabase } = require('./seed');
      await seedDatabase(client);
    }
  } catch (e) {
    console.error('[RADICAL] Auto-seed failed:', e);
  }
}

// This promise resolves once the schema is ready.
// All routes wait for this via server.js before accepting requests.
const ready = initSchema().catch(e => {
  console.error('[RADICAL] Schema init warning (tables may already exist):', e.message);
});

// ── Query helpers ─────────────────────────────────────────────────────────────
// These replace better-sqlite3's .prepare().get() / .all() / .run() API.

// Returns one row object or null
async function get(sql, args = []) {
  const result = await client.execute({ sql, args });
  return result.rows[0] ?? null;
}

// Returns array of row objects
async function all(sql, args = []) {
  const result = await client.execute({ sql, args });
  return result.rows;
}

// Executes a write — returns { lastInsertRowid, rowsAffected }
async function run(sql, args = []) {
  const result = await client.execute({ sql, args });
  return {
    lastInsertRowid: result.lastInsertRowid ? Number(result.lastInsertRowid) : null,
    rowsAffected:    result.rowsAffected,
  };
}

// Executes multiple statements atomically
// statements = array of { sql, args } objects
async function transaction(statements) {
  await client.batch(statements, 'write');
}

module.exports = { get, all, run, transaction, ready, client };
