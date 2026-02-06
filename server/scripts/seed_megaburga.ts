import 'dotenv/config';
import { db } from '../src/db/drizzle.js';
import { stores, users, licenses, categories, products, storeConfig } from '../src/db/schema.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

async function seedMegaBurga() {
  console.log('🍔 Seeding MegaBurga Store...');

  try {
    const storeId = 'megaburga-id';
    const userId = 'megaburga-admin';
    const licenseKey = 'TND-MEGA-BURGA-0001';

    // 1. Create Store
    console.log('Creating Store...');
    await db.insert(stores).values({
      id: storeId,
      name: 'MegaBurga',
      domain: 'megaburga',
      type: 'gastronomy',
      plan: 'starter',
      ownerEmail: 'admin@megaburga.com',
      ownerName: 'Mega Admin',
      status: 'active',
      licenseKey: licenseKey,
    }).onConflictDoNothing();

    // 2. Create User
    console.log('Creating Admin User...');
    const hashedPassword = await bcrypt.hash('123456', 10);
    await db.insert(users).values({
      id: userId,
      storeId: storeId,
      email: 'admin@megaburga.com',
      password: hashedPassword,
      name: 'Mega Admin',
      role: 'admin',
    }).onConflictDoNothing();

    // 3. Create License
    console.log('Creating License...');
    await db.insert(licenses).values({
      serial: licenseKey,
      plan: 'starter',
      status: 'activated',
      storeId: storeId,
      maxProducts: 50, // Starter Limit
      maxOrders: 100,
      ownerEmail: 'admin@megaburga.com',
      ownerName: 'Mega Admin',
      activatedAt: new Date(),
    }).onConflictDoNothing();

    // 4. Store Config
    await db.insert(storeConfig).values([
      { key: 'license_key', value: licenseKey, storeId },
      { key: 'license_plan', value: 'starter', storeId },
      { key: 'is_configured', value: 'true', storeId },
      { key: 'store_name', value: 'MegaBurga', storeId },
      { key: 'store_email', value: 'admin@megaburga.com', storeId },
      { key: 'store_slogan', value: 'Las mejores hamburguesas del condado', storeId },
      { key: 'theme_primary', value: '#FF5722', storeId }, // Orange for food
      { key: 'theme_accent', value: '#FFC107', storeId }, // Amber
    ]).onConflictDoNothing();

    // 5. Create Categories
    console.log('Creating Categories...');
    const cats = [
      { id: 'cat-burgers', name: 'Hamburguesas', slug: 'hamburguesas' },
      { id: 'cat-drinks', name: 'Bebidas', slug: 'bebidas' },
      { id: 'cat-sides', name: 'Acompañamientos', slug: 'acompanamientos' },
    ];

    for (const cat of cats) {
      await db.insert(categories).values({
        id: cat.id,
        storeId,
        name: cat.name,
        slug: cat.slug,
        isActive: true,
      }).onConflictDoNothing();
    }

    // 6. Create Products (Hit the limit of 50)
    console.log('Creating Products...');
    
    // 20 Burgers
    for (let i = 1; i <= 20; i++) {
      await db.insert(products).values({
        id: `prod-burger-${i}`,
        storeId,
        name: `Mega Burger #${i}`,
        description: 'Deliciosa hamburguesa con queso y bacon',
        price: 8000 + (i * 100),
        categoryId: 'cat-burgers',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
        stock: i < 5 ? 3 : 100, // Low stock for first 4
        stockStatus: i < 5 ? 'Última' : 'En stock',
      }).onConflictDoNothing();
    }

    // 15 Drinks
    for (let i = 1; i <= 15; i++) {
      await db.insert(products).values({
        id: `prod-drink-${i}`,
        storeId,
        name: `Refresco #${i}`,
        description: 'Bebida refrescante 500ml',
        price: 2500,
        categoryId: 'cat-drinks',
        image: 'https://images.unsplash.com/photo-1543253687-c931c8e01820?w=500',
        stock: 50,
      }).onConflictDoNothing();
    }

    // 15 Sides
    for (let i = 1; i <= 15; i++) {
      await db.insert(products).values({
        id: `prod-side-${i}`,
        storeId,
        name: `Papas Fritas #${i}`,
        description: 'Papas crocantes',
        price: 4000,
        categoryId: 'cat-sides',
        image: 'https://images.unsplash.com/photo-1541592106381-b31e96712327?w=500',
        stock: 50,
      }).onConflictDoNothing();
    }

    console.log('✅ MegaBurga Seeded Successfully!');
    console.log('👉 Login: admin@megaburga.com / 123456');
    console.log('👉 Store ID: megaburga-id');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
  process.exit(0);
}

seedMegaBurga();
