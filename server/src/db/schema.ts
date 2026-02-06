/**
 * Drizzle ORM Schema Definition - PostgreSQL
 * 
 * This file defines all database tables with full TypeScript type safety.
 * Migrated from SQLite to PostgreSQL for production use with Supabase.
 */

import { pgTable, text, integer, boolean, timestamp, index, uuid, primaryKey, uniqueIndex, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ===========================================
// STORES - Multi-tenant Management
// ===========================================

export const stores = pgTable('stores', {
  id: text('id').primaryKey(), // UUID
  name: text('name').notNull(),
  domain: text('domain').unique(), // subdomain.tiendita.com
  customDomain: text('custom_domain').unique(), // www.mitienda.com
  
  // SaaS Configuration
  status: text('status').default('active'), // 'active', 'suspended', 'cancelled'
  type: text('type').default('retail'), // 'retail', 'gastronomy', 'service'
  plan: text('plan').default('free'), // 'free', 'starter', 'pro', 'enterprise'
  licenseKey: text('license_key').unique(),
  
  // Billing
  trialEndsAt: timestamp('trial_ends_at'),
  subscriptionEndsAt: timestamp('subscription_ends_at'),
  
  // Contact
  ownerEmail: text('owner_email').notNull(),
  ownerName: text('owner_name'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastCheckIn: timestamp('last_check_in'),
  deletedAt: timestamp('deleted_at'), // Soft delete timestamp
}, (table) => [
  index('idx_stores_domain').on(table.domain),
  index('idx_stores_status').on(table.status),
]);

export const storesRelations = relations(stores, ({ many }) => ({
  users: many(users),
  products: many(products),
  categories: many(categories),
  orders: many(orders),
}));

// ===========================================
// LICENSES - License Key Management
// ===========================================

export const licenses = pgTable('licenses', {
  serial: text('serial').primaryKey(),
  plan: text('plan').notNull().default('free'), // 'free', 'starter', 'pro', 'enterprise'
  status: text('status').notNull().default('generated'), // 'generated', 'activated', 'suspended', 'expired', 'revoked'
  storeId: text('store_id').references(() => stores.id, { onDelete: 'set null' }),
  
  // Expiration and limits
  expiresAt: timestamp('expires_at'),
  maxProducts: integer('max_products'),
  maxOrders: integer('max_orders'),
  
  // Owner information
  ownerEmail: text('owner_email'),
  ownerName: text('owner_name'),
  notes: text('notes'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  activatedAt: timestamp('activated_at'),
  lastCheckIn: timestamp('last_check_in'),
}, (table) => [
  index('idx_licenses_status').on(table.status),
  index('idx_licenses_store').on(table.storeId),
  index('idx_licenses_plan').on(table.plan),
]);

export const licensesRelations = relations(licenses, ({ one }) => ({
  store: one(stores, {
    fields: [licenses.storeId],
    references: [stores.id],
  }),
}));

// ===========================================
// AUDIT LOGS - Track critical actions
// ===========================================

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  action: text('action').notNull(),
  userId: text('user_id'),
  userEmail: text('user_email'),
  targetId: text('target_id'),
  targetType: text('target_type'),
  details: text('details'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_audit_action').on(table.action),
  index('idx_audit_user').on(table.userId),
  index('idx_audit_date').on(table.createdAt),
]);


// ===========================================
// USERS & AUTH
// ===========================================

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  password: text('password').notNull(),
  name: text('name'),
  phone: text('phone'),
  role: text('role').default('customer'), // 'admin', 'staff', 'customer', 'super_admin'
  forcePasswordChange: boolean('force_password_change').default(false),
  resetToken: text('reset_token'),
  resetTokenExpiresAt: timestamp('reset_token_expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('idx_users_store').on(table.storeId),
  index('idx_users_email').on(table.email),
  index('idx_users_reset_token').on(table.resetToken),
]);

export const usersRelations = relations(users, ({ one, many }) => ({
  store: one(stores, {
    fields: [users.storeId],
    references: [stores.id],
  }),
  addresses: many(addresses),
  orders: many(orders),
  reviews: many(reviews),
}));

export const addresses = pgTable('addresses', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  street: text('street').notNull(),
  city: text('city').notNull(),
  province: text('province').notNull(),
  postalCode: text('postal_code').notNull(),
  phone: text('phone'),
  isDefault: boolean('is_default').default(false),
}, (table) => [
  index('idx_addresses_store').on(table.storeId),
  index('idx_addresses_user').on(table.userId),
]);

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}));

