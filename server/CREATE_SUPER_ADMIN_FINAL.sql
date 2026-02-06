-- ===================================================
-- CREAR SUPER ADMIN EN SCHEMA EXISTENTE
-- ===================================================

-- Paso 1: Ver si ya hay stores
SELECT id, name, owner_email FROM stores LIMIT 5;

-- Paso 2: Crear store si no existe
INSERT INTO stores (
    id, 
    name, 
    domain, 
    status, 
    plan, 
    owner_email,
    owner_name,
    created_at,
    updated_at
)
VALUES (
    'store-mothership',
    'Mothership Central',
    'mothership.local',
    'active',
    'enterprise',
    'admin@mothership.com',
    'Mothership Admin',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Paso 3: Eliminar usuario admin si existe
DELETE FROM users WHERE email = 'admin@mothership.com';

-- Paso 4: Crear super_admin user
INSERT INTO users (
    id,
    email,
    password,
    name,
    role,
    store_id,
    created_at,
    updated_at,
    force_password_change
)
VALUES (
    'user-superadmin-001',
    'admin@mothership.com',
    '$2a$10$4aUd1pnUB2G/7PoIG8OPyusMZh2kSld747Q5bzidnOBZMErksdFjq',
    'Mothership Admin',
    'super_admin',
    'store-mothership',
    NOW(),
    NOW(),
    FALSE
);

-- Paso 5: Verificar
SELECT 
    '✅ SUPER ADMIN CREADO EXITOSAMENTE' as mensaje,
    id,
    email,
    'admin123' as password,
    name,
    role,
    store_id
FROM users 
WHERE role = 'super_admin';
