
import { db } from '../src/db/drizzle.js';
import { stores } from '../src/db/schema.js';

async function listStores() {
  try {
    const allStores = await db.select().from(stores);
    console.log('Stores found:', allStores.length);
    allStores.forEach(store => {
      console.log(`ID: ${store.id}, Name: ${store.name}, Domain: ${store.domain}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error listing stores:', error);
    process.exit(1);
  }
}

listStores();
