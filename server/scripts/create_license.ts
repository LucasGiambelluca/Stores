
import { db } from '../src/db/drizzle.js';
import { licenses } from '../src/db/schema.js';
import { v4 as uuidv4 } from 'uuid';

async function createLicense() {
  const storeId = 'ec5eedd2-8fcf-4c66-9424-2803515b0dc8';
  
  try {
    console.log(`Creating license for store: ${storeId}`);
    
    await db.insert(licenses).values({
      id: uuidv4(),
      storeId: storeId,
      key: `LIFETIME-${uuidv4().substring(0, 8).toUpperCase()}`,
      serial: uuidv4().substring(0, 12).toUpperCase(), // Shorten to fit varchar(20)
      type: 'lifetime',
      status: 'active',
      activated: true,
      activatedAt: new Date(),
      expiresAt: null, // Lifetime
      features: ['all'],
    });
    
    console.log('License created and activated.');
    process.exit(0);
  } catch (error) {
    console.error('Error creating license:', error);
    process.exit(1);
  }
}

createLicense();
