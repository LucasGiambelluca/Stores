-- Test: Crear licencia manualmente
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
)
VALUES (
    'TND-TEST-0001-AAAA',
    'enterprise',
    'generated',
    NULL,
    NULL,
    NULL,
    NULL,
    'test@example.com',
    'Test User',
    'Manual test license',
    NOW()
);

-- Verificar que se creó
SELECT * FROM licenses WHERE serial = 'TND-TEST-0001-AAAA';
