-- ============================================
-- MIGRATION: Convert TEXT fields to JSONB
-- ============================================
-- Date: 2026-01-21
-- Description: Migrate JSON-stored-as-text fields to native JSONB
-- Benefits: Better indexing, validation, query capabilities
--
-- IMPORTANT: Run this migration during low traffic!
-- The ALTER COLUMN operations with USING will lock the table briefly.
-- ============================================

-- Start transaction for safety
BEGIN;

-- ============================================
-- 1. PRODUCTS TABLE
-- ============================================

-- Convert images column (array of strings)
ALTER TABLE products 
  ALTER COLUMN images TYPE jsonb 
  USING CASE 
    WHEN images IS NULL THEN NULL 
    WHEN images = '' THEN '[]'::jsonb
    ELSE images::jsonb 
  END;

-- Convert sizes column (array of strings)
ALTER TABLE products 
  ALTER COLUMN sizes TYPE jsonb 
  USING CASE 
    WHEN sizes IS NULL THEN NULL 
    WHEN sizes = '' THEN '[]'::jsonb
    ELSE sizes::jsonb 
  END;

-- Convert colors column (array of strings)
ALTER TABLE products 
  ALTER COLUMN colors TYPE jsonb 
  USING CASE 
    WHEN colors IS NULL THEN NULL 
    WHEN colors = '' THEN '[]'::jsonb
    ELSE colors::jsonb 
  END;

-- ============================================
-- 2. ORDERS TABLE
-- ============================================

-- Convert shippingAddress column (object)
ALTER TABLE orders 
  ALTER COLUMN shipping_address TYPE jsonb 
  USING CASE 
    WHEN shipping_address IS NULL THEN NULL 
    WHEN shipping_address = '' THEN NULL
    ELSE shipping_address::jsonb 
  END;

-- ============================================
-- 3. SHIPMENTS TABLE
-- ============================================

-- Convert carrierResponse column (object)
ALTER TABLE shipments 
  ALTER COLUMN carrier_response TYPE jsonb 
  USING CASE 
    WHEN carrier_response IS NULL THEN NULL 
    WHEN carrier_response = '' THEN NULL
    ELSE carrier_response::jsonb 
  END;

-- ============================================
-- 4. STORE_CONFIG TABLE
-- ============================================

-- Convert value column (can be any JSON)
ALTER TABLE store_config 
  ALTER COLUMN value TYPE jsonb 
  USING CASE 
    WHEN value IS NULL THEN NULL 
    WHEN value = '' THEN 'null'::jsonb
    ELSE value::jsonb 
  END;

-- ============================================
-- 5. ADD UPDATED_AT TRIGGER FUNCTION
-- ============================================

-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to products table
DROP TRIGGER IF EXISTS set_updated_at_products ON products;
CREATE TRIGGER set_updated_at_products
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to orders table
DROP TRIGGER IF EXISTS set_updated_at_orders ON orders;
CREATE TRIGGER set_updated_at_orders
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to stores table
DROP TRIGGER IF EXISTS set_updated_at_stores ON stores;
CREATE TRIGGER set_updated_at_stores
    BEFORE UPDATE ON stores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to shipments table
DROP TRIGGER IF EXISTS set_updated_at_shipments ON shipments;
CREATE TRIGGER set_updated_at_shipments
    BEFORE UPDATE ON shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to store_config table
DROP TRIGGER IF EXISTS set_updated_at_store_config ON store_config;
CREATE TRIGGER set_updated_at_store_config
    BEFORE UPDATE ON store_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to saas_settings table
DROP TRIGGER IF EXISTS set_updated_at_saas_settings ON saas_settings;
CREATE TRIGGER set_updated_at_saas_settings
    BEFORE UPDATE ON saas_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the migration worked:

-- Check product jsonb columns
-- SELECT id, name, jsonb_typeof(images), jsonb_typeof(sizes), jsonb_typeof(colors) 
-- FROM products LIMIT 5;

-- Check order jsonb
-- SELECT id, order_number, jsonb_typeof(shipping_address) 
-- FROM orders WHERE shipping_address IS NOT NULL LIMIT 5;

-- Verify triggers exist
-- SELECT trigger_name, event_object_table 
-- FROM information_schema.triggers 
-- WHERE trigger_name LIKE 'set_updated_at%';
