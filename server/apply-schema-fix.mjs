// Quick script to apply schema fixes to PostgreSQL
import postgres from 'postgres';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function applySchemaFixes() {
  try {
    console.log('🔧 Applying schema fixes...');
    
    const sqlScript = fs.readFileSync('fix-schema.sql', 'utf-8');
    
    // Execute the SQL script
    await sql.unsafe(sqlScript);
    
    console.log('✅ Schema fixes applied successfully!');
    
    // Verify the changes
    const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'store_config'
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 Current store_config columns:');
    result.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Error applying schema fixes:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applySchemaFixes();
