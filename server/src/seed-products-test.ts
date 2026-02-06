import 'dotenv/config';
import { db } from './db/drizzle.js';
import { products, stores, categories } from './db/schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function seedProducts() {
  console.log('🚀 Starting Product Seeding...');

  const plans = [
    { name: 'starter', count: 50 },
    { name: 'pro', count: 2000 },
    { name: 'enterprise', count: 5000 }, // Test high volume
  ];

  for (const plan of plans) {
    const storeDomain = `tienda-${plan.name}`;
    console.log(`\n-----------------------------------`);
    console.log(`📦 Seeding Store: ${plan.name.toUpperCase()} (${plan.count} products)`);

    // Get Store
    const store = await db.query.stores.findFirst({
      where: eq(stores.domain, storeDomain),
    });

    if (!store) {
      console.log(`   ❌ Store not found for domain: ${storeDomain}`);
      continue;
    }

    console.log(`   - Store ID: ${store.id}`);

    // Create a category
    const categoryId = uuidv4();
    await db.insert(categories).values({
      id: categoryId,
      storeId: store.id,
      name: 'General',
      slug: 'general',
    }).onConflictDoNothing();

    // Generate Products
    const productsToInsert = [];
    for (let i = 0; i < plan.count; i++) {
      productsToInsert.push({
        id: uuidv4(),
        storeId: store.id,
        name: `Producto de Prueba ${i + 1}`,
        description: `Descripción del producto de prueba ${i + 1} para el plan ${plan.name}`,
        price: Math.floor(Math.random() * 10000) + 1000,
        categoryId: categoryId,
        stock: 100,
        images: ['https://via.placeholder.com/300'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Bulk Insert (chunks of 1000 to be safe)
    const chunkSize = 1000;
    for (let i = 0; i < productsToInsert.length; i += chunkSize) {
      const chunk = productsToInsert.slice(i, i + chunkSize);
      await db.insert(products).values(chunk);
      console.log(`   - Inserted ${Math.min(i + chunkSize, productsToInsert.length)} / ${productsToInsert.length}`);
    }

    console.log(`   ✅ Seeding complete for ${plan.name}`);
  }

  console.log(`\n-----------------------------------`);
  console.log('🏁 Product Seeding Complete.');
  process.exit(0);
}

seedProducts().catch(console.error);
