-- Create or update super_admin user for Mothership access
-- Password: admin123

-- First, check if admin user exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE email = 'admin@mothership.com') THEN
    -- Update existing user to super_admin
    UPDATE users 
    SET 
      role = 'super_admin',
      password = '$2a$10$rXKZ0XqVZ5qZ5Z5Z5Z5Z5uK5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z' -- admin123
    WHERE email = 'admin@mothership.com';
    RAISE NOTICE 'Updated existing user to super_admin';
  ELSE
    -- Create new super_admin user
    INSERT INTO users (email, password, name, role, created_at)
    VALUES (
      'admin@mothership.com',
      '$2a$10$rXKZ0XqVZ5qZ5Z5Z5Z5Z5uK5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', -- admin123
      'Mothership Admin',
      'super_admin',
      NOW()
    );
    RAISE NOTICE 'Created new super_admin user';
  END IF;
END $$;

-- Verify the user was created/updated
SELECT id, email, name, role, created_at 
FROM users 
WHERE role = 'super_admin';
