
import 'dotenv/config';
import { db } from './src/db';
import { productPageConfig } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function checkConfig() {
  const storeId = 'fd03d68b-a8d8-4308-81d4-dddec3b2b429';
  console.log(`Checking config for store: ${storeId}`);
  
  try {
    const config = await db.query.productPageConfig.findFirst({
      where: eq(productPageConfig.storeId, storeId),
    });
    
    if (config) {
      console.log('Config found:');
      console.log(`Enabled: ${config.isEnabled}`);
      console.log('Blocks:', JSON.stringify(config.blocks, null, 2));
    } else {
      console.log('Config not found');
    }
  } catch (error) {
    console.error('Error querying database:', error);
  }
  process.exit(0);
}

checkConfig();
