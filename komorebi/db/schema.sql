CREATE TABLE IF NOT EXISTS inventory (
  product_id text PRIMARY KEY,
  stock integer NOT NULL CHECK (stock >= 0)
);
CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  owner_id text NOT NULL,
  order_code bigint NOT NULL UNIQUE,
  idempotency_key text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('CREATING','PENDING','PAID','DEMO_COMPLETE','CANCELLED','EXPIRED','FAILED')),
  mode text NOT NULL CHECK (mode IN ('demo','live')),
  amount integer NOT NULL CHECK (amount > 0),
  subtotal integer NOT NULL,
  shipping integer NOT NULL,
  customer_json text NOT NULL,
  items_json text NOT NULL,
  checkout_url text,
  payment_link_id text,
  created_at bigint NOT NULL,
  expires_at bigint NOT NULL,
  UNIQUE(owner_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS orders_owner_created ON orders(owner_id, created_at DESC);
CREATE TABLE IF NOT EXISTS payment_events (
  reference text PRIMARY KEY,
  order_id text NOT NULL REFERENCES orders(id),
  received_at bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS request_limits (
  key text PRIMARY KEY,
  window_start bigint NOT NULL,
  attempts integer NOT NULL
);
