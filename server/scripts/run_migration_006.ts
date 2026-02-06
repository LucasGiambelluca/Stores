import 'dotenv/config';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);

async function runMigration() {
  try {
    console.log('Running migration steps manually...');
    
    // Split by double newlines to separate blocks roughly
    // This is hacky but might work for this specific file structure
    // Better: split by specific comments or just hardcode the steps here for debugging
    
    console.log('1. Creating landing_config...');
    await sql`
      CREATE TABLE IF NOT EXISTS landing_config (
        id INTEGER PRIMARY KEY DEFAULT 1,
        content JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        updated_by TEXT REFERENCES users(id)
      );
    `;
    
    console.log('2. Adding layout_config column...');
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_name = 'product_page_config'
              AND column_name = 'layout_config'
          ) THEN
              ALTER TABLE product_page_config
              ADD COLUMN layout_config JSONB DEFAULT NULL;
          END IF;
      END $$;
    `;

    console.log('3. Creating product_page_config...');
    await sql`
      CREATE TABLE IF NOT EXISTS product_page_config (
        id TEXT PRIMARY KEY,
        store_id TEXT UNIQUE NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        blocks JSONB DEFAULT '[]'::jsonb,
        global_styles JSONB DEFAULT '{}'::jsonb,
        layout_config JSONB DEFAULT NULL,
        is_enabled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    console.log('4. Enabling RLS...');
    await sql`ALTER TABLE landing_config ENABLE ROW LEVEL SECURITY;`;
    
    console.log('5. Creating policies...');
    // We need to drop policies if they exist to avoid errors, or use DO block
    // For now, let's just try to create them and ignore error if they exist (or use IF NOT EXISTS logic which is hard in SQL for policies)
    // Postgres doesn't support CREATE POLICY IF NOT EXISTS directly.
    
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'landing_config' AND policyname = 'Public read access for landing config') THEN
          CREATE POLICY "Public read access for landing config" ON landing_config FOR SELECT USING (true);
        END IF;
      END $$;
    `;

    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'landing_config' AND policyname = 'Admins can update landing config') THEN
          CREATE POLICY "Admins can update landing config" ON landing_config FOR UPDATE USING (
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('admin', 'super_admin'))
          );
        END IF;
      END $$;
    `;

    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'landing_config' AND policyname = 'Admins can insert landing config') THEN
          CREATE POLICY "Admins can insert landing config" ON landing_config FOR INSERT WITH CHECK (
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('admin', 'super_admin'))
          );
        END IF;
      END $$;
    `;
    
    console.log('✅ Migration 006 executed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sql.end();
  }
}

runMigration();
