
import { sql } from '../db/drizzle.js';

async function verify() {
  try {
    console.log('Verifying audit_logs schema...');
    // Check columns
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'audit_logs'
    `;
    console.log('Columns:', columns.map(c => c.column_name).join(', '));
    
    // Check recent logs
    const logs = await sql`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5`;
    console.log('Recent Logs:', JSON.stringify(logs, null, 2));
    
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

verify();
