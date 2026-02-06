-- ====================================================
-- PARTE 1: VERIFICAR QUÉ YA EXISTE
-- ====================================================
-- Copia SOLO esta sección primero y ejecuta para ver qué hay

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'stores', 'licenses', 'store_config')
ORDER BY table_name, ordinal_position;

-- ====================================================
-- PARTE 2: SI LA TABLA USERS YA EXISTE
-- ====================================================
-- Ejecuta esto SOLO si la tabla users ya existe

-- Actualizar un usuario existente a super_admin
UPDATE users 
SET role = 'super_admin'
WHERE email LIKE '%admin%'
  OR id = 1
LIMIT 1;

-- Ver el resultado
SELECT id, email, name, role 
FROM users 
WHERE role = 'super_admin';

-- ====================================================
-- PARTE 3: SI NO HAY USUARIOS O TABLA USERS NO EXISTE
-- ====================================================
-- Ejecuta esto SOLO si la verificación arriba mostró que NO existe users

DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS licenses CASCADE;
DROP TABLE IF EXISTS store_config CASCADE;

-- Crear tabla users desde cero
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'customer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar super admin
INSERT INTO users (email, password, name, role)
VALUES (
    'admin@mothership.com',
    '$2a$10$4aUd1pnUB2G/7PoIG8OPyusMZh2kSld747Q5bzidnOBZMErksdFjq',
    'Mothership Admin',
    'super_admin'
);

-- Verificar
SELECT * FROM users WHERE role = 'super_admin';
