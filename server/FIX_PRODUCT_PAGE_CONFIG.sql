-- Run this in Supabase SQL Editor
-- Creates product_page_config table without restrictive RLS

-- Drop existing policies if they exist (they may be blocking access)
DROP POLICY IF EXISTS "Store owners can read their product page config" ON product_page_config;
DROP POLICY IF EXISTS "Store admins can update their product page config" ON product_page_config;
DROP POLICY IF EXISTS "Store admins can insert their product page config" ON product_page_config;
DROP POLICY IF EXISTS "Super admins have full access to product page config" ON product_page_config;

-- Create table if not exists
CREATE TABLE IF NOT EXISTS product_page_config (
  id TEXT PRIMARY KEY,
  store_id TEXT UNIQUE NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  blocks JSONB DEFAULT '[]'::jsonb,
  global_styles JSONB DEFAULT '{}'::jsonb,
  is_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_product_page_config_store ON product_page_config(store_id);

-- Disable RLS since backend uses service role key with its own JWT auth
ALTER TABLE product_page_config DISABLE ROW LEVEL SECURITY;

-- Verify table exists
SELECT 'product_page_config table ready' AS status;
