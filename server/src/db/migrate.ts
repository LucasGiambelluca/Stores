/**
 * Database Migration Script
 * 
 * DEPRECATED: This script was for SQLite. 
 * Now using PostgreSQL/Supabase with Drizzle migrations.
 * Run: pnpm exec drizzle-kit push
 */

import dotenv from 'dotenv';
dotenv.config();

// import { sqliteDb } from './drizzle.js'; // DEPRECATED - was for SQLite

const createTables = () => {
  console.log('🔄 Creating database tables...\n');

  // Create users table
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      phone TEXT,
      role TEXT DEFAULT 'customer',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  ✓ users');

  // Create addresses table
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      street TEXT NOT NULL,
      city TEXT NOT NULL,
      province TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      phone TEXT,
      is_default INTEGER DEFAULT 0
    )
  `);
  console.log('  ✓ addresses');

  // Create categories table
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      image TEXT,
      order_num INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      is_accent INTEGER DEFAULT 0
    )
  `);
  console.log('  ✓ categories');

  // Create products table
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      original_price INTEGER,
      transfer_price INTEGER,
      category_id TEXT REFERENCES categories(id),
      subcategory TEXT,
      image TEXT,
      images TEXT,
      sizes TEXT,
      colors TEXT,
      stock INTEGER DEFAULT 100,
      stock_status TEXT,
      is_best_seller INTEGER DEFAULT 0,
      is_new INTEGER DEFAULT 0,
      is_on_sale INTEGER DEFAULT 0,
      order_num INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  ✓ products');

  // Create orders table
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      user_id TEXT REFERENCES users(id),
      customer_email TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      shipping_address TEXT,
      shipping_method TEXT,
      shipping_cost INTEGER DEFAULT 0,
      shipping_carrier TEXT,
      tracking_number TEXT,
      subtotal INTEGER NOT NULL,
      total INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      payment_method TEXT,
      payment_id TEXT,
      payment_status TEXT,
      payment_receipt TEXT,
      receipt_verified INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  ✓ orders');

  // Create order_items table
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      product_image TEXT,
      price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      size TEXT,
      color TEXT
    )
  `);
  console.log('  ✓ order_items');

  // Create shipments table
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS shipments (
      id TEXT PRIMARY KEY,
      order_id TEXT UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      carrier TEXT NOT NULL,
      tracking_number TEXT,
      label_url TEXT,
      label_data TEXT,
      status TEXT DEFAULT 'pending',
      carrier_response TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      shipped_at TEXT,
      delivered_at TEXT
    )
  `);
  console.log('  ✓ shipments');

  // Create store_config table
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS store_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  ✓ store_config');

  // Create faqs table
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS faqs (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      order_num INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    )
  `);
  console.log('  ✓ faqs');

  // Create banners table
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS banners (
      id TEXT PRIMARY KEY,
      image TEXT NOT NULL,
      title TEXT,
      subtitle TEXT,
      button_text TEXT,
      button_link TEXT,
      order_num INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    )
  `);
  console.log('  ✓ banners');

  // Create reviews table
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id TEXT,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      rating INTEGER NOT NULL,
      title TEXT,
      comment TEXT,
      is_verified_purchase INTEGER DEFAULT 0,
      is_approved INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  ✓ reviews');

  // Create wishlist table
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS wishlist (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      session_id TEXT,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  ✓ wishlist');

  // Create abandoned_carts table
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS abandoned_carts (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      email TEXT,
      cart_data TEXT NOT NULL,
      reminder_sent INTEGER DEFAULT 0,
      recovered INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  ✓ abandoned_carts');

  // Create indexes
  console.log('\n🔄 Creating indexes...');
  
  sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)`);
  sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at)`);
  sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_products_bestseller ON products(is_best_seller)`);
  sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`);
  sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
  sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at)`);
  sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number)`);
  sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)`);
  sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id)`);
  sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id)`);
  sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number)`);
  sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id)`);
  sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating)`);
  
  console.log('  ✓ All indexes created');

  console.log('\n✅ Database migration complete!\n');
};

createTables();
