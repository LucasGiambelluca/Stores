import 'dotenv/config';
import { sql } from '../src/db/drizzle.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🔒 Applying RLS Migration...');
  
  const migrationPath = path.join(__dirname, '../drizzle/migrations/003_enable_rls.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

  try {
    // Split by semicolon to run statements individually if needed, 
    // but postgres.js usually handles multiple statements if simple.
    // However, for safety and better error reporting, let's run it as one block if possible,
    // or split it.
    // Drizzle's sql`` tag might not support multiple statements in one go depending on driver config.
    // But postgres.js does support it usually.
    
    await sql.unsafe(migrationSql);
    
    console.log('✅ RLS Migration applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
}

main();
