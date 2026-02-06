
import 'dotenv/config';
import { db } from './src/db/drizzle.js';
import { users } from './src/db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function resetPassword() {
  try {
    const email = 'admin@tiendatest.com';
    console.log(`🔐 Reseteando contraseña para ${email}...`);
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, email));

    console.log('✅ Contraseña actualizada a "admin123"');

  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

resetPassword();
