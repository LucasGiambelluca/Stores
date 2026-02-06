
import 'dotenv/config';
import { db } from './src/db';
import { stores } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function checkStorePlan() {
  const storeId = 'fd03d68b-a8d8-4308-81d4-dddec3b2b429';
  console.log(`Checking plan for store: ${storeId}`);
  
  try {
    const store = await db.query.stores.findFirst({
      where: eq(stores.id, storeId),
    });
    
    if (store) {
      console.log('Store found:');
      console.log(`Name: ${store.name}`);
      console.log(`Plan: ${store.plan}`);
      console.log(`Status: ${store.status}`);
    } else {
      console.log('Store not found');
    }
  } catch (error) {
    console.error('Error querying database:', error);
  }
  process.exit(0);
}

checkStorePlan();
