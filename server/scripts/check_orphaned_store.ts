
import { db } from '../src/db/drizzle.js';
import { stores, users, products, categories, banners } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

async function checkOrphanedStore() {
  const orphanedStoreId = 'ec5eedd2-8fcf-4c66-9424-2803515b0dc8';

  try {
    console.log(`Checking for store ID: ${orphanedStoreId}`);
    
    // Check if store exists
    const store = await db.query.stores.findFirst({
      where: eq(stores.id, orphanedStoreId)
    });
    
    if (store) {
      console.log(`Store FOUND: ${store.name} (${store.domain})`);
    } else {
      console.log('Store NOT found in stores table.');
    }

    // Check for related data
    const relatedProducts = await db.select().from(products).where(eq(products.storeId, orphanedStoreId));
    console.log(`Related Products: ${relatedProducts.length}`);
    
    const relatedCategories = await db.select().from(categories).where(eq(categories.storeId, orphanedStoreId));
    console.log(`Related Categories: ${relatedCategories.length}`);
    
    const relatedBanners = await db.select().from(banners).where(eq(banners.storeId, orphanedStoreId));
    console.log(`Related Banners: ${relatedBanners.length}`);
    
    const relatedUsers = await db.select().from(users).where(eq(users.storeId, orphanedStoreId));
    console.log(`Related Users: ${relatedUsers.length}`);
    if (relatedUsers.length > 0) {
        relatedUsers.forEach(u => console.log(` - User: ${u.email} (${u.role})`));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking orphaned store:', error);
    process.exit(1);
  }
}

checkOrphanedStore();
