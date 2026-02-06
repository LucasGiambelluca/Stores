
import { db } from '../src/db/drizzle.js';
import { stores, licenses } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

async function checkLicenses() {
  try {
    const allStores = await db.select().from(stores);
    console.log(`Total Stores: ${allStores.length}`);
    
    for (const store of allStores) {
      const license = await db.query.licenses.findFirst({
        where: eq(licenses.storeId, store.id)
      });
      
      console.log(`Store: ${store.name} (${store.id})`);
      console.log(` - Domain: ${store.domain}`);
      console.log(` - License: ${license ? `${license.type} (${license.status})` : 'NONE'}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking licenses:', error);
    process.exit(1);
  }
}

checkLicenses();
