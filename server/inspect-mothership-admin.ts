
import 'dotenv/config';
import { db, users } from './src/db/drizzle';
import { eq } from 'drizzle-orm';

async function inspectAdmin() {
  try {
    const admin = await db.select()
    .from(users)
    .where(eq(users.email, 'admin@mothership.com'));
    
    console.log('🔍 Mothership Admin Details:');
    console.log(JSON.stringify(admin, null, 2));
  } catch (error) {
    console.error('Error inspecting admin:', error);
  }
  
  process.exit(0);
}

inspectAdmin();
