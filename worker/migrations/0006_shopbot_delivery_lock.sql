-- Delivery lease prevents simultaneous admin callbacks from sending duplicate files.
CREATE TABLE shop_delivery_locks (
  order_id INTEGER PRIMARY KEY REFERENCES shop_orders(id) ON DELETE CASCADE,
  lock_token TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_shop_delivery_locks_expiry ON shop_delivery_locks(expires_at);