// ===========================================
// PRODUCTS & CATEGORIES
// ===========================================

export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(), // Unique per store, not globally
  description: text('description'),
  image: text('image'),
  orderNum: integer('order_num').default(0),
  isActive: boolean('is_active').default(true),
  isAccent: boolean('is_accent').default(false),
}, (table) => [
  index('idx_categories_store').on(table.storeId),
  index('idx_categories_slug').on(table.slug),
  uniqueIndex('idx_categories_store_slug').on(table.storeId, table.slug),
]);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  store: one(stores, {
    fields: [categories.storeId],
    references: [stores.id],
  }),
  products: many(products),
}));

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price').notNull(),
  originalPrice: integer('original_price'),
  transferPrice: integer('transfer_price'),
  categoryId: text('category_id').references(() => categories.id),
  subcategory: text('subcategory'),
  image: text('image'),
  images: jsonb('images').$type<string[]>(), // JSONB array of image URLs
  sizes: jsonb('sizes').$type<string[]>(), // JSONB array of size options
  colors: jsonb('colors').$type<string[]>(), // JSONB array of color options
  stock: integer('stock').default(100),
  variantsStock: jsonb('variants_stock').$type<Record<string, number>>(), // Stock per color variant e.g. {"Red": 5, "Blue": 2}
  stockStatus: text('stock_status'),
  isBestSeller: boolean('is_best_seller').default(false),
  isNew: boolean('is_new').default(false),
  isOnSale: boolean('is_on_sale').default(false),
  views: integer('views').default(0),
  clicks: integer('clicks').default(0),
  orderNum: integer('order_num').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('idx_products_store').on(table.storeId),
  index('idx_products_category').on(table.categoryId),
  index('idx_products_created').on(table.createdAt),
  index('idx_products_bestseller').on(table.isBestSeller),
  index('idx_products_price').on(table.price),
  index('idx_products_is_new').on(table.isNew),
  index('idx_products_is_on_sale').on(table.isOnSale),
  index('idx_products_views').on(table.views),
]);

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
  reviews: many(reviews),
  wishlistItems: many(wishlist),
}));

// ===========================================
// ORDERS
// ===========================================

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  orderNumber: text('order_number').notNull(), // Removed unique constraint globally, should be unique per store
  userId: text('user_id').references(() => users.id),
  customerEmail: text('customer_email').notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone'),
  shippingAddress: jsonb('shipping_address').$type<{
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
    notes?: string;
  }>(), // JSONB shipping address object
  shippingMethod: text('shipping_method'),
  shippingCost: integer('shipping_cost').default(0),
  shippingCarrier: text('shipping_carrier'),
  trackingNumber: text('tracking_number'),
  subtotal: integer('subtotal').notNull(),
  total: integer('total').notNull(),
  status: text('status').default('pending'), // 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'
  paymentProvider: text('payment_provider').default('manual'), // 'mercadopago', 'manual', 'cash'
  paymentMethod: text('payment_method'), // e.g 'credit_card', 'ticket'
  paymentId: text('payment_id'), // The external ID (e.g. from MercadoPago)
  paymentStatus: text('payment_status'), // 'approved', 'pending', 'rejected'
  paymentMeta: jsonb('payment_meta'), // Arbitrary metadata from the provider
  paymentReceipt: text('payment_receipt'),
  receiptVerified: boolean('receipt_verified').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('idx_orders_store').on(table.storeId),
  index('idx_orders_user').on(table.userId),
  index('idx_orders_status').on(table.status),
  index('idx_orders_created').on(table.createdAt),
  index('idx_orders_number').on(table.orderNumber),
  index('idx_orders_customer_email').on(table.customerEmail),
]);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  store: one(stores, {
    fields: [orders.storeId],
    references: [stores.id],
  }),
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  shipment: one(shipments),
}));

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id),
  productName: text('product_name').notNull(),
  productImage: text('product_image'),
  price: integer('price').notNull(),
  quantity: integer('quantity').notNull(),
  size: text('size'),
  color: text('color'),
}, (table) => [
  index('idx_order_items_store').on(table.storeId),
  index('idx_order_items_order').on(table.orderId),
  index('idx_order_items_product').on(table.productId),
]);

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// ===========================================
// SHIPPING
// ===========================================

