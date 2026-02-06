
import 'dotenv/config';
import { storeService } from '../src/services/store.service.js';
import { db } from '../src/db/drizzle.js';
import { stores } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

async function testSoftDelete() {
  try {
    console.log('🧪 Testing Soft Delete...');

    // 1. Create a dummy store
    const storeData = {
      name: 'Test Soft Delete Store',
      ownerEmail: 'test@softdelete.com',
      ownerName: 'Test Owner'
    };
    const { store } = await storeService.createStore(storeData);
    console.log(`✅ Created store: ${store.id}`);

    // 2. Verify it exists in list
    const listBefore = await storeService.getAllStores(1, 100);
    const foundBefore = listBefore.stores.find(s => s.id === store.id);
    if (!foundBefore) throw new Error('Store not found in list before delete');
    console.log('✅ Store found in list');

    // 3. Soft Delete the store
    await storeService.deleteStore(store.id);
    console.log('✅ Store deleted (soft)');

    // 4. Verify it is NOT in list
    const listAfter = await storeService.getAllStores(1, 100);
    const foundAfter = listAfter.stores.find(s => s.id === store.id);
    if (foundAfter) throw new Error('Store STILL found in list after delete');
    console.log('✅ Store NOT found in list (correct)');

    // 5. Verify it still exists in DB with deletedAt
    const dbStore = await db.query.stores.findFirst({
      where: eq(stores.id, store.id)
    });
    
    if (!dbStore) throw new Error('Store record completely removed from DB (Hard Delete happened!)');
    if (!dbStore.deletedAt) throw new Error('Store record exists but deletedAt is null');
    
    console.log(`✅ Store record exists in DB with deletedAt: ${dbStore.deletedAt}`);
    console.log('🎉 Soft Delete Test PASSED!');

    // Cleanup (Hard delete for test cleanup)
    await db.delete(stores).where(eq(stores.id, store.id));
    console.log('🧹 Test cleanup complete');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test Failed:', error);
    process.exit(1);
  }
}

testSoftDelete();
