
import 'dotenv/config';
import { db } from './src/db/drizzle.js';
import { stores, users, storeConfig } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function debugStore() {
  try {
    const storeId = '4bb84ee1-372e-4b81-a182-bcea08c0a597';
    console.log(`🔍 Buscando usuarios para storeId: ${storeId}...`);
    
    const storeUsers = await db.query.users.findMany({
      where: eq(users.storeId, storeId)
    });
    console.log('👥 Usuarios encontrados:', storeUsers);
    
    const config = await db.query.storeConfig.findMany({
      where: eq(storeConfig.storeId, storeId)
    });
    console.log('⚙️ Config keys:', config.map(c => `${c.key}: ${c.value}`));

  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

debugStore();
