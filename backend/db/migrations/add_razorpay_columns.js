const { createClient } = require('@libsql/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

async function migrate() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  let db;
  if (url && authToken) {
    db = createClient({ url, authToken });
    console.log('Connecting to Turso Cloud...');
  } else {
    // Local SQLite database fallback
    const localDbPath = path.join(__dirname, '..', 'radical.db');
    db = createClient({ url: `file:${localDbPath}` });
    console.log('Connecting to local SQLite database:', localDbPath);
  }

  const migrations = [
    `ALTER TABLE orders ADD COLUMN razorpay_order_id TEXT`,
    `ALTER TABLE orders ADD COLUMN razorpay_payment_id TEXT`,
    `ALTER TABLE orders ADD COLUMN paid_at TEXT`,
  ];

  for (const sql of migrations) {
    try {
      await db.execute(sql);
      console.log('Ran:', sql);
    } catch (err) {
      if (err.message?.includes('duplicate column name') || err.message?.includes('already exists')) {
        console.log('Column already exists, skipping:', sql);
      } else {
        throw err;
      }
    }
  }
  console.log('Migration complete.');
}

migrate().catch(console.error);
