import 'dotenv/config';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function runMigration() {
  console.log('Running migration: 004_add_reset_token.sql');
  
  try {
    // Add reset_token column if not exists
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token text`;
    console.log('✅ Added reset_token column');
    
    // Add reset_token_expires_at column if not exists
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires_at timestamp`;
    console.log('✅ Added reset_token_expires_at column');
    
    // Create index if not exists
    await sql`CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token)`;
    console.log('✅ Created index on reset_token');
    
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await sql.end();
  }
}

runMigration();
