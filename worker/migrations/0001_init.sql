-- Hayali library database (Cloudflare D1 / SQLite)

CREATE TABLE feedback (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('rating','comment')),
  product TEXT,
  rating INTEGER,
  name TEXT,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','removed')),
  created_at INTEGER NOT NULL,
  decided_at INTEGER
);
CREATE INDEX idx_feedback_public ON feedback (status, kind, created_at DESC);

CREATE TABLE orders (
  code TEXT PRIMARY KEY,
  email TEXT,
  telegram_id TEXT,
  total_usd REAL,
  paid_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_orders_email ON orders (email);

CREATE TABLE order_items (
  code TEXT NOT NULL REFERENCES orders (code) ON DELETE CASCADE,
  product TEXT NOT NULL,
  PRIMARY KEY (code, product)
);
CREATE INDEX idx_items_product ON order_items (product);

CREATE TABLE subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL CHECK (channel IN ('email','telegram')),
  address TEXT NOT NULL,
  confirmed INTEGER NOT NULL DEFAULT 0,
  token TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (channel, address)
);
CREATE UNIQUE INDEX idx_subscribers_token ON subscribers (token);

CREATE TABLE announcements (
  id TEXT PRIMARY KEY,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sending','done','cancelled')),
  emailed INTEGER NOT NULL DEFAULT 0,
  tg_offset INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE login_codes (
  email TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_at INTEGER NOT NULL
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE rate (
  k TEXT PRIMARY KEY,
  n INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
