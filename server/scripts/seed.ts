/**
 * Seed Script - Populate database with example data
 * 
 * This script creates sample categories and products for new store instances.
 * Run with: pnpm run seed
 */

import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

// Load environment
import dotenv from 'dotenv';
dotenv.config();

import { db, categories, products } from '../src/db/drizzle.js';

// Sample categories
const sampleCategories = [
  { id: uuidv4(), name: 'Remeras', slug: 'remeras', description: 'Remeras de algodón premium', orderNum: 1, isActive: true },
  { id: uuidv4(), name: 'Buzos', slug: 'buzos', description: 'Buzos y hoodies', orderNum: 2, isActive: true },
  { id: uuidv4(), name: 'Pantalones', slug: 'pantalones', description: 'Jeans y joggers', orderNum: 3, isActive: true },
  { id: uuidv4(), name: 'Accesorios', slug: 'accesorios', description: 'Gorras, mochilas y más', orderNum: 4, isActive: true },
];

// Sample products
const sampleProducts = [
  {
    name: 'Remera Básica Negra',
    description: 'Remera de algodón 100% premium. Corte regular, cuello redondo.',
    price: 15000,
    originalPrice: 18000,
    stock: 50,
    sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
    colors: JSON.stringify(['Negro', 'Blanco', 'Gris']),
    isBestSeller: true,
    isNew: false,
    isOnSale: true,
    categorySlug: 'remeras',
  },
  {
    name: 'Buzo Oversize',
    description: 'Buzo oversize de algodón frizado. Interior suave, ideal para invierno.',
    price: 35000,
    originalPrice: null,
    stock: 30,
    sizes: JSON.stringify(['M', 'L', 'XL']),
    colors: JSON.stringify(['Negro', 'Beige']),
    isBestSeller: true,
    isNew: true,
    isOnSale: false,
    categorySlug: 'buzos',
  },
  {
    name: 'Jean Recto Clásico',
    description: 'Jean de corte recto clásico. Denim premium 12oz.',
    price: 42000,
    originalPrice: 48000,
    stock: 25,
    sizes: JSON.stringify(['28', '30', '32', '34', '36']),
    colors: JSON.stringify(['Azul', 'Negro']),
    isBestSeller: false,
    isNew: false,
    isOnSale: true,
    categorySlug: 'pantalones',
  },
  {
    name: 'Gorra Dad Hat',
    description: 'Gorra dad hat bordada. Ajuste con hebilla metálica.',
    price: 12000,
    originalPrice: null,
    stock: 100,
    sizes: JSON.stringify(['Único']),
    colors: JSON.stringify(['Negro', 'Blanco', 'Azul Marino']),
    isBestSeller: false,
    isNew: true,
    isOnSale: false,
    categorySlug: 'accesorios',
  },
  {
    name: 'Hoodie Essential',
    description: 'Hoodie clásico con bolsillo canguro. Capucha con cordón.',
    price: 38000,
    originalPrice: 45000,
    stock: 40,
    sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
    colors: JSON.stringify(['Negro', 'Gris Oscuro', 'Verde Militar']),
    isBestSeller: true,
    isNew: false,
    isOnSale: true,
    categorySlug: 'buzos',
  },
  {
    name: 'Jogger Cargo',
    description: 'Jogger con bolsillos cargo laterales. Tela ripstop resistente.',
    price: 32000,
    originalPrice: null,
    stock: 35,
    sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
    colors: JSON.stringify(['Negro', 'Verde', 'Beige']),
    isBestSeller: false,
    isNew: true,
    isOnSale: false,
    categorySlug: 'pantalones',
  },
];

async function seed() {
  console.log('\n🌱 Iniciando seed de datos...\n');

  // 1. Insert categories
  console.log('📁 Creando categorías...');
  for (const cat of sampleCategories) {
    const existing = await db.select().from(categories).where(eq(categories.slug, cat.slug)).limit(1);
    if (existing.length === 0) {
      await db.insert(categories).values(cat);
      console.log(`   ✓ Categoría creada: ${cat.name}`);
    } else {
      console.log(`   ⏭ Categoría ya existe: ${cat.name}`);
    }
  }

  // 2. Insert products
  console.log('\n📦 Creando productos...');
  for (const prod of sampleProducts) {
    // Find category ID
    const cat = await db.select().from(categories).where(eq(categories.slug, prod.categorySlug)).limit(1);
    const categoryId = cat[0]?.id || null;

    await db.insert(products).values({
      id: uuidv4(),
      name: prod.name,
      description: prod.description,
      price: prod.price,
      originalPrice: prod.originalPrice,
      categoryId,
      stock: prod.stock,
      sizes: prod.sizes,
      colors: prod.colors,
      isBestSeller: prod.isBestSeller,
      isNew: prod.isNew,
      isOnSale: prod.isOnSale,
      image: `https://placehold.co/600x800/1a1a1a/E5B800?text=${encodeURIComponent(prod.name.split(' ')[0])}`,
    });
    console.log(`   ✓ Producto creado: ${prod.name}`);
  }

  console.log('\n✅ Seed completado!\n');
  console.log('📊 Resumen:');
  console.log(`   • ${sampleCategories.length} categorías`);
  console.log(`   • ${sampleProducts.length} productos\n`);

  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Error en seed:', error);
  process.exit(1);
});
