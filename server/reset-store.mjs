// Reset Store and Create License Script
// Run: node reset-store.mjs

import pg from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

function generateSerial() {
  const segments = [];
  for (let i = 0; i < 3; i++) {
    segments.push(crypto.randomBytes(2).toString('hex').toUpperCase());
  }
  return `TND-${segments.join('-')}`;
}

async function resetStoreAndCreateLicense() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting store reset...\n');
    
    // 1. Clear store configuration
    console.log('1️⃣ Clearing store configuration...');
    await client.query(`
      DELETE FROM store_config 
      WHERE key IN ('is_configured', 'license_key', 'license_status', 'license_plan', 'store_name', 'store_slogan')
    `);
    console.log('   ✅ Store config cleared');
    
    // 2. Reset store status
    console.log('2️⃣ Resetting store status...');
    await client.query(`
      UPDATE stores SET 
        license_key = NULL, 
        plan = NULL, 
        status = 'pending'
    `);
    console.log('   ✅ Store status reset to pending');
    
    // 3. Revoke all activated licenses (mark as generated)
    console.log('3️⃣ Revoking activated licenses...');
    const revokeResult = await client.query(`
      UPDATE licenses SET 
        status = 'generated', 
        store_id = NULL, 
        activated_at = NULL
      WHERE status = 'activated'
    `);
    console.log(`   ✅ ${revokeResult.rowCount} licenses revoked`);
    
    // 4. Create new PRO license
    const newSerial = generateSerial();
    console.log('4️⃣ Creating new PRO license...');
    await client.query(`
      INSERT INTO licenses (serial, plan, status, max_products, max_orders, expires_at, owner_name, notes, created_at)
      VALUES ($1, 'pro', 'generated', 1000, NULL, NULL, 'Test User', 'PRO lifetime license for testing', NOW())
    `, [newSerial]);
    console.log(`   ✅ License created: ${newSerial}`);
    
    // 5. Verify
    console.log('\n📊 Verification:');
    const configResult = await client.query(`
      SELECT key, value FROM store_config 
      WHERE key IN ('is_configured', 'license_key')
    `);
    console.log('   Store config entries:', configResult.rows.length === 0 ? 'CLEARED ✅' : configResult.rows);
    
    const storeResult = await client.query(`SELECT name, status, license_key FROM stores LIMIT 1`);
    console.log('   Store status:', storeResult.rows[0]);
    
    const licenseResult = await client.query(`SELECT serial, plan, status FROM licenses WHERE serial = $1`, [newSerial]);
    console.log('   New license:', licenseResult.rows[0]);
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 RESET COMPLETE!');
    console.log('='.repeat(50));
    console.log(`\n📋 New License Serial: ${newSerial}`);
    console.log('\n👉 Next steps:');
    console.log('   1. Refresh http://localhost:3005 (should show setup wizard)');
    console.log('   2. Complete the store setup');
    console.log('   3. Activate with serial:', newSerial);
    console.log('');
    
    return newSerial;
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

resetStoreAndCreateLicense();
