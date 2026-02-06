-- TIENDITA SAAS - COMPLETE DATABASE SETUP FOR SUPABASE
-- Execute this entire script in Supabase SQL Editor
-- This will create all tables needed for the system to work

-- ============================================================
-- STEP 1: CREATE BASE TABLES
-- ============================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    force_password_change BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP
);

-- Stores table (for multi-tenancy)
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    domain TEXT UNIQUE,
    plan TEXT DEFAULT 'free',
    status TEXT DEFAULT 'trial',
    license_key TEXT,
    last_check_in TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Store config table
CREATE TABLE IF NOT EXISTS store_config (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL,
    value TEXT,
    store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(key, store_id)
);

-- SaaS settings table
CREATE TABLE IF NOT EXISTS saas_settings (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    image TEXT,
    order_num INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_accent BOOLEAN DEFAULT FALSE,
    store_id TEXT,
    UNIQUE(slug, store_id)
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    original_price INTEGER,
    transfer_price INTEGER,
    category_id INTEGER REFERENCES categories(id),
    subcategory TEXT,
    image TEXT,
    images TEXT,
    sizes TEXT,
    colors TEXT,
    stock INTEGER DEFAULT 100,
    stock_status TEXT,
    is_best_seller BOOLEAN DEFAULT FALSE,
    is_new BOOLEAN DEFAULT FALSE,
    is_on_sale BOOLEAN DEFAULT FALSE,
    order_num INTEGER DEFAULT 0,
    store_id TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- STEP 2: CREATE LICENSES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS licenses (
    id SERIAL PRIMARY KEY,
    serial VARCHAR(20) UNIQUE NOT NULL,
    plan VARCHAR(20) NOT NULL DEFAULT 'free',
    status VARCHAR(20) NOT NULL DEFAULT 'generated',
    store_id INTEGER REFERENCES stores(id) ON DELETE SET NULL,
    expires_at TIMESTAMP,
    max_products INTEGER,
    max_orders INTEGER,
    owner_email VARCHAR(255),
    owner_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    activated_at TIMESTAMP,
    last_check_in TIMESTAMP
);

-- Indexes for licenses
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_store ON licenses(store_id);
CREATE INDEX IF NOT EXISTS idx_licenses_plan ON licenses(plan);
CREATE INDEX IF NOT EXISTS idx_licenses_serial ON licenses(serial);

-- ============================================================
-- STEP 3: CREATE ORDERS AND RELATED TABLES
-- ============================================================

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    user_id TEXT,
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
    receipt_verified BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    product_name TEXT NOT NULL,
    product_image TEXT,
    price INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    size TEXT,
    color TEXT
);

-- Shipments table
CREATE TABLE IF NOT EXISTS shipments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    carrier TEXT NOT NULL,
    tracking_number TEXT,
    label_url TEXT,
    label_data TEXT,
    status TEXT DEFAULT 'pending',
    carrier_response TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP
);

-- ============================================================
-- STEP 4: CREATE ADDITIONAL TABLES
-- ============================================================

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id TEXT,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    rating INTEGER NOT NULL,
    title TEXT,
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Addresses table
CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    phone TEXT,
    is_default BOOLEAN DEFAULT FALSE
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    action TEXT NOT NULL,
    user_id TEXT,
    user_email TEXT,
    target_id TEXT,
    target_type TEXT,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- FAQs table
CREATE TABLE IF NOT EXISTS faqs (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    order_num INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Banners table
CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    image TEXT NOT NULL,
    title TEXT,
    subtitle TEXT,
    button_text TEXT,
    button_link TEXT,
    order_num INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
    id SERIAL PRIMARY KEY,
    user_id TEXT,
    session_id TEXT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Abandoned carts table
CREATE TABLE IF NOT EXISTS abandoned_carts (
    id SERIAL PRIMARY KEY,
    session_id TEXT,
    email TEXT,
    cart_data TEXT NOT NULL,
    reminder_sent BOOLEAN DEFAULT FALSE,
    recovered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- STEP 5: CREATE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_bestseller ON products(is_best_seller);
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);

CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_logs(created_at);

-- ============================================================
-- STEP 6: CREATE SUPER ADMIN USER
-- ============================================================

-- First, check if user already exists and delete if needed
DELETE FROM users WHERE email = 'admin@mothership.com';

-- Create super_admin user
-- Password: admin123
INSERT INTO users (email, password, name, role, created_at, updated_at)
VALUES (
    'admin@mothership.com',
    '$2a$10$4aUd1pnUB2G/7PoIG8OPyusMZh2kSld747Q5bzidnOBZMErksdFjq',
    'Mothership Admin',
    'super_admin',
    NOW(),
    NOW()
);

-- ============================================================
-- STEP 7: CREATE DEFAULT STORE
-- ============================================================

-- Create default store
INSERT INTO stores (slug, name, status, plan)
VALUES ('tiendita', 'Tiendita Demo', 'active', 'free')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- VERIFICATION
-- ============================================================

SELECT 
    '✅ Migration completed successfully!' as status,
    COUNT(*) as user_count FROM users WHERE role = 'super_admin';

SELECT 
    '📊 Tables created:' as info,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count;

-- Show super_admin credentials
SELECT 
    '🔑 Super Admin Created' as message,
    email,
    'admin123' as password,
    role
FROM users 
WHERE role = 'super_admin'
LIMIT 1;
