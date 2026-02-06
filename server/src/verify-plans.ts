import 'dotenv/config';
import { db } from './db/drizzle.js';
import { licenses } from './db/schema.js';
import { LicenseGenerator } from './utils/license-generator.js';
import { eq } from 'drizzle-orm';

async function verifyPlans() {
  console.log('🚀 Starting Plan Verification...');

  const plans = [
    { name: 'starter', expectedProducts: 50, expectedOrders: 100 },
    { name: 'pro', expectedProducts: 2000, expectedOrders: null },
    { name: 'enterprise', expectedProducts: null, expectedOrders: null },
  ];

  for (const plan of plans) {
    console.log(`\n-----------------------------------`);
    console.log(`🧪 Testing Plan: ${plan.name.toUpperCase()}`);

    // 1. Generate Serial
    const serial = LicenseGenerator.generate();
    const duration = '1year';
    const expiresAt = LicenseGenerator.getExpirationDate(duration);
    const limits = LicenseGenerator.getPlanLimits(plan.name);

    console.log(`   - Generated Serial: ${serial}`);
    console.log(`   - Calculated Limits: Products=${limits.maxProducts}, Orders=${limits.maxOrders}`);

    // 2. Insert into DB (Simulating creation)
    const [newLicense] = await db.insert(licenses).values({
      serial,
      plan: plan.name,
      status: 'generated',
      expiresAt,
      maxProducts: limits.maxProducts,
      maxOrders: limits.maxOrders,
      notes: 'Verification Script Test',
    }).returning();

    console.log(`   - License Created in DB: ID=${newLicense.serial}`);

    // 3. Verify
    const productCheck = newLicense.maxProducts === plan.expectedProducts;
    const orderCheck = newLicense.maxOrders === plan.expectedOrders;

    if (productCheck && orderCheck) {
      console.log(`   ✅ VERIFIED: Limits match expected values.`);
    } else {
      console.error(`   ❌ FAILED: Limits do not match!`);
      console.error(`      Expected: Products=${plan.expectedProducts}, Orders=${plan.expectedOrders}`);
      console.error(`      Actual:   Products=${newLicense.maxProducts}, Orders=${newLicense.maxOrders}`);
    }
  }

  console.log(`\n-----------------------------------`);
  console.log('🏁 Verification Complete.');
  process.exit(0);
}

verifyPlans().catch(console.error);
