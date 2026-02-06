
import { db } from '../db/drizzle.js';
import { stores, users } from '../db/schema.js';
import { StoreService } from '../services/store.service.js';
import { eq } from 'drizzle-orm';
import { logger } from '../services/logger.service.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

async function deployDemoStore() {
  logger.info('🚀 Starting Demo Store Deployment...');

  try {
    // 1. Clean up existing stores
    logger.info('🗑️ Cleaning up existing stores...');
    const allStores = await db.select().from(stores);
    
    for (const store of allStores) {
      if (store.domain === 'mothership') continue; // Don't delete mothership if it exists
      
      logger.info(`- Deleting store: ${store.name} (${store.domain})`);
      
      if (store.domain === 'demo' || store.domain === 'indumentaria' || store.domain === 'tiendita-indumentaria-demo') {
        // Hard delete this one to free up the domain
        await db.delete(stores).where(eq(stores.id, store.id));
      } else {
        await new StoreService().deleteStore(store.id);
      }
    }
    
    // Safety pause
    await new Promise(r => setTimeout(r, 1000));

    // 2. Create Demo Store
    logger.info('✨ Creating "Tiendita Indumentaria Demo"...');
    const storeService = new StoreService();
    
    // Create Store Entry
    const newStoreStub = await storeService.createStore({
      name: 'Tiendita Indumentaria Demo',
      ownerEmail: 'admin@tiendita.app',
      ownerName: 'Admin Demo'
    });
    
    if (!newStoreStub?.store?.id) {
      throw new Error('Failed to create demo store');
    }
    const storeId = newStoreStub.store.id;

    // Force update domain to 'demo' if needed, though name might generate 'tiendita-indumentaria-demo'
    // Let's set it to 'demo' explicitly
    await db.update(stores)
        .set({ domain: 'demo' })
        .where(eq(stores.id, storeId));

    logger.info(`✅ Demo Store created with ID: ${storeId} and subdomain: demo`);

    // 3. Create Admin User
    logger.info('👤 Creating Admin User...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await db.insert(users).values({
      id: uuidv4(),
      storeId: storeId,
      email: 'admin@tiendita.app',
      password: hashedPassword,
      name: 'Admin Demo',
      phone: '1122334455',
      role: 'super_admin', // Grant super admin privileges
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 4. Upgrade Plan to Enterprise
    logger.info('💎 Upgrading configuration to Enterprise...');
    await db.update(stores)
      .set({ 
        plan: 'enterprise',
        type: 'retail',
        status: 'active' // Activate immediately
      })
      .where(eq(stores.id, storeId));

    // 5. Seed Data
    logger.info('🌱 Seeding "Ropa y Moda" template data...');
    await storeService.seedTemplateData('Ropa y Moda', undefined, storeId);

    logger.info('🎉 Deployment Complete!');
    logger.info('-----------------------------------');
    logger.info(`Store: Tiendita Indumentaria Demo`);
    logger.info(`URL: http://demo.tiendita.app (Local: http://demo.localhost:5173)`);
    logger.info(`Admin: admin@tiendita.app`);
    logger.info(`Pass: password123`);
    logger.info('-----------------------------------');

    process.exit(0);

  } catch (error) {
    logger.error('❌ Deployment Failed:', { error: error as Error });
    console.error(error); // Ensure we see stack trace
    process.exit(1);
  }
}

deployDemoStore();
