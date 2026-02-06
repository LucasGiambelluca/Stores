
import 'dotenv/config';
import { db } from './src/db/drizzle.js';
import { sql } from 'drizzle-orm';

async function fixPrimaryKey() {
  try {
    console.log('🔧 Intentando arreglar PK de store_config...');
    
    // 1. Drop existing PK
    try {
      await db.execute(sql`ALTER TABLE store_config DROP CONSTRAINT IF EXISTS store_config_pkey`);
      console.log('✅ PK anterior eliminada');
    } catch (e: any) {
      console.log('⚠️ Error al eliminar PK (puede que no exista):', e.message);
    }

    // 2. Add new composite PK
    try {
      await db.execute(sql`ALTER TABLE store_config ADD PRIMARY KEY (store_id, key)`);
      console.log('✅ Nueva PK compuesta agregada');
    } catch (e: any) {
      console.error('❌ Error al agregar nueva PK:', e.message);
    }

  } catch (error) {
    console.error('Error general:', error);
  }
  // process.exit(0);
}

fixPrimaryKey();
