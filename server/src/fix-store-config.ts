import 'dotenv/config';
import { db } from './db/drizzle.js';
import { stores, storeConfig } from './db/schema.js';
import { eq, inArray } from 'drizzle-orm';

async function fixStoreConfig() {
  console.log('🚀 Fixing Store Configuration...');

  const testDomains = ['tienda-starter', 'tienda-pro', 'tienda-enterprise'];

  // Get test stores
  const testStores = await db.select().from(stores).where(inArray(stores.domain, testDomains));

  if (testStores.length === 0) {
    console.log('❌ No test stores found!');
    process.exit(1);
  }

  for (const store of testStores) {
    console.log(`🔧 Configuring store: ${store.name} (${store.id})`);

    // Insert is_configured flag
    await db.insert(storeConfig).values({
      key: 'is_configured',
      storeId: store.id,
      value: 'true',
      setupCompleted: true,
    }).onConflictDoUpdate({
      target: [storeConfig.storeId, storeConfig.key],
      set: { value: 'true', setupCompleted: true }
    });

    console.log(`   ✅ Set is_configured = true`);
  }

  console.log('🏁 Configuration Fix Complete.');
  process.exit(0);
}

fixStoreConfig().catch(console.error);
