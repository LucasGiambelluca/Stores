// Reset setup to allow configuring a new store
import dotenv from 'dotenv';
dotenv.config();

import { db, users, storeConfig } from './dist/db/drizzle.js';
import { eq } from 'drizzle-orm';

async function resetSetup() {
  try {
    console.log('🔄 Resetting store setup...');
    
    // Delete setup_completed flag
    await db.delete(storeConfig).where(eq(storeConfig.key, 'setup_completed'));
    console.log('✅ Removed setup_completed flag');
    
    // Delete all admin users
    const deletedAdmins = await db.delete(users).where(eq(users.role, 'admin'));
    console.log('✅ Removed admin users');
    
    // Optional: Clear other config
    await db.delete(storeConfig).where(eq(storeConfig.key, 'store_name'));
    await db.delete(storeConfig).where(eq(storeConfig.key, 'store_domain'));
    await db.delete(storeConfig).where(eq(storeConfig.key, 'license_key'));
    console.log('✅ Cleared store configuration');
    
    console.log('\n✨ Setup reset complete! You can now configure a new store at http://localhost:3005');
    
  } catch (error) {
    console.error('❌ Error resetting setup:', error);
  }
  
  process.exit(0);
}

resetSetup();
