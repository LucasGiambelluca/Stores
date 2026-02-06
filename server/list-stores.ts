
import 'dotenv/config';
import { db, stores } from './src/db/drizzle';

async function listStores() {
  try {
    const allStores = await db.select().from(stores);
    console.log('🏪 All Stores:');
    console.log(JSON.stringify(allStores, null, 2));
  } catch (error) {
    console.error('Error listing stores:', error);
  }
  process.exit(0);
}

listStores();
