-- LimeStore PostgreSQL Migration Script for Supabase
-- Run this in Supabase SQL Editor

-- Drop existing tables if needed (careful!)
-- DROP TABLE IF EXISTS audit_logs CASCADE;

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" text PRIMARY KEY NOT NULL,
    "email" text NOT NULL UNIQUE,
    "password" text NOT NULL,
    "name" text,
    "phone" text,
    "role" text DEFAULT 'customer',
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS "categories" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "description" text,
    "image" text,
    "order_num" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "is_accent" boolean DEFAULT false
);

-- Create products table
CREATE TABLE IF NOT EXISTS "products" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "price" integer NOT NULL,
    "original_price" integer,
    "transfer_price" integer,
    "category_id" text REFERENCES "categories"("id"),
    "subcategory" text,
    "image" text,
    "images" text,
    "sizes" text,
    "colors" text,
    "stock" integer DEFAULT 100,
    "stock_status" text,
    "is_best_seller" boolean DEFAULT false,
    "is_new" boolean DEFAULT false,
    "is_on_sale" boolean DEFAULT false,
    "order_num" integer DEFAULT 0,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

-- Create addresses table
CREATE TABLE IF NOT EXISTS "addresses" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "street" text NOT NULL,
    "city" text NOT NULL,
    "province" text NOT NULL,
    "postal_code" text NOT NULL,
    "phone" text,
    "is_default" boolean DEFAULT false
);

-- Create orders table
CREATE TABLE IF NOT EXISTS "orders" (
    "id" text PRIMARY KEY NOT NULL,
    "order_number" text NOT NULL UNIQUE,
    "user_id" text REFERENCES "users"("id"),
    "customer_email" text NOT NULL,
    "customer_name" text NOT NULL,
    "customer_phone" text,
    "shipping_address" text,
    "shipping_method" text,
    "shipping_cost" integer DEFAULT 0,
    "shipping_carrier" text,
    "tracking_number" text,
    "subtotal" integer NOT NULL,
    "total" integer NOT NULL,
    "status" text DEFAULT 'pending',
    "payment_method" text,
    "payment_id" text,
    "payment_status" text,
    "payment_receipt" text,
    "receipt_verified" boolean DEFAULT false,
    "notes" text,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS "order_items" (
    "id" text PRIMARY KEY NOT NULL,
    "order_id" text NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "product_id" text NOT NULL REFERENCES "products"("id"),
    "product_name" text NOT NULL,
    "product_image" text,
    "price" integer NOT NULL,
    "quantity" integer NOT NULL,
    "size" text,
    "color" text
);

-- Create shipments table
CREATE TABLE IF NOT EXISTS "shipments" (
    "id" text PRIMARY KEY NOT NULL,
    "order_id" text NOT NULL UNIQUE REFERENCES "orders"("id") ON DELETE CASCADE,
    "carrier" text NOT NULL,
    "tracking_number" text,
    "label_url" text,
    "label_data" text,
    "status" text DEFAULT 'pending',
    "carrier_response" text,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now(),
    "shipped_at" timestamp,
    "delivered_at" timestamp
);

-- Create store_config table
CREATE TABLE IF NOT EXISTS "store_config" (
    "key" text PRIMARY KEY NOT NULL,
    "value" text NOT NULL,
    "updated_at" timestamp DEFAULT now()
);

-- Create faqs table
CREATE TABLE IF NOT EXISTS "faqs" (
    "id" text PRIMARY KEY NOT NULL,
    "question" text NOT NULL,
    "answer" text NOT NULL,
    "category" text DEFAULT 'general',
    "order_num" integer DEFAULT 0,
    "is_active" boolean DEFAULT true
);

-- Create banners table
CREATE TABLE IF NOT EXISTS "banners" (
    "id" text PRIMARY KEY NOT NULL,
    "image" text NOT NULL,
    "title" text,
    "subtitle" text,
    "button_text" text,
    "button_link" text,
    "order_num" integer DEFAULT 0,
    "is_active" boolean DEFAULT true
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS "reviews" (
    "id" text PRIMARY KEY NOT NULL,
    "product_id" text NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "user_id" text,
    "customer_name" text NOT NULL,
    "customer_email" text,
    "rating" integer NOT NULL,
    "title" text,
    "comment" text,
    "is_verified_purchase" boolean DEFAULT false,
    "is_approved" boolean DEFAULT true,
    "created_at" timestamp DEFAULT now()
);

-- Create wishlist table
CREATE TABLE IF NOT EXISTS "wishlist" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text,
    "session_id" text,
    "product_id" text NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "created_at" timestamp DEFAULT now()
);

-- Create abandoned_carts table
CREATE TABLE IF NOT EXISTS "abandoned_carts" (
    "id" text PRIMARY KEY NOT NULL,
    "session_id" text,
    "email" text,
    "cart_data" text NOT NULL,
    "reminder_sent" boolean DEFAULT false,
    "recovered" boolean DEFAULT false,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" text PRIMARY KEY NOT NULL,
    "action" text NOT NULL,
    "user_id" text,
    "user_email" text,
    "target_id" text,
    "target_type" text,
    "details" text,
    "ip_address" text,
    "user_agent" text,
    "created_at" timestamp DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_products_category" ON "products" ("category_id");
CREATE INDEX IF NOT EXISTS "idx_products_created" ON "products" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_products_bestseller" ON "products" ("is_best_seller");
CREATE INDEX IF NOT EXISTS "idx_orders_user" ON "orders" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_orders_status" ON "orders" ("status");
CREATE INDEX IF NOT EXISTS "idx_orders_created" ON "orders" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_orders_number" ON "orders" ("order_number");
CREATE INDEX IF NOT EXISTS "idx_order_items_order" ON "order_items" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_order_items_product" ON "order_items" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_reviews_product" ON "reviews" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_reviews_rating" ON "reviews" ("rating");
CREATE INDEX IF NOT EXISTS "idx_shipments_order" ON "shipments" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_shipments_tracking" ON "shipments" ("tracking_number");
CREATE INDEX IF NOT EXISTS "idx_audit_action" ON "audit_logs" ("action");
CREATE INDEX IF NOT EXISTS "idx_audit_user" ON "audit_logs" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_audit_date" ON "audit_logs" ("created_at");

-- Done!
SELECT 'Migration completed successfully!' as status;
