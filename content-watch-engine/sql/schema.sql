CREATE TYPE relevance_status AS ENUM ('true', 'false', 'error');

CREATE TABLE IF NOT EXISTS processed_items (
  item_id      TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  source_name  TEXT NOT NULL,
  input_plugin TEXT NOT NULL,
  relevant     relevance_status NOT NULL,
  reason       TEXT NOT NULL,
  output       TEXT NOT NULL,
  error_detail TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processed_items_input  ON processed_items(input_plugin);
CREATE INDEX IF NOT EXISTS idx_processed_items_status ON processed_items(relevant);

CREATE TABLE IF NOT EXISTS subscription_log (
  id           SERIAL PRIMARY KEY,
  input_plugin TEXT NOT NULL,
  source_id    TEXT NOT NULL,
  status       TEXT NOT NULL,
  message      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
