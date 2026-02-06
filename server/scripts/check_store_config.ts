
import { db } from '../src/db/drizzle.js';
import { stores, banners, categories, products } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

async function checkStoreConfig() {
  const targetStoreId = '686a4e34-d99c-490c-99a8-2d5c3b5f86b9'; // tienda de remeras
  const otherStoreId = '7a450194-d74c-4520-b441-940c1693bd45'; // My Store

  try {
    console.log('--- Checking "tienda de remeras" ---');
    const store1 = await db.query.stores.findFirst({ where: eq(stores.id, targetStoreId) });
    if (store1) {
      console.log(`Store Found: ${store1.name}`);
      console.log(`Config: Logo=${store1.logo ? 'Yes' : 'No'}, Slogan=${store1.slogan}`);
      
      const banners1 = await db.select().from(banners).where(eq(banners.storeId, targetStoreId));
      console.log(`Banners count: ${banners1.length}`);
      
      const products1 = await db.select().from(products).where(eq(products.storeId, targetStoreId));
      console.log(`Products count: ${products1.length}`);
    } else {
      console.log('Store NOT found!');
    }

    console.log('\n--- Checking "My Store" (from screenshot) ---');
    const store2 = await db.query.stores.findFirst({ where: eq(stores.id, otherStoreId) });
    if (store2) {
      console.log(`Store Found: ${store2.name}`);
      console.log(`Config: Logo=${store2.logo ? 'Yes' : 'No'}, Slogan=${store2.slogan}`);
    } else {
      console.log('Store NOT found!');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking store config:', error);
    process.exit(1);
  }
}

checkStoreConfig();
