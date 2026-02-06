import 'dotenv/config';
import { db } from './db/drizzle.js';
import { users } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function fixAdminRole() {
  console.log('🚀 Promoting Admin to Super Admin...');

  const email = 'admin@admin.com';

  // Check if user exists
  const user = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (user.length === 0) {
    console.error(`❌ User ${email} not found!`);
    process.exit(1);
  }

  // Update role
  await db.update(users)
    .set({ role: 'super_admin' })
    .where(eq(users.email, email));

  console.log(`✅ User ${email} is now a SUPER ADMIN.`);
  process.exit(0);
}

fixAdminRole().catch(console.error);
