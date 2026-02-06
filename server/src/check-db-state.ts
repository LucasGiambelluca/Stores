import 'dotenv/config';
import { db } from './db/drizzle.js';
import { stores, licenses } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function checkDbState() {
  console.log('🚀 Checking DB State...');

  const allStores = await db.select().from(stores);
  console.log(`Found ${allStores.length} stores.`);

  for (const store of allStores) {
    console.log(`\n🏪 Store: ${store.name} (${store.domain})`);
    console.log(`   ID: ${store.id}`);
    console.log(`   License Key (in store): ${store.licenseKey}`);

    const [license] = await db.select().from(licenses).where(eq(licenses.storeId, store.id));
    
    if (license) {
      console.log(`   ✅ License found via storeId:`);
      console.log(`      Serial: ${license.serial}`);
      console.log(`      Plan: ${license.plan}`);
      console.log(`      Status: ${license.status}`);
      console.log(`      Max Products: ${license.maxProducts}`);
    } else {
      console.log(`   ❌ NO LICENSE found via storeId!`);
      
      // Try finding by serial if it exists in store
      if (store.licenseKey) {
        const [licenseByKey] = await db.select().from(licenses).where(eq(licenses.serial, store.licenseKey));
        if (licenseByKey) {
          console.log(`      ⚠️ Found license by serial, but storeId mismatch?`);
          console.log(`      License StoreId: ${licenseByKey.storeId}`);
        } else {
          console.log(`      ❌ License key '${store.licenseKey}' not found in licenses table.`);
        }
      }
    }
  }

  process.exit(0);
}

checkDbState().catch(console.error);
