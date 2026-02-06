import 'dotenv/config';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);

async function runMigration() {
  try {
    console.log('🔧 Fixing Widget Layout Positions...');
    const result = await sql`
      SELECT blocks, layout_config
      FROM product_page_config 
      WHERE store_id = '8f945108-4543-48be-a4c1-6a8454a427c2';
    `;
    
    if (result.length > 0) {
      const blocks = result[0].blocks || [];
      console.log('Current blocks:', blocks.map((b: any) => b.type));
      console.log('Current layout:', result[0].layout_config);
      
      // Define correct positions for each widget type
      const correctLayout = {
        gridType: 'classic',
        leftColumn: ['product-gallery'],
        rightColumn: ['product-info', 'product-buy-box', 'product-description', 'product-countdown', 'product-size-guide'],
        fullWidth: ['related-products', 'product-reviews', 'product-specs', 'product-bundles', 'product-cross-sell', 'product-video']
      };
      
      await sql`
        UPDATE product_page_config
        SET layout_config = ${sql.json(correctLayout)}
        WHERE store_id = '8f945108-4543-48be-a4c1-6a8454a427c2';
      `;
      console.log('✅ Fixed layout positions');
      console.log('New layout:', correctLayout);
    }
    
  } catch (error) {
    console.error('❌ Error checking table:', error);
  } finally {
    await sql.end();
  }
}

runMigration();
