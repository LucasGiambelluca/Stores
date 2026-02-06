import pkg from 'postgres';
const postgres = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

console.log('🔧 Creating super_admin user...\n');

const email = 'admin@mothership.com';
const password = 'admin123';
const name = 'Mothership Admin';

try {
  const hashedPassword = await bcrypt.hash(password, 10);

  // Try to find existing user
  const existing = await sql`
    SELECT * FROM users WHERE email = ${email}
  `;

  if (existing.length > 0) {
    // Update existing user
    await sql`
      UPDATE users 
      SET role = 'super_admin', password = ${hashedPassword}
      WHERE email = ${email}
    `;
    console.log('✅ Updated existing user to super_admin');
  } else {
    // Create new user
    await sql`
      INSERT INTO users (email, password, name, role)
      VALUES (${email}, ${hashedPassword}, ${name}, 'super_admin')
    `;
    console.log('✅ Created new super_admin user');
  }

  console.log('\n📋 Super Admin Credentials:');
  console.log('   Email:', email);
  console.log('   Password:', password);
  console.log('\n🎉 Success! You can now login to Mothership');

  await sql.end();
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error);
  await sql.end();
  process.exit(1);
}
