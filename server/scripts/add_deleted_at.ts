
import 'dotenv/config';
import { db } from '../src/db/drizzle.js';
import { sql } from 'drizzle-orm';

async function addDeletedAt() {
  try {
    console.log('🔄 Adding deletedAt column to stores table...');
    
    await db.execute(sql`
      ALTER TABLE stores 
      ADD COLUMN IF NOT EXISTS deleted_at timestamp;
    `);
    
    console.log('✅ Column added successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding column:', error);
    process.exit(1);
  }
}

addDeletedAt();