export const shipments = pgTable('shipments', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  orderId: text('order_id').unique().notNull().references(() => orders.id, { onDelete: 'cascade' }),
  carrier: text('carrier').notNull(),
  trackingNumber: text('tracking_number'),
  labelUrl: text('label_url'),
  labelData: text('label_data'),
  status: text('status').default('pending'), // 'pending', 'created', 'shipped', 'in_transit', 'delivered', 'failed'
  carrierResponse: jsonb('carrier_response').$type<Record<string, unknown>>(), // JSONB carrier API response
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  shippedAt: timestamp('shipped_at'),
  deliveredAt: timestamp('delivered_at'),
}, (table) => [
  index('idx_shipments_store').on(table.storeId),
  index('idx_shipments_order').on(table.orderId),
  index('idx_shipments_tracking').on(table.trackingNumber),
]);

export const shipmentsRelations = relations(shipments, ({ one }) => ({
  order: one(orders, {
    fields: [shipments.orderId],
    references: [orders.id],
  }),
}));

// ===========================================
// STORE CONFIG
// ===========================================

export const storeConfig = pgTable('store_config', {
  key: text('key').notNull(),
  storeId: text('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  value: jsonb('value').notNull().$type<unknown>(), // JSONB config value
  setupCompleted: boolean('setup_completed').default(false),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.storeId, table.key] }),
  index('idx_store_config_store').on(table.storeId),
]);

export const saasSettings = pgTable('saas_settings', {
  id: text('id').primaryKey(),
  storeId: text('store_id').unique().notNull().references(() => stores.id, { onDelete: 'cascade' }),
  licenseKey: text('license_key'),
  centralApiUrl: text('central_api_url'),
  status: text('status').default('active'), // 'active', 'suspended'
  lastCheckIn: timestamp('last_check_in'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ===========================================
// CONTENT (FAQs, Banners)
// ===========================================

export const faqs = pgTable('faqs', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  category: text('category').default('general'),
  orderNum: integer('order_num').default(0),
  isActive: boolean('is_active').default(true),
}, (table) => [
  index('idx_faqs_store').on(table.storeId),
]);

export const banners = pgTable('banners', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  image: text('image').notNull(),
  title: text('title'),
  subtitle: text('subtitle'),
  buttonText: text('button_text'),
  buttonLink: text('button_link'),
  orderNum: integer('order_num').default(0),
  isActive: boolean('is_active').default(true),
}, (table) => [
  index('idx_banners_store').on(table.storeId),
]);

// ===========================================
// REVIEWS
// ===========================================

export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  userId: text('user_id'),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email'),
  rating: integer('rating').notNull(), // 1-5
  title: text('title'),
  comment: text('comment'),
  isVerifiedPurchase: boolean('is_verified_purchase').default(false),
  isApproved: boolean('is_approved').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_reviews_store').on(table.storeId),
  index('idx_reviews_product').on(table.productId),
  index('idx_reviews_rating').on(table.rating),
  index('idx_reviews_is_approved').on(table.isApproved),
]);

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

// ===========================================
// WISHLIST
// ===========================================

export const wishlist = pgTable('wishlist', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  userId: text('user_id'),
  sessionId: text('session_id'),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_wishlist_store').on(table.storeId),
  index('idx_wishlist_product').on(table.productId),
]);

