
import 'dotenv/config';
import { storeResolver } from '../src/middleware/storeResolver.middleware.js';
import { storeService } from '../src/services/store.service.js';
import { db } from '../src/db/drizzle.js';
import { stores } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

async function testMiddleware() {
  try {
    console.log('🧪 Testing Store Resolver Middleware for Deleted Stores...');

    // 1. Create a dummy store
    const storeData = {
      name: 'Middleware Test Store',
      ownerEmail: 'test@middleware.com',
      ownerName: 'Middleware Tester'
    };
    const { store } = await storeService.createStore(storeData);
    console.log(`✅ Created store: ${store.id}`);

    // 2. Soft Delete the store
    await storeService.deleteStore(store.id);
    console.log('✅ Store deleted (soft)');

    // 3. Mock Request/Response
    const req: any = {
      query: { storeId: store.id },
      headers: {}
    };
    
    const res: any = {
      status: (code: number) => {
        console.log(`Response Status: ${code}`);
        return res;
      },
      json: (data: any) => {
        console.log('Response JSON:', data);
        if (data.code === 'STORE_DELETED') {
          console.log('✅ Correctly returned STORE_DELETED error');
        } else {
          console.error('❌ Unexpected response:', data);
          throw new Error('Middleware did not return STORE_DELETED');
        }
        return res;
      }
    };

    const next = (err?: any) => {
      if (err) {
        console.error('❌ Middleware called next with error:', err);
      } else {
        console.error('❌ Middleware called next() - Should have returned 404!');
      }
      throw new Error('Middleware failed to block deleted store');
    };

    // 4. Run Middleware
    await storeResolver(req, res, next);

    // Cleanup
    await db.delete(stores).where(eq(stores.id, store.id));
    console.log('🧹 Test cleanup complete');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test Failed:', error);
    process.exit(1);
  }
}

testMiddleware();
