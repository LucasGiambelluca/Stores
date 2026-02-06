import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function checkData() {
  console.log('\\n📊 Checking database data...\\n');
  
  // Check stores
  const stores = await sql`SELECT id, name, status, plan, license_key, owner_email FROM stores`;
  console.log('🏪 Stores in database:', stores.length);
  stores.forEach(s => console.log(`   - ${s.name} (${s.status}) - License: ${s.license_key || 'none'}`));
  
  // Check active/activated licenses
  const licenses = await sql`SELECT serial, status, store_id, plan, owner_email FROM licenses WHERE status IN ('activated', 'active')`;
  console.log('\\n🔑 Active licenses:', licenses.length);
  licenses.forEach(l => console.log(`   - ${l.serial} (${l.status}) - Store ID: ${l.store_id || 'not linked'}`));
  
  await sql.end();
}

checkData().catch(console.error);
