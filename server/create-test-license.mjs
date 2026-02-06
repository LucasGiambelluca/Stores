import pkg from 'postgres';
const postgres = pkg;
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

console.log('🔑 Creating test license...');

function generateSerial() {
  const segments = [];
  for (let i = 0; i < 3; i++) {
    const segment = crypto.randomBytes(2).toString('hex').toUpperCase();
    segments.push(segment);
  }
  return `TND-${segments.join('-')}`;
}

const serial = generateSerial();

try {
  // Insert license
  const result = await sql`
    INSERT INTO licenses (
      serial,
      plan,
      status,
      store_id,
      expires_at,
      max_products,
      max_orders,
      owner_email,
      owner_name,
      notes,
      created_at
    )
    VALUES (
      ${serial},
      'enterprise',
      'generated',
      NULL,
      NULL,
      NULL,
      NULL,
      'test@tiendita.com',
      'Test Store',
      'Created via script for testing',
      NOW()
    )
    RETURNING *
  `;

  console.log('\n✅ LICENSE CREATED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════════');
  console.log('📋 Serial:', serial);
  console.log('📦 Plan: enterprise');
  console.log('⏰ Duration: lifetime (no expiration)');
  console.log('📧 Owner: test@tiendita.com');
  console.log('═══════════════════════════════════════════');
  console.log('\n🔗 Next Step: Go to http://localhost:3005 and activate this license');

  await sql.end();
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error);
  await sql.end();
  process.exit(1);
}
