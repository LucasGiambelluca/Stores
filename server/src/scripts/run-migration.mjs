/**
 * Run the multi-tenant migration using Drizzle
 * This script executes the SQL migration to add store_id to all tables
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function runMigration() {
  try {
    console.log('🔌 Connecting to database...');
    console.log('✅ Using Drizzle ORM connection');

    // Read migration SQL
    const migrationPath = join(process.cwd(), 'drizzle/migrations/001_add_multitenant.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('\n📝 Running migration: 001_add_multitenant.sql');
    console.log('⏳ This may take a moment...\n');

    // Split by semicolons and execute each statement
    // (Drizzle doesn't support multi-statement queries directly)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.toUpperCase().includes('SELECT')) {
        // Skip verification queries for now
        continue;
      }
      try {
        await db.execute(sql.raw(statement));
        console.log(`  ✓ Statement ${i + 1}/${statements.length} executed`);
      } catch (error) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`  ⚠ Statement ${i + 1} skipped (already exists)`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ Migration completed!');

    // Verification queries
    console.log('\n🔍 Verifying migration...');

    // Check stores table
    const storesResult = await db.execute(sql`SELECT COUNT(*) as count FROM stores`);
    console.log(`  ✓ Stores table: ${storesResult.rows[0].count} stores`);

    // Check a few tables for store_id column
    const tables = ['users', 'products', 'orders', 'categories'];
    for (const table of tables) {
      const result = await db.execute(sql.raw(`
        SELECT COUNT(*) as total, COUNT(DISTINCT store_id) as stores 
        FROM ${table}
      `));
      console.log(`  ✓ ${table}: ${result.rows[0].total} records, ${result.rows[0].stores} stores`);
    }

    console.log('\n🎉 Multi-tenant migration completed and verified!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nError details:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

runMigration();
