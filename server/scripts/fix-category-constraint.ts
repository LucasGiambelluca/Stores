import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars before importing db
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { sql } from '../src/db/drizzle.js';

async function main() {
  console.log('🔄 Fixing category constraints...');

  try {
    // 1. Drop the existing global unique constraint on slug
    console.log('  Dropping constraint categories_slug_key...');
    await sql`ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_key`;

    // 2. Drop the index if it exists separately (sometimes constraints create implicit indexes)
    console.log('  Dropping index categories_slug_key if exists...');
    await sql`DROP INDEX IF EXISTS categories_slug_key`;

    // 3. Create new composite unique index
    console.log('  Creating new unique index on (store_id, slug)...');
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_store_slug ON categories (store_id, slug)`;

    console.log('✅ Successfully updated category constraints!');
  } catch (error) {
    console.error('❌ Error fixing constraints:', error);
  } finally {
    process.exit(0);
  }
}

main();
