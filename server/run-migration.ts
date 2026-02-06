import 'dotenv/config';
import { db } from './src/db/drizzle.js';
import { sql } from 'drizzle-orm';
import fs from 'fs';

async function runMigration() {
  try {
    console.log('Running migration...');
    const sqlContent = fs.readFileSync('./add-analytics-columns.sql', 'utf-8');
    
    // Split by semicolon to run multiple statements if needed, but execute allows multiple
    await db.execute(sql.raw(sqlContent));
    
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
