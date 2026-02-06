
import { db, users } from '../db/drizzle.js';
import { eq } from 'drizzle-orm';

async function checkRole() {
  try {
    const admin = await db.query.users.findFirst({
      where: eq(users.email, 'admin@admin.com')
    });
    console.log('User admin@admin.com:', admin ? `${admin.role} (ID: ${admin.id})` : 'Not found');
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

checkRole();
