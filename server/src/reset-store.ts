
import { db } from './db/drizzle.js';
import { storeConfig } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function resetStore() {
  console.log('🔄 Resetting store configuration...');
  
  try {
    // Get first store (for default store)
    const store = await db.query.stores.findFirst();
    if (!store) {
      console.error('❌ No store found. Please run setup first.');
      process.exit(1);
    }

    // Set is_configured to false
    await db.insert(storeConfig)
      .values({ key: 'is_configured', storeId: store.id, value: 'false' })
      .onConflictDoUpdate({
        target: storeConfig.key,
        set: { value: 'false' }
      });
      
    console.log('✅ Store configuration reset. You can now reload the page to see the Setup Wizard.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting store:', error);
    process.exit(1);
  }
}

resetStore();
