
import 'dotenv/config';
import { db } from '../src/db/drizzle.js';
import { stores } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

async function checkStore() {
  const storeId = '7a450194-d74c-4520-b441-940c1693bd45';
  const [store] = await db.select({
    id: stores.id,
    name: stores.name,
    status: stores.status,
    deletedAt: stores.deletedAt
  }).from(stores).where(eq(stores.id, storeId)).limit(1);
  
  if (!store) {
    console.log('Store not found in DB');
  } else {
    console.log('Store found:');
    console.log('  ID:', store.id);
    console.log('  Name:', store.name);
    console.log('  Status:', store.status);
    console.log('  DeletedAt:', store.deletedAt);
  }
  
  process.exit(0);
}

checkStore();
