/**
 * Database Reset Script
 * 
 * WARN: This script deletes ALL data in the database.
 * It resets the state to a clean slate and seeds the Mothership store.
 * 
 * Usage: pnpm run reset
 */

import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';

async function reset() {
  // Dynamic imports to ensure env vars are loaded first
  const { db } = await import('../src/db/drizzle.js');
  const { stores, users, systemSettings } = await import('../src/db/schema.js');

  console.log('⚠️  STARTING DATABASE RESET...');
  console.log('⚠️  ALL DATA WILL BE LOST!');
  
  // 1. Drop and Recreate Schema (Full Wipe)
  try {
    console.log('🗑️  Function: Dropping schema public...');
    await db.execute(sql`DROP SCHEMA public CASCADE;`);
    await db.execute(sql`CREATE SCHEMA public;`);
    await db.execute(sql`GRANT ALL ON SCHEMA public TO postgres;`);
    await db.execute(sql`GRANT ALL ON SCHEMA public TO public;`);
    console.log('✅ Schema reset complete.');
  } catch (error) {
    console.error('❌ Error resetting schema:', error);
    process.exit(1);
  }

  // 2. Run Migrations
  console.log('🔄 Running migrations...');
  try {
    const { migrate } = await import('drizzle-orm/postgres-js/migrator');
    // We need to use the migrate function from drizzle-orm
    // Ensure migrations folder is correct relative to this script
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('✅ Migrations applied.');
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    process.exit(1);
  }

  // 3. Create Mothership Store
  console.log('🏗️  Creating Mothership Store...');
  const mothershipId = 'mothership';
  
  try {
    await db.insert(stores).values({
      id: mothershipId,
      name: 'Tiendita Mothership',
      domain: 'mothership', // Special domain
      type: 'mothership',
      plan: 'enterprise',
      status: 'active',
      ownerEmail: 'lucasdavigiambelluca@gmail.com',
      ownerName: 'Super Admin',
      createdAt: new Date(),
    });
    console.log('✅ Mothership store created.');
  } catch (error) {
    console.error('❌ Error creating Mothership store:', error);
    process.exit(1);
  }

  // 3. Create Super Admin User
  console.log('👤 Creating Super Admin User...');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('adminlime2025', salt);

  try {
    await db.insert(users).values({
      id: 'super-admin-user', // Fixed ID for convenience
      storeId: mothershipId,
      email: 'lucasdavigiambelluca@gmail.com',
      password: hashedPassword,
      name: 'Lucas Davigiambelluca',
      role: 'super_admin',
      createdAt: new Date(),
    });
    console.log('✅ Super Admin user created.');
  } catch (error) {
    console.error('❌ Error creating user:', error);
    process.exit(1);
  }

  // 4. Initialize System Settings
  console.log('⚙️  Initializing System Settings...');
  try {
    await db.insert(systemSettings).values({
      id: 'global',
      sentryEnabled: false,
      smtpSecure: true,
    });
    console.log('✅ System settings initialized.');
  } catch (error) {
    console.error('❌ Error initializing settings:', error);
    // Don't exit here, not critical
  }

  console.log('\n✨ DATABASE RESET COMPLETE ✨');
  console.log('-----------------------------------');
  console.log('Link: http://localhost:5173 (Mothership)');
  console.log('User: lucasdavigiambelluca@gmail.com');
  console.log('Pass: adminlime2025');
  console.log('-----------------------------------');
  
  process.exit(0);
}

reset();
