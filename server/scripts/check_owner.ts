
import { db } from '../src/db/drizzle.js';
import { stores, users } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

async function checkStoreOwner() {
  const storeId = '686a4e34-d99c-490c-99a8-2d5c3b5f86b9';

  try {
    const store = await db.query.stores.findFirst({
      where: eq(stores.id, storeId)
    });
    
    if (store) {
      console.log(`Store: ${store.name}, Owner Email: ${store.ownerEmail}`);
      
      if (store.ownerEmail) {
        const user = await db.query.users.findFirst({
          where: eq(users.email, store.ownerEmail)
        });
        
        if (user) {
          console.log(`Owner User Found: ID=${user.id}, Role=${user.role}, StoreId=${user.storeId}`);
        } else {
          console.log('Owner User NOT found in users table (globally or for this store)');
          // Check if user exists in this store specifically
           const storeUser = await db.query.users.findFirst({
            where: eq(users.email, store.ownerEmail)
          });
          if (storeUser && storeUser.storeId === storeId) {
             console.log('User exists in this store.');
          }
        }
      }
    } else {
      console.log('Store not found');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error checking store owner:', error);
    process.exit(1);
  }
}

checkStoreOwner();