export const wishlistRelations = relations(wishlist, ({ one }) => ({
  product: one(products, {
    fields: [wishlist.productId],
    references: [products.id],
  }),
}));

// ===========================================
// ABANDONED CARTS
// ===========================================

export const abandonedCarts = pgTable('abandoned_carts', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  sessionId: text('session_id'),
  email: text('email'),
  cartData: text('cart_data').notNull(), // JSON as string
  reminderSent: boolean('reminder_sent').default(false),
  recovered: boolean('recovered').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('idx_abandoned_carts_store').on(table.storeId),
]);

// ===========================================
// STOCK MOVEMENTS - Historical Audit Trail
// ===========================================

export const stockMovements = pgTable('stock_movements', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  delta: integer('delta').notNull(), // Change in stock (e.g., -1, +5)
  previousStock: integer('previous_stock').notNull(),
  newStock: integer('new_stock').notNull(),
  reason: text('reason').notNull(), // 'sale', 'restock', 'correction', 'return', etc.
  userId: text('user_id').references(() => users.id), // Optional: who made the change
  orderId: text('order_id').references(() => orders.id), // Optional: related order
  notes: text('notes'), // Optional additional context
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_stock_movements_store').on(table.storeId),
  index('idx_stock_movements_product').on(table.productId),
  index('idx_stock_movements_created').on(table.createdAt),
]);

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  store: one(stores, {
    fields: [stockMovements.storeId],
    references: [stores.id],
  }),
  product: one(products, {
    fields: [stockMovements.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [stockMovements.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [stockMovements.orderId],
    references: [orders.id],
  }),
}));

// ===========================================
// TYPE EXPORTS
// ===========================================

// Infer types from schema for use in application code
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type Shipment = typeof shipments.$inferSelect;
export type NewShipment = typeof shipments.$inferInsert;

export type StoreConfigRow = typeof storeConfig.$inferSelect;
export type NewStoreConfigRow = typeof storeConfig.$inferInsert;

export type FAQ = typeof faqs.$inferSelect;
export type NewFAQ = typeof faqs.$inferInsert;

export type Banner = typeof banners.$inferSelect;
export type NewBanner = typeof banners.$inferInsert;

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;

export type WishlistItem = typeof wishlist.$inferSelect;
export type NewWishlistItem = typeof wishlist.$inferInsert;

export type AbandonedCart = typeof abandonedCarts.$inferSelect;
export type NewAbandonedCart = typeof abandonedCarts.$inferInsert;

export type StockMovement = typeof stockMovements.$inferSelect;
export type NewStockMovement = typeof stockMovements.$inferInsert;

// ===========================================
// SYSTEM SETTINGS - Global Configuration
// ===========================================
// Stores system-wide settings that can be configured from Mothership
// Sensitive values are stored encrypted

export const systemSettings = pgTable('system_settings', {
  id: text('id').primaryKey().default('global'), // Only one row, ID is always 'global'
  
  // SMTP Configuration
  smtpHost: text('smtp_host'),
  smtpPort: text('smtp_port'),
  smtpSecure: boolean('smtp_secure').default(true),
  smtpUser: text('smtp_user'),
  smtpPass: text('smtp_pass'), // Encrypted
  smtpFromEmail: text('smtp_from_email'),
  smtpFromName: text('smtp_from_name'),
  
  // Sentry Configuration
  sentryDsn: text('sentry_dsn'), // Encrypted
  sentryEnabled: boolean('sentry_enabled').default(false),
  
  // Cloudinary Configuration (Global fallback)
  cloudinaryCloudName: text('cloudinary_cloud_name'),
  cloudinaryApiKey: text('cloudinary_api_key'), // Encrypted
  cloudinaryApiSecret: text('cloudinary_api_secret'), // Encrypted
  
  // System
  updatedAt: timestamp('updated_at').defaultNow(),
  updatedBy: text('updated_by'), // Admin email who last updated
});

export type SystemSettings = typeof systemSettings.$inferSelect;
export type NewSystemSettings = typeof systemSettings.$inferInsert;

