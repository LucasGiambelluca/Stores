
import 'dotenv/config';
import { db, storeConfig } from './src/db/drizzle';
import { eq, and } from 'drizzle-orm';

async function injectTestConfigs() {
  const store1 = '0fe15be6-03ec-48c1-9277-7f02c745a698'; // Tienda de test
  const store2 = 'db04d1a3-01be-478a-baf2-d3f309781d27'; // My Store

  console.log('💉 Injecting test configurations...');

  // Set Store 1 to RED
  await setConfig(store1, 'theme_primary', '#FF0000'); // Red
  
  // Set Store 2 to BLUE
  await setConfig(store2, 'theme_primary', '#0000FF'); // Blue

  console.log('✅ Test configurations injected.');
  process.exit(0);
}

async function setConfig(storeId: string, key: string, value: string) {
  const existing = await db.select()
    .from(storeConfig)
    .where(
      and(
        eq(storeConfig.key, key),
        eq(storeConfig.storeId, storeId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db.update(storeConfig)
      .set({ value, updatedAt: new Date() })
      .where(
        and(
          eq(storeConfig.key, key),
          eq(storeConfig.storeId, storeId)
        )
      );
  } else {
    await db.insert(storeConfig).values({
      key,
      storeId,
      value,
      updatedAt: new Date(),
    });
  }
  console.log(`Set ${key} = ${value} for store ${storeId.substring(0, 8)}`);
}

injectTestConfigs();
