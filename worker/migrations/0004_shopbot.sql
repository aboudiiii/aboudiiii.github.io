-- ShopBot Cloudflare migration foundation.
-- Separate shop_* tables keep the existing website order/account schema untouched.
CREATE TABLE shop_users (
  telegram_id TEXT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  language TEXT NOT NULL DEFAULT 'ar' CHECK (language IN ('ar','en')),
  country TEXT,
  selected_items TEXT NOT NULL DEFAULT '[]',
  paper_size TEXT NOT NULL DEFAULT 'A4' CHECK (paper_size IN ('A4','Letter','both')),
  active_mode TEXT NOT NULL DEFAULT '',
  referral_code TEXT,
  coupon_code TEXT,
  blocked INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE shop_products (
  product_key TEXT PRIMARY KEY,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ar TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  price_usd_cents INTEGER NOT NULL CHECK (price_usd_cents >= 0),
  file_a4_key TEXT,
  file_letter_key TEXT,
  file_single_key TEXT,
  cover_key TEXT,
  is_single INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE TABLE shop_coupons (
  code TEXT PRIMARY KEY,
  percent INTEGER NOT NULL CHECK (percent BETWEEN 1 AND 90),
  max_uses INTEGER NOT NULL DEFAULT -1,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  created_by TEXT
);

CREATE TABLE shop_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL REFERENCES shop_users(telegram_id),
  items_json TEXT NOT NULL,
  paper_size TEXT NOT NULL DEFAULT 'A4',
  subtotal_usd_cents INTEGER NOT NULL,
  discount_usd_cents INTEGER NOT NULL DEFAULT 0,
  total_usd_cents INTEGER NOT NULL,
  currency_country TEXT,
  referral_code TEXT,
  coupon_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','review','approved','rejected','cancelled','delivery_failed')),
  receipt_file_id TEXT,
  receipt_file_unique_id TEXT,
  receipt_caption TEXT,
  payment_method TEXT,
  downloads INTEGER NOT NULL DEFAULT 0,
  reminder_sent_at INTEGER,
  review_requested_at INTEGER,
  rating INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  approved_at INTEGER,
  approved_by TEXT,
  rejection_reason TEXT,
  delivery_error TEXT,
  legacy_order_code TEXT UNIQUE
);
CREATE INDEX idx_shop_orders_user ON shop_orders(telegram_id, created_at DESC);
CREATE INDEX idx_shop_orders_status ON shop_orders(status, created_at);
CREATE INDEX idx_shop_orders_created ON shop_orders(created_at DESC);

CREATE TABLE shop_order_items (
  order_id INTEGER NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  product_key TEXT NOT NULL REFERENCES shop_products(product_key),
  unit_price_usd_cents INTEGER NOT NULL,
  PRIMARY KEY (order_id, product_key)
);

CREATE TABLE shop_delivery_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  product_key TEXT NOT NULL,
  attempt_no INTEGER NOT NULL,
  telegram_message_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('started','sent','failed')),
  error TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE(order_id, product_key, attempt_no)
);

CREATE TABLE shop_support_links (
  owner_message_id TEXT PRIMARY KEY,
  telegram_id TEXT NOT NULL REFERENCES shop_users(telegram_id),
  customer_message_id TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE shop_samples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL REFERENCES shop_users(telegram_id),
  sample_key TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_shop_samples_user ON shop_samples(telegram_id, created_at DESC);

CREATE TABLE shop_rate_limits (
  telegram_id TEXT NOT NULL,
  bucket TEXT NOT NULL,
  event_count INTEGER NOT NULL DEFAULT 0,
  window_started_at INTEGER NOT NULL,
  PRIMARY KEY (telegram_id, bucket)
);

CREATE TABLE shop_webhook_updates (
  update_id INTEGER PRIMARY KEY,
  processed_at INTEGER NOT NULL
);

CREATE TABLE shop_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
