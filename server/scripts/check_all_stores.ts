
import 'dotenv/config';
import { db } from '../src/db/drizzle.js';
import { stores, storeConfig } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

async function checkAllStores() {
  console.log('🔍 Checking all stores in database...\n');

  // Get all stores
  const allStores = await db.select({
    id: stores.id,
    name: stores.name,
    domain: stores.domain,
    status: stores.status,
    deletedAt: stores.deletedAt,
    createdAt: stores.createdAt
  }).from(stores);

  console.log(`Found ${allStores.length} stores:\n`);
  
  for (const store of allStores) {
    console.log(`📦 ${store.name}`);
    console.log(`   ID: ${store.id}`);
    console.log(`   Domain: ${store.domain}`);
    console.log(`   Status: ${store.status}`);
    console.log(`   DeletedAt: ${store.deletedAt || 'NULL (active)'}`);
    console.log(`   CreatedAt: ${store.createdAt}`);
    
    // Check config for this store
    const configs = await db.select().from(storeConfig).where(eq(storeConfig.storeId, store.id));
    console.log(`   Config entries: ${configs.length}`);
    
    // Check if configured
    const isConfigured = configs.find(c => c.key === 'is_configured');
    console.log(`   is_configured: ${isConfigured?.value || 'NOT SET'}`);
    console.log('');
  }

  // Search for "remera" specifically
  console.log('\n🔍 Searching for stores with "remera" or "tienda" in name...');
  const searchResults = allStores.filter(s => 
    s.name.toLowerCase().includes('remera') || 
    s.name.toLowerCase().includes('tienda')
  );
  
  if (searchResults.length === 0) {
    console.log('❌ No stores found with "remera" or "tienda" in name!');
  } else {
    console.log(`Found ${searchResults.length} matching stores:`);
    searchResults.forEach(s => console.log(`  - ${s.name} (${s.id})`));
  }

  process.exit(0);
}

checkAllStores();
