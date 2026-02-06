-- Verificar schema de tabla licenses
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'licenses'
ORDER BY ordinal_position;
