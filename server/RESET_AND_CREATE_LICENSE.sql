-- =====================================================
-- RESET STORE AND CREATE LICENSE
-- Execute in Supabase SQL Editor
-- =====================================================

-- 1. Clear store configuration (mark as not configured)
DELETE FROM store_config WHERE key IN ('is_configured', 'license_key', 'license_status', 'license_plan');

-- 2. Reset store status
UPDATE stores SET 
  license_key = NULL, 
  plan = NULL, 
  status = 'pending'
WHERE id = (SELECT id FROM stores LIMIT 1);

-- 3. Reset all existing licenses to 'generated' (not activated)
UPDATE licenses SET 
  status = 'generated', 
  store_id = NULL, 
  activated_at = NULL
WHERE status = 'activated';

-- 4. Create a new PRO license (lifetime)
INSERT INTO licenses (serial, plan, status, max_products, max_orders, expires_at, owner_name, notes, created_at)
VALUES (
  'TND-PRO1-LIFE-2024', 
  'pro', 
  'generated', 
  1000, 
  NULL,
  NULL,
  'Lucas',
  'License PRO lifetime created for testing',
  NOW()
);

-- 5. Verify reset completed
SELECT 'STORE CONFIG' as section, key, value FROM store_config WHERE key LIKE 'is_configured' OR key LIKE 'license%'
UNION ALL
SELECT 'STORES', name, status FROM stores
UNION ALL  
SELECT 'NEW LICENSE', serial, status FROM licenses WHERE serial = 'TND-PRO1-LIFE-2024';
