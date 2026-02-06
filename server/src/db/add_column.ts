import 'dotenv/config';
import { sql } from './drizzle.js';

async function main() {
  console.log('Adding layout_config column...');
  try {
    await sql`ALTER TABLE product_page_config ADD COLUMN IF NOT EXISTS layout_config JSONB`;
    console.log('✅ Column added successfully');
  } catch (error) {
    console.error('❌ Error adding column:', error);
  }
  process.exit(0);
}

main();
