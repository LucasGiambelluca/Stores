-- Cleanup script to remove old audit_logs table
-- This table is not in the current schema and will be removed

DROP TABLE IF EXISTS audit_logs CASCADE;
