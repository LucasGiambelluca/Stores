
import { db } from '../src/db/drizzle.js';
import { users } from '../src/db/schema.js';
import { eq, and } from 'drizzle-orm';

async function checkUser() {
  const storeId = '686a4e34-d99c-490c-99a8-2d5c3b5f86b9';
  const emails = ['test@test.com', 'admin@admin.com'];

  try {
    for (const email of emails) {
      const user = await db.query.users.findFirst({
        where: and(eq(users.email, email), eq(users.storeId, storeId))
      });
      
      if (user) {
        console.log(`User ${email}: Role=${user.role}, StoreId=${user.storeId}`);
      } else {
        console.log(`User ${email} not found in store ${storeId}`);
      }
    }
    process.exit(0);
  } catch (error) {
    console.error('Error checking user:', error);
    process.exit(1);
  }
}

checkUser();
