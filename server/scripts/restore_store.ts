
import { db } from '../src/db/drizzle.js';
import { stores, users } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

async function restoreStore() {
  const storeId = 'ec5eedd2-8fcf-4c66-9424-2803515b0dc8';
  const storeName = 'Tienda de Pantalones';
  const storeDomain = 'tienda-de-pantalones';
  const ownerEmail = 'admin@tiendadepantalones.com';
  const ownerPassword = 'password';

  try {
    console.log(`Restoring store: ${storeName} (${storeId})`);

    // 1. Create or Update Store
    const existingStore = await db.query.stores.findFirst({
      where: eq(stores.id, storeId)
    });

    if (existingStore) {
      console.log(`Store ${storeId} exists. Updating details...`);
      await db.update(stores)
        .set({
          name: storeName,
          domain: storeDomain,
          ownerEmail: ownerEmail,
          slogan: 'La mejor tienda de pantalones',
        })
        .where(eq(stores.id, storeId));
    } else {
      await db.insert(stores).values({
        id: storeId,
        name: storeName,
        domain: storeDomain,
        ownerEmail: ownerEmail,
        logo: '', 
        slogan: 'La mejor tienda de pantalones',
      });
      console.log('Store record created.');
    }

    // 2. Create or Update Owner User
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, ownerEmail)
    });

    const hashedPassword = await bcrypt.hash(ownerPassword, 10);

    if (existingUser) {
      console.log(`User ${ownerEmail} exists. Updating storeId...`);
      await db.update(users)
        .set({ 
          storeId: storeId,
          password: hashedPassword, // Reset password just in case
          role: 'admin'
        })
        .where(eq(users.email, ownerEmail));
    } else {
      const userId = uuidv4();
      await db.insert(users).values({
        id: userId,
        storeId: storeId,
        email: ownerEmail,
        password: hashedPassword,
        name: 'Admin Pantalones',
        role: 'admin',
      });
      console.log(`Owner user created: ${ownerEmail}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error restoring store:', error);
    process.exit(1);
  }
}

restoreStore();
