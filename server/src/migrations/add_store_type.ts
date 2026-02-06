import 'dotenv/config';
import { db } from '../db/drizzle.js';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('🚀 Running migration: Add type to stores...');

  try {
    await db.execute(sql`
      ALTER TABLE stores 
      ADD COLUMN IF NOT EXISTS type text DEFAULT 'retail';
    `);
    console.log('✅ Migration successful');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }

  process.exit(0);
}

migrate();
