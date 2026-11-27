-- First-party, consent-based, pseudonymous storefront analytics.
CREATE TABLE analytics_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  event TEXT NOT NULL CHECK (event IN ('page_view','product_view','add_to_cart','begin_checkout','telegram_click')),
  page TEXT NOT NULL,
  product TEXT,
  source TEXT NOT NULL DEFAULT 'direct',
  campaign TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_analytics_created ON analytics_events (created_at DESC);
CREATE INDEX idx_analytics_session_event ON analytics_events (session_id, event, created_at);
CREATE INDEX idx_analytics_product_event ON analytics_events (product, event, created_at);
