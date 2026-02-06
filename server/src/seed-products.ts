/**
 * DEPRECATED: This script was designed for SQLite and is no longer compatible
 * with the current PostgreSQL setup using Drizzle ORM.
 * 
 * Issues:
 * - Uses db.prepare() which doesn't exist in postgres-js driver
 * - Uses initDatabase() which was removed in PostgreSQL migration
 * - Uses SQLite-specific SQL syntax (INSERT OR REPLACE)
 * 
 * For seeding products in PostgreSQL:
 * 1. Use Drizzle's insert() API with proper types
 * 2. Ensure all storeId fields are properly set
 * 3. Use PostgreSQL-compatible syntax (ON CONFLICT DO UPDATE)
 * 
 * This file is kept for reference but should not be executed.
 */

/*
// Script to seed products from constants.ts to PostgreSQL database
import { v4 as uuidv4 } from 'uuid';
import { db } from './db/drizzle.js';
// import { initDatabase } from './db/index.js'; // DEPRECATED - was for SQLite

// Sample products
const PRODUCTS = [
  {
    id: 1,
    name: "Remera SJ",
    price: 13640,
    originalPrice: 16047,
    transferPrice: 11594,
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
    id: 2,
    name: "Pack x6 Remeras SJ",
    price: 63900,
    originalPrice: 79000,
    transferPrice: 54315,
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
    id: 3,
    name: "Remera Estampada Urban",
    price: 14500,
    originalPrice: 17058,
    transferPrice: 12325,
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
    id: 4,
    name: "Remera Oversize Premium",
    price: 15800,
    originalPrice: 18500,
    transferPrice: 13430,
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
    id: 5,
    name: "Musculosa Deportiva",
    price: 9500,
    originalPrice: 11176,
    transferPrice: 8075,
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
    id: 6,
    name: "Bermuda Cargo",
    price: 18900,
    originalPrice: 22235,
    transferPrice: 16065,
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
    id: 7,
    name: "Short Deportivo",
    price: 12500,
    originalPrice: 14705,
    transferPrice: 10625,
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
    id: 8,
    name: "Manga Cero Gym",
    price: 11200,
    originalPrice: 13176,
    transferPrice: 9520,
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
    id: 9,
    name: "SALE - Remera Básica",
    price: 8900,
    originalPrice: 12900,
    transferPrice: 7565,
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
    id: 10,
    name: "SALE - Musculosa Training",
    price: 7500,
    originalPrice: 11500,
    transferPrice: 6375,
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

async function seedProducts() {
  console.log('🌱 Seeding database...');
  
  // Init DB first
  initDatabase();
  
  // First, seed categories
  console.log('\n📁 Creating categories...');
  const insertCategory = db.prepare(`
    INSERT OR REPLACE INTO categories (id, name, slug, order_num, is_active, is_accent)
    VALUES (?, ?, ?, ?, 1, ?)
  `);
  
  const categories = [
    { id: 'remeras', name: 'Remeras', slug: 'remeras', order: 1, isAccent: false },
    { id: 'mangas-cero', name: 'Mangas Cero', slug: 'mangas-cero', order: 2, isAccent: false },
    { id: 'bermudas', name: 'Bermudas', slug: 'bermudas', order: 3, isAccent: false },
    { id: 'musculosas', name: 'Musculosas', slug: 'musculosas', order: 4, isAccent: false },
    { id: 'sale', name: 'Sale', slug: 'sale', order: 5, isAccent: true },
  ];
  
  for (const cat of categories) {
    insertCategory.run(cat.id, cat.name, cat.slug, cat.order, cat.isAccent ? 1 : 0);
    console.log(`  ✅ ${cat.name}`);
  }
  
  // Now seed products
  console.log('\n📦 Creating products...');
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO products (
      id, name, description, price, original_price, transfer_price,
      category_id, subcategory, image, images, sizes, colors,
      stock, stock_status, is_best_seller, is_new, is_on_sale, order_num
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (const p of PRODUCTS) {
    insertStmt.run(
      uuidv4(),
      p.name,
      null,
      p.price,
      p.originalPrice || null,
      p.transferPrice || null,
      p.category,
      p.subcategory,
      p.image,
      null,
      JSON.stringify(p.sizes),
      JSON.stringify(p.colors),
      p.stock || 100,
      null,
      p.isBestSeller ? 1 : 0,
      p.isNew ? 1 : 0,
      p.isOnSale ? 1 : 0,
      p.id
    );
    count++;
    console.log(`  ✅ ${p.name}`);
  }
  
  console.log(`\n🎉 Seeded ${count} products!`);
}

seedProducts();
*/

