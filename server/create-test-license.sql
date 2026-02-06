-- Create a test license for testing
-- Run this in Supabase SQL Editor or use: psql with your connection string

INSERT INTO licenses (
  serial,
  plan,
  status,
  store_id,
  expires_at,
  max_products,
  max_orders,
  owner_email,
  owner_name,
  notes,
  created_at
) VALUES (
  'TND-TEST-1234-ABCD',
  'pro',
  'generated',
  NULL,
  NOW() + INTERVAL '1 year',
  1000,
  NULL,
  'test@tiendita.com',
  'Test User',
  'Manual test license',
  NOW()
)
ON CONFLICT (serial) DO NOTHING
RETURNING *;
