-- Protected reader metadata and sessions. Originals remain private in R2.
ALTER TABLE shop_products ADD COLUMN content_type TEXT NOT NULL DEFAULT 'download'
  CHECK (content_type IN ('download','reader'));
ALTER TABLE shop_products ADD COLUMN reader_page_count INTEGER NOT NULL DEFAULT 0
  CHECK (reader_page_count >= 0);

CREATE TABLE shop_reader_sessions (
  session_hash TEXT PRIMARY KEY,
  telegram_id TEXT NOT NULL REFERENCES shop_users(telegram_id),
  order_id INTEGER NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  product_key TEXT NOT NULL REFERENCES shop_products(product_key),
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);
CREATE INDEX idx_shop_reader_sessions_expiry ON shop_reader_sessions(expires_at);

CREATE TABLE shop_reader_access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,
  order_id INTEGER NOT NULL,
  product_key TEXT NOT NULL,
  page_number INTEGER,
  event TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_shop_reader_logs_product ON shop_reader_access_logs(product_key, created_at DESC);
CREATE INDEX idx_shop_reader_logs_user ON shop_reader_access_logs(telegram_id, created_at DESC);
