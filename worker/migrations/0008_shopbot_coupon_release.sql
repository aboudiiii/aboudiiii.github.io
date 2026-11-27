-- Track one-time coupon release when a pending/review order is cancelled or rejected.
ALTER TABLE shop_orders ADD COLUMN coupon_release_state INTEGER NOT NULL DEFAULT 0
  CHECK (coupon_release_state IN (0,1,2));
