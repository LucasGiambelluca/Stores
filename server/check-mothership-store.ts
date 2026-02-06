
import 'dotenv/config';
import { db, stores } from './src/db/drizzle';
import { eq } from 'drizzle-orm';

async function checkMothershipStore() {
  try {
    const store = await db.select().from(stores).where(eq(stores.id, 'store-mothership'));
    console.log('🏪 Mothership Store:');
    if (store.length > 0) {
      console.log(JSON.stringify(store[0], null, 2));
    } else {
      console.log('❌ store-mothership NOT FOUND in stores table');
    }
  } catch (error) {
    console.error('Error checking store:', error);
  }
  process.exit(0);
}

checkMothershipStore();
