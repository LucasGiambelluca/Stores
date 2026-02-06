-- SCRIPT SIMPLIFICADO PARA SUPABASE - SOLO LO ESENCIAL
-- Copia y pega TODO esto en Supabase SQL Editor

-- =================================================
-- PASO 1: CREAR TABLA USERS
-- =================================================
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'customer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    force_password_change BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMPTZ
);

-- =================================================
-- PASO 2: CREAR TABLA STORES
-- =================================================
CREATE TABLE IF NOT EXISTS stores (
    id BIGSERIAL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    domain TEXT UNIQUE,
    plan TEXT DEFAULT 'free',
    status TEXT DEFAULT 'trial',
    license_key TEXT,
    last_check_in TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================
-- PASO 3: CREAR TABLA LICENSES
-- =================================================
CREATE TABLE IF NOT EXISTS licenses (
    id BIGSERIAL PRIMARY KEY,
    serial VARCHAR(20) UNIQUE NOT NULL,
    plan VARCHAR(20) NOT NULL DEFAULT 'free',
    status VARCHAR(20) NOT NULL DEFAULT 'generated',
    store_id BIGINT REFERENCES stores(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ,
    max_products INTEGER,
    max_orders INTEGER,
    owner_email VARCHAR(255),
    owner_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    activated_at TIMESTAMPTZ,
    last_check_in TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_licenses_serial ON licenses(serial);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);

-- =================================================
-- PASO 4: CREAR STORE_CONFIG
-- =================================================
CREATE TABLE IF NOT EXISTS store_config (
    id BIGSERIAL PRIMARY KEY,
    key TEXT NOT NULL,
    value TEXT,
    store_id BIGINT REFERENCES stores(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(key, store_id)
);

-- =================================================
-- PASO 5: CREAR SUPER ADMIN
-- =================================================

-- Primero eliminar si existe
DELETE FROM users WHERE email = 'admin@mothership.com';

-- Ahora insertar
INSERT INTO users (email, password, name, role, created_at, updated_at)
VALUES (
    'admin@mothership.com',
    '$2a$10$4aUd1pnUB2G/7PoIG8OPyusMZh2kSld747Q5bzidnOBZMErksdFjq',
    'Mothership Admin',
    'super_admin',
    NOW(),
    NOW()
);

-- =================================================
-- PASO 6: CREAR TIENDA POR DEFECTO
-- =================================================
INSERT INTO stores (slug, name, status, plan, created_at, updated_at)
VALUES ('tiendita', 'Tiendita Demo', 'active', 'free', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- =================================================
-- VERIFICACIÓN
-- =================================================
SELECT 
    '✅ SETUP COMPLETADO!' as mensaje,
    (SELECT COUNT(*) FROM users WHERE role = 'super_admin') as super_admins,
    (SELECT COUNT(*) FROM stores) as tiendas,
    (SELECT COUNT(*) FROM licenses) as licencias;

SELECT 
    '🔑 CREDENCIALES SUPER ADMIN:' as info,
    email,
    'admin123' as password,
    role
FROM users 
WHERE role = 'super_admin';
