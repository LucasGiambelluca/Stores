import 'dotenv/config';
import { db } from '../src/db/drizzle.js';
import { stores, licenses } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

async function checkPlan() {
  const storeId = process.argv[2];
  if (!storeId) {
    console.error('Store ID required');
    process.exit(1);
  }

  const store = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  const license = await db.select().from(licenses).where(eq(licenses.storeId, storeId)).limit(1);

  console.log('Store:', store[0]);
  console.log('License:', license[0]);
  process.exit(0);
}

checkPlan();
