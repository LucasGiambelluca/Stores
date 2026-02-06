
import 'dotenv/config';
import { db } from './src/db/drizzle.js';
import { storeConfig } from './src/db/schema.js';

async function fixStoreConfig() {
  try {
    const storeId = '4bb84ee1-372e-4b81-a182-bcea08c0a597';
    console.log(`🔧 Configurando tienda ${storeId}...`);
    
    const configs = [
      { key: 'setup_completed', value: 'true' },
      { key: 'is_configured', value: 'true' },
      { key: 'store_name', value: 'Tienda Test 2' },
      { key: 'store_domain', value: 'tiendatest2' },
      { key: 'theme_primary', value: '#3b82f6' },
      { key: 'theme_accent', value: '#22c55e' },
      { key: 'theme_text', value: '#3b82f6' },
      { key: 'theme_secondary', value: '#f5f5f5' },
      { key: 'theme_background', value: '#ffffff' },
      { key: 'store_email', value: 'test2@tienda.com' }
    ];

    for (const config of configs) {
      await db.insert(storeConfig).values({
        key: config.key,
        storeId: storeId,
        value: config.value,
        setupCompleted: true
      }).onConflictDoUpdate({
        target: [storeConfig.storeId, storeConfig.key],
        set: { value: config.value }
      });
    }

    console.log('✅ Configuración insertada correctamente');

  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

fixStoreConfig();
