-- Add coupon management and an audit trail without rewriting existing customer/order tables.
CREATE TABLE coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE COLLATE NOCASE,
  kind TEXT NOT NULL CHECK (kind IN ('percent','fixed')),
  value REAL NOT NULL CHECK (value > 0),
  active INTEGER NOT NULL DEFAULT 0 CHECK (active IN (0,1)),
  starts_at INTEGER,
  ends_at INTEGER,
  min_total_usd REAL NOT NULL DEFAULT 0 CHECK (min_total_usd >= 0),
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_coupons_active ON coupons (active, starts_at, ends_at);
CREATE TABLE admin_audit (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_admin_audit_created ON admin_audit (created_at DESC);
