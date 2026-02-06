/// <reference types="node" />
// Reset Store and Create License Script
// Run: npx tsx reset-store.ts

import 'dotenv/config';
import { db } from './src/db/drizzle.js';
import { storeConfig, stores, licenses } from './src/db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { randomBytes } from 'crypto';

function generateSerial(): string {
  const segments: string[] = [];
  for (let i = 0; i < 3; i++) {
    segments.push(randomBytes(2).toString('hex').toUpperCase());
  }
  return `TND-${segments.join('-')}`;
}

async function resetStoreAndCreateLicense() {
  try {
    console.log('🔄 Starting store reset...\n');
    
    // 1. Clear store configuration
    console.log('1️⃣ Clearing store configuration...');
    await db.delete(storeConfig).where(
      inArray(storeConfig.key, ['is_configured', 'license_key', 'license_status', 'license_plan', 'store_name', 'store_slogan'])
    );
    console.log('   ✅ Store config cleared');
    
    // 2. Reset store status
    console.log('2️⃣ Resetting store status...');
    await db.update(stores).set({
      licenseKey: null,
      plan: null,
      status: 'pending'
    });
    console.log('   ✅ Store status reset to pending');
    
    // 3. Revoke all activated licenses
    console.log('3️⃣ Revoking activated licenses...');
    await db.update(licenses)
      .set({
        status: 'generated',
        storeId: null,
        activatedAt: null
      })
      .where(eq(licenses.status, 'activated'));
    console.log('   ✅ Activated licenses revoked');
    
    // 4. Create new PRO license
    const newSerial = generateSerial();
    console.log('4️⃣ Creating new PRO license...');
    await db.insert(licenses).values({
      serial: newSerial,
      plan: 'pro',
      status: 'generated',
      maxProducts: 1000,
      maxOrders: null,
      expiresAt: null,
      ownerName: 'Test User',
      notes: 'PRO lifetime license for testing'
    });
    console.log(`   ✅ License created: ${newSerial}`);

    // 4.5 Ensure admin user is super_admin
    console.log('4️⃣.5️⃣ Fixing admin user role...');
    const { users } = await import('./src/db/schema.js');
    await db.update(users)
      .set({ role: 'super_admin' })
      .where(eq(users.email, process.env.ADMIN_EMAIL || 'admin@admin.com'));
    console.log('   ✅ Admin role set to super_admin');
    
    // 5. Verification
    console.log('\n📊 Verification:');
    const configResult = await db.select().from(storeConfig).where(
      inArray(storeConfig.key, ['is_configured', 'license_key'])
    );
    console.log('   Store config entries:', configResult.length === 0 ? 'CLEARED ✅' : configResult);
    
    const storeResult = await db.select({
      name: stores.name,
      status: stores.status,
      licenseKey: stores.licenseKey
    }).from(stores).limit(1);
    console.log('   Store status:', storeResult[0] || 'No store found');
    
    const licenseResult = await db.select({
      serial: licenses.serial,
      plan: licenses.plan,
      status: licenses.status
    }).from(licenses).where(eq(licenses.serial, newSerial));
    console.log('   New license:', licenseResult[0]);
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 RESET COMPLETE!');
    console.log('='.repeat(50));
    console.log(`\n📋 New License Serial: ${newSerial}`);
    console.log('\n👉 Next steps:');
    console.log('   1. Refresh http://localhost:3005 (should show setup wizard)');
    console.log('   2. Complete the store setup');
    console.log(`   3. Activate with serial: ${newSerial}`);
    console.log('');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetStoreAndCreateLicense();
