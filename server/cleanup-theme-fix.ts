
import 'dotenv/config';
import { db, storeConfig } from './src/db/drizzle';
import { eq, and, inArray } from 'drizzle-orm';

async function cleanupTestConfigs() {
  const store1 = '0fe15be6-03ec-48c1-9277-7f02c745a698';
  const store2 = 'db04d1a3-01be-478a-baf2-d3f309781d27';

  console.log('🧹 Cleaning up test configurations...');

  await db.delete(storeConfig)
    .where(
      and(
        inArray(storeConfig.storeId, [store1, store2]),
        eq(storeConfig.key, 'theme_primary')
      )
    );

  console.log('✅ Test configurations deleted.');
  process.exit(0);
}

cleanupTestConfigs();
