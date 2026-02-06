
import { db } from './src/db/drizzle.js';
import { stores, categories, products, users, storeConfig } from './src/db/schema.js';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const DEMO_STORE_ID = 'demo-store-id';
const DEMO_USER_ID = 'demo-user-id';

const PRODUCTS = [
  {
    name: "Remera SJ",
    price: 13640,
    originalPrice: 16047,
    category: "remeras",
    subcategory: "Remeras",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Blanco", "Negro", "Gris"],
    stock: 100,
    isBestSeller: true,
    isNew: false,
    isOnSale: true
  },
  {
    name: "Pack x6 Remeras SJ",
    price: 63900,
    originalPrice: 79000,
    category: "remeras",
    subcategory: "Remeras",
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Surtido"],
    stock: 50,
    isBestSeller: true,
    isNew: false,
    isOnSale: true
  },
  {
    name: "Remera Estampada Urban",
    price: 14500,
    originalPrice: 17058,
    category: "remeras",
    subcategory: "Remeras Estampadas",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Negro", "Blanco"],
    stock: 80,
    isBestSeller: false,
    isNew: true,
    isOnSale: true
  },
  {
    name: "Remera Oversize Premium",
    price: 15800,
    originalPrice: 18500,
    category: "remeras",
    subcategory: "Remeras Oversize",
    image: "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=800",
    sizes: ["M", "L", "XL", "XXL"],
    colors: ["Negro", "Blanco", "Beige"],
    stock: 60,
    isBestSeller: true,
    isNew: true,
    isOnSale: false
  },
  {
    name: "Musculosa Deportiva",
    price: 9500,
    originalPrice: 11176,
    category: "musculosas",
    subcategory: "Musculosas",
    image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Negro", "Blanco", "Gris"],
    stock: 120,
    isBestSeller: false,
    isNew: false,
    isOnSale: true
  },
  {
    name: "Bermuda Cargo",
    price: 18900,
    originalPrice: 22235,
    category: "bermudas",
    subcategory: "Bermudas",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800",
    sizes: ["38", "40", "42", "44", "46"],
    colors: ["Negro", "Beige", "Verde Militar"],
    stock: 45,
    isBestSeller: true,
    isNew: false,
    isOnSale: true
  },
  {
    name: "Short Deportivo",
    price: 12500,
    originalPrice: 14705,
    category: "bermudas",
    subcategory: "Shorts",
    image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Negro", "Gris", "Azul"],
    stock: 90,
    isBestSeller: false,
    isNew: true,
    isOnSale: true
  },
  {
    name: "Manga Cero Gym",
    price: 11200,
    originalPrice: 13176,
    category: "mangas-cero",
    subcategory: "Mangas Cero",
    image: "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Negro", "Blanco"],
    stock: 75,
    isBestSeller: false,
    isNew: false,
    isOnSale: true
  },
  {
    name: "SALE - Remera Básica",
    price: 8900,
    originalPrice: 12900,
    category: "sale",
    subcategory: "Sale",
    image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800",
    sizes: ["M", "L", "XL"],
    colors: ["Blanco", "Negro"],
    stock: 30,
    isBestSeller: false,
    isNew: false,
    isOnSale: true
  },
  {
    name: "SALE - Musculosa Training",
    price: 7500,
    originalPrice: 11500,
    category: "sale",
    subcategory: "Sale",
    image: "https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=800",
    sizes: ["S", "M", "L"],
    colors: ["Negro", "Gris"],
    stock: 25,
    isBestSeller: false,
    isNew: false,
    isOnSale: true
  }
];

async function seedDemoStore() {
  console.log('🌱 Seeding Demo Store...');

  try {
    // 1. Create Store
    console.log('Creating store...');
    await db.insert(stores).values({
      id: DEMO_STORE_ID,
      name: 'LimeStore Demo',
      domain: 'demo',
      status: 'active',
      type: 'retail',
      plan: 'enterprise',
      ownerEmail: 'demo@limestore.com',
      ownerName: 'Demo User'
    }).onConflictDoUpdate({
      target: stores.id,
      set: {
        name: 'LimeStore Demo',
        domain: 'demo',
        status: 'active'
      }
    });

    // 2. Create User
    console.log('Creating user...');
    const hashedPassword = await bcrypt.hash('demo123', 10);
    await db.insert(users).values({
      id: DEMO_USER_ID,
      storeId: DEMO_STORE_ID,
      email: 'demo@limestore.com',
      password: hashedPassword,
      name: 'Demo User',
      role: 'admin'
    }).onConflictDoUpdate({
      target: users.id,
      set: {
        password: hashedPassword,
        role: 'admin'
      }
    });

    // 3. Create Categories
    console.log('Creating categories...');
    const categoryMap = new Map();
    const categoriesData = [
      { name: 'Remeras', slug: 'remeras', order: 1, isAccent: false },
      { name: 'Mangas Cero', slug: 'mangas-cero', order: 2, isAccent: false },
      { name: 'Bermudas', slug: 'bermudas', order: 3, isAccent: false },
      { name: 'Musculosas', slug: 'musculosas', order: 4, isAccent: false },
      { name: 'Sale', slug: 'sale', order: 5, isAccent: true },
    ];

    for (const cat of categoriesData) {
      const catId = uuidv4();
      // Check if exists by slug/storeId
      const existing = await db.select().from(categories).where(
        eq(categories.storeId, DEMO_STORE_ID)
      );
      
      const found = existing.find(c => c.slug === cat.slug);
      
      if (found) {
        categoryMap.set(cat.slug, found.id);
      } else {
        await db.insert(categories).values({
          id: catId,
          storeId: DEMO_STORE_ID,
          name: cat.name,
          slug: cat.slug,
          orderNum: cat.order,
          isAccent: cat.isAccent,
          isActive: true
        });
        categoryMap.set(cat.slug, catId);
      }
    }

    // 4. Create Products
    console.log('Creating products...');
    for (const p of PRODUCTS) {
      const catId = categoryMap.get(p.category);
      if (!catId) {
        console.warn(`Category ${p.category} not found for product ${p.name}`);
        continue;
      }

      await db.insert(products).values({
        id: uuidv4(),
        storeId: DEMO_STORE_ID,
        name: p.name,
        price: p.price,
        originalPrice: p.originalPrice,
        categoryId: catId,
        subcategory: p.subcategory,
        image: p.image,
        sizes: p.sizes,
        colors: p.colors,
        stock: p.stock,
        isBestSeller: p.isBestSeller,
        isNew: p.isNew,
        isOnSale: p.isOnSale,
        stockStatus: 'in_stock'
      });
    }

    console.log('✅ Demo Store created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding demo store:', error);
    process.exit(1);
  }
}

seedDemoStore();
