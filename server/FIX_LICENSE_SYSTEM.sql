-- =====================================================
-- FIX LICENSE SYSTEM - Diagnóstico y Corrección
-- =====================================================
-- Ejecutar estos queries en el SQL Editor de Supabase
-- =====================================================

-- 1. DIAGNÓSTICO: Ver estado actual de store_config
SELECT key, value, store_id, updated_at 
FROM store_config 
WHERE key IN ('store_name', 'is_configured', 'license_key', 'license_status', 'license_plan')
ORDER BY key;

-- 2. DIAGNÓSTICO: Ver tiendas existentes
SELECT id, name, slug, status, license_key, plan 
FROM stores;

-- 3. DIAGNÓSTICO: Ver licencias existentes
SELECT serial, plan, status, store_id, expires_at, max_products, max_orders, created_at 
FROM licenses;

-- =====================================================
-- CORRECCIONES (Solo ejecutar si es necesario)
-- =====================================================

-- 4. CORRECCIÓN: Marcar tienda como configurada (si falta is_configured)
-- Descomentar y ejecutar si is_configured no existe o es 'false'
/*
INSERT INTO store_config (key, value, store_id, updated_at)
SELECT 'is_configured', 'true', id, NOW()
FROM stores
LIMIT 1
ON CONFLICT (key, store_id) DO UPDATE SET value = 'true', updated_at = NOW();
*/

-- 5. CORRECCIÓN: Crear licencia de prueba PRO (lifetime)
-- Descomentar y ejecutar si no hay licencias
/*
INSERT INTO licenses (serial, plan, status, max_products, max_orders, expires_at, created_at)
VALUES (
  'TND-TEST-DEMO-0001', 
  'pro', 
  'generated', 
  1000, 
  NULL,
  NULL,
  NOW()
);
*/

-- 6. CORRECCIÓN: Crear licencia TRIAL (7 días)
-- Descomentar y ejecutar para crear licencia trial
/*
INSERT INTO licenses (serial, plan, status, max_products, max_orders, expires_at, created_at)
VALUES (
  'TND-TRIAL-7DAY-0001', 
  'trial', 
  'generated', 
  5, 
  10,
  NOW() + INTERVAL '7 days',
  NOW()
);
*/

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- 7. Verificar que todo esté correcto
SELECT 
  (SELECT COUNT(*) FROM stores WHERE status = 'active') as active_stores,
  (SELECT COUNT(*) FROM licenses) as total_licenses,
  (SELECT COUNT(*) FROM licenses WHERE status = 'generated') as available_licenses,
  (SELECT COUNT(*) FROM licenses WHERE status = 'activated') as activated_licenses,
  (SELECT value FROM store_config WHERE key = 'is_configured' LIMIT 1) as is_configured;