// ===========================================
// LANDING PAGE CONFIG (CMS)
// ===========================================

export const landingConfig = pgTable('landing_config', {
  id: integer('id').primaryKey().default(1), // Singleton row
  content: jsonb('content').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
  updatedBy: text('updated_by').references(() => users.id),
});

export type LandingConfig = typeof landingConfig.$inferSelect;
export type NewLandingConfig = typeof landingConfig.$inferInsert;

// ===========================================
// PRODUCT PAGE BUILDER CONFIG
// ===========================================
// Stores per-store product page layouts with widget configurations
// Supports tiered access (Pro/Enterprise features)

export const productPageConfig = pgTable('product_page_config', {
  id: text('id').primaryKey(),
  storeId: text('store_id').unique().notNull().references(() => stores.id, { onDelete: 'cascade' }),
  
  // Widget layout configuration
  blocks: jsonb('blocks').$type<{
    id: string;
    type: string;
    order: number;
    isActive: boolean;
    requiredPlan: 'free' | 'starter' | 'pro' | 'enterprise';
    config: Record<string, unknown>;
  }[]>(),
  
  // Global styling options (Pro+)
  globalStyles: jsonb('global_styles').$type<{
    accentColor?: string;
    buttonStyle?: 'solid' | 'outline' | 'ghost';
    galleryLayout?: 'grid' | 'carousel' | 'stack';
    showBreadcrumbs?: boolean;
    stickyBuyBox?: boolean;
  }>(),
  
  // Layout configuration
  layoutConfig: jsonb('layout_config').$type<{
    gridType: 'classic' | 'full-width' | 'gallery-left' | 'gallery-right';
    leftColumn: string[];
    rightColumn: string[];
    fullWidth: string[];
  }>(),
  
  // Enable/disable custom layout
  isEnabled: boolean('is_enabled').default(false),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('idx_product_page_config_store').on(table.storeId),
]);

export type ProductPageConfig = typeof productPageConfig.$inferSelect;
export type NewProductPageConfig = typeof productPageConfig.$inferInsert;

// ===========================================
// SAAS SALES - Platform Revenue Tracking
// ===========================================
// Tracks store subscriptions purchased through the landing page
// License keys are hashed for security (raw key emailed once)

export const saasSales = pgTable('saas_sales', {
  id: text('id').primaryKey(), // UUID
  
  // Payment Info
  externalReference: text('external_reference').unique().notNull(), // "saas_<uuid>" for MP webhook matching
  paymentId: text('payment_id'), // MercadoPago payment ID
  paymentProvider: text('payment_provider').default('mercadopago'),
  
  // Plan & Pricing
  plan: text('plan').notNull(), // 'free', 'starter', 'pro', 'enterprise'
  amount: integer('amount').notNull(), // In cents (e.g., 1900 = $19)
  currency: text('currency').default('ARS'),
  
  // Buyer Info
  buyerEmail: text('buyer_email').notNull(),
  buyerName: text('buyer_name'),
  storeName: text('store_name'), // Requested store name
  
  // Status
  status: text('status').default('pending'), // 'pending', 'paid', 'provisioned', 'failed', 'refunded'
  
  // Provisioning
  storeId: text('store_id').references(() => stores.id, { onDelete: 'set null' }),
  licenseKeyHash: text('license_key_hash'), // Bcrypt hash of the license key (raw key sent via email only once)
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  paidAt: timestamp('paid_at'),
  provisionedAt: timestamp('provisioned_at'),
  
  // Error tracking
  errorMessage: text('error_message'),
}, (table) => [
  index('idx_saas_sales_status').on(table.status),
  index('idx_saas_sales_email').on(table.buyerEmail),
  index('idx_saas_sales_created').on(table.createdAt),
]);

export const saasSalesRelations = relations(saasSales, ({ one }) => ({
  store: one(stores, {
    fields: [saasSales.storeId],
    references: [stores.id],
  }),
}));

export type SaasSale = typeof saasSales.$inferSelect;
export type NewSaasSale = typeof saasSales.$inferInsert;

