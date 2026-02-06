-- Script to manually update database schema
-- Adds missing columns to store_config table

-- Add setup_completed column if it doesn't exist
ALTER TABLE store_config 
ADD COLUMN IF NOT EXISTS setup_completed boolean DEFAULT false;

-- Add updated_at column if it doesn't exist  
ALTER TABLE store_config 
ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT CURRENT_TIMESTAMP;

-- Add force_password_change column to users table if it doesn't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS force_password_change boolean DEFAULT false;

-- Create saas_settings table if it doesn't exist (optional for now)
CREATE TABLE IF NOT EXISTS saas_settings (
  id text PRIMARY KEY,
  license_key text,
  central_api_url text,
  status text DEFAULT 'active',
  last_check_in timestamp,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);
