
import { db } from '../src/db/drizzle.js';
import { users } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function forceReset() {
  const email = 'admin@tiendadepantalones.com';
  const password = 'password';
  const storeId = 'ec5eedd2-8fcf-4c66-9424-2803515b0dc8';

  try {
    console.log(`Checking user: ${email}`);
    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (!user) {
      console.error('User NOT found!');
      process.exit(1);
    }

    console.log(`User found. Current StoreID: ${user.storeId}`);
    console.log(`Target StoreID: ${storeId}`);

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.update(users)
      .set({ 
        password: hashedPassword,
        storeId: storeId,
        role: 'admin'
      })
      .where(eq(users.email, email));

    console.log('Password force reset to "password" and storeId confirmed.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

forceReset();
