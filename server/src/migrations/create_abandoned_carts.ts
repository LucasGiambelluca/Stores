import 'dotenv/config';
import { db } from '../db/drizzle.js';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('🚀 Running migration: Create abandoned_carts table...');

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS abandoned_carts (
        id uuid PRIMARY KEY,
        store_id uuid NOT NULL REFERENCES stores(id),
        customer_email text,
        items jsonb NOT NULL,
        total integer NOT NULL,
        status text DEFAULT 'active',
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
    `);
    console.log('✅ Migration successful');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }

  process.exit(0);
}

migrate();
