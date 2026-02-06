
import 'dotenv/config';
import { db } from '../src/db/drizzle.js';
import { stores, storeConfig, banners, categories, products, licenses } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

async function checkRemerasStore() {
  const storeId = '686a4e34-d99c-490c-99a8-2d5c3b5f86b9';
  
  console.log('🔍 Checking tienda de remeras in detail...\n');

  // Get store record
  const [store] = await db.select().from(stores).where(eq(stores.id, storeId));
  console.log('📦 Store record:');
  console.log(JSON.stringify(store, null, 2));
  
  // Get all config
  console.log('\n📋 Configuration:');
  const configs = await db.select().from(storeConfig).where(eq(storeConfig.storeId, storeId));
  for (const c of configs) {
    const val = c.value.length > 100 ? c.value.substring(0, 100) + '...' : c.value;
    console.log(`  ${c.key}: ${val}`);
  }
  
  // Get banners
  const allBanners = await db.select().from(banners).where(eq(banners.storeId, storeId));
  console.log(`\n🖼️ Banners: ${allBanners.length}`);
  
  // Get categories
  const allCategories = await db.select().from(categories).where(eq(categories.storeId, storeId));
  console.log(`📂 Categories: ${allCategories.length}`);
  
  // Get products
  const allProducts = await db.select().from(products).where(eq(products.storeId, storeId));
  console.log(`📦 Products: ${allProducts.length}`);
  
  // Get license
  const [license] = await db.select().from(licenses).where(eq(licenses.storeId, storeId));
  console.log(`\n🔑 License: ${license ? license.serial + ' (' + license.status + ')' : 'NONE'}`);

  process.exit(0);
}

checkRemerasStore();
