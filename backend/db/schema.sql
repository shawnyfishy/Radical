-- RADICAL E-Commerce Database Schema

CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  email       TEXT    NOT NULL UNIQUE,
  password    TEXT    NOT NULL,
  role        TEXT    NOT NULL DEFAULT 'customer',  -- 'customer' | 'admin'
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS addresses (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  line1       TEXT NOT NULL,
  line2       TEXT,
  city        TEXT NOT NULL,
  state       TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country     TEXT NOT NULL DEFAULT 'IN',
  phone       TEXT,
  is_default  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  slug         TEXT    NOT NULL UNIQUE,
  description  TEXT,
  category     TEXT    NOT NULL,  -- 'rings' | 'pendants' | 'bracelets' | 'limited'
  price        REAL    NOT NULL,
  compare_price REAL,             -- original price for sale display
  images       TEXT    NOT NULL DEFAULT '[]',  -- JSON array of image paths
  material     TEXT,
  weight_grams REAL,
  is_active    INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS variants (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label       TEXT    NOT NULL,   -- e.g. "Size 10", "Large"
  sku         TEXT    NOT NULL UNIQUE,
  stock       INTEGER NOT NULL DEFAULT 0,
  price_delta REAL    NOT NULL DEFAULT 0  -- added to base price
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT    PRIMARY KEY,  -- UUID for guest carts
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cart_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_id  TEXT    REFERENCES sessions(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id  INTEGER REFERENCES variants(id) ON DELETE SET NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  added_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  guest_email     TEXT,
  session_id      TEXT,
  status          TEXT    NOT NULL DEFAULT 'pending',  -- pending|confirmed|shipped|delivered|cancelled
  subtotal        REAL    NOT NULL,
  shipping_cost   REAL    NOT NULL DEFAULT 0,
  total           REAL    NOT NULL,
  shipping_address TEXT   NOT NULL,  -- JSON snapshot of address at time of order
  notes           TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id   INTEGER REFERENCES variants(id) ON DELETE SET NULL,
  product_name TEXT    NOT NULL,  -- snapshot
  variant_label TEXT,             -- snapshot
  quantity     INTEGER NOT NULL,
  unit_price   REAL    NOT NULL   -- snapshot of price at purchase
);
