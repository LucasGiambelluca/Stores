import postgres from 'postgres';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function applyMigration() {
  try {
    console.log('🔧 Applying licenses migration...\n');
    
    const sqlScript = fs.readFileSync(
      join(__dirname, 'drizzle', 'migrations', '002_run_in_supabase.sql'),
      'utf-8'
    );
    
    // Execute the SQL script
    await sql.unsafe(sqlScript);
    
    console.log('✅ Migration applied successfully!\n');
    
    // Verify the changes
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('licenses', 'stores')
      ORDER BY table_name
    `;
    
    console.log('📋 Verified tables:');
    result.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    // Check licenses count
    const [{ count }] = await sql`SELECT COUNT(*) as count FROM licenses`;
    console.log(`\n📊 Licenses in database: ${count}`);
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyMigration();
