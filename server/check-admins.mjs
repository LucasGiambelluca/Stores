// Check admin users in database
import { db, users } from './src/db/drizzle.js';
import { eq } from 'drizzle-orm';

async function checkAdmins() {
  const admins = await db.select({
    email: users.email,
    name: users.name,
    role: users.role,
    createdAt: users.createdAt
  })
  .from(users)
  .where(eq(users.role, 'admin'));
  
  console.log('🔐 Admin users in database:');
  console.table(admins);
  
  process.exit(0);
}

checkAdmins();
