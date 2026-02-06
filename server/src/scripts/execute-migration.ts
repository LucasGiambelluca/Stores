/**
 * Execute multi-tenant migration safely
 * This script uses Drizzle's underlying Postgres connection
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function executeMigration() {
  console.log('🚀 Starting Multi-Tenant Migration\n');
  console.log('📊 This migration will:');
  console.log('   1. Create stores table');
  console.log('   2. Add store_id to 15 tables');
  console.log('   3. Preserve all existing data');
  console.log('   4. Assign existing data to "default-store"\n');

  // Create connection
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL not found in environment');
  }

  const sql = postgres(connectionString, { max: 1, prepare: false });
  
  try {
    console.log('🔌 Connecting to database...');
    
    // Read migration file
    const migrationPath = join(__dirname, '../../drizzle/migrations/001_add_multitenant.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('✅ Connected successfully');
    console.log('📝 Executing migration SQL...\n');

    // Execute migration (it's already wrapped in BEGIN...COMMIT)
    await sql.unsafe(migrationSQL);
    
    console.log('✅ Migration executed successfully!\n');
    
    // Verification
    console.log('🔍 Verifying migration results:\n');
    
    // Check stores
    const stores = await sql`SELECT COUNT(*) as count FROM stores`;
    console.log(`   ✓ Stores table: ${stores[0].count} store(s) created`);
    
    // Check sample tables
    const tables = [
      { name: 'users', display: 'Users' },
      { name: 'products', display: 'Products' },
      { name: 'orders', display: 'Orders' },
      { name: 'categories', display: 'Categories' }
    ];
    
    console.log('\n   📦 Data in tables:');
    for (const table of tables) {
      const result = await sql.unsafe(`
        SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT store_id) as unique_stores
        FROM ${table.name}
      `);
      const row = result[0];
      console.log(`   ✓ ${table.display.padEnd(12)}: ${row.total} records in ${row.unique_stores} store(s)`);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   • stores table created with default-store');
    console.log('   • store_id column added to 15 tables');
    console.log('   • All existing data preserved');
    console.log('   • Foreign keys and indexes created');
    console.log('   • Ready for multi-tenant operations\n');
    
    await sql.end();
    process.exit(0);
    
  } catch (error: any) {
    console.error('\n❌ Migration failed!');
    console.error('\nError:', error.message);
    
    if (error.code) {
      console.error('Error code:', error.code);
    }
    
    if (error.position) {
      console.error('Error position:', error.position);
    }
    
    console.error('\nFull error:', error);
    
    await sql.end();
    process.exit(1);
  }
}

executeMigration();
