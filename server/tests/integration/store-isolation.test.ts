/**
 * Store Isolation Penetration Test
 * 
 * This test verifies that data from one store cannot be accessed from another store.
 * It creates resources in Store A and attempts to access/modify them from Store B.
 * 
 * All tests should PASS only if cross-store access is properly blocked (404 responses).
 * 
 * NOTE: These tests require a real database connection. They are skipped in CI
 * environments without a database or when using mock DATABASE_URL.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

// Check if we have a real database connection (not the mock test URL)
const hasRealDb = process.env.DATABASE_URL && 
  !process.env.DATABASE_URL.includes('localhost:5432/tiendita_test') &&
  !process.env.DATABASE_URL.includes('test:test@');

// Skip all tests if no real DB
const describeWithDb = hasRealDb ? describe : describe.skip;

// Only import DB modules if we have a real connection
let db: any, products: any, orders: any, categories: any, stores: any, users: any, licenses: any;
let eq: any;
let ProductsService: any, OrdersService: any;

if (hasRealDb) {
  const drizzle = await import('../../src/db/drizzle.js');
  db = drizzle.db;
  products = drizzle.products;
  orders = drizzle.orders;
  categories = drizzle.categories;
  stores = drizzle.stores;
  users = drizzle.users;
  licenses = drizzle.licenses;
  
  const orm = await import('drizzle-orm');
  eq = orm.eq;
  
  const prodService = await import('../../src/services/products.service.js');
  ProductsService = prodService.ProductsService;
  
  const orderService = await import('../../src/services/orders.service.js');
  OrdersService = orderService.OrdersService;
}

// Test fixtures
const STORE_A = {
  id: 'store-a-test-' + uuidv4().slice(0, 8),
  name: 'Store A (Victim)',
  domain: 'store-a-test',
  status: 'active',
  plan: 'pro',
  ownerEmail: 'owner-a@test.com',
};

const STORE_B = {
  id: 'store-b-test-' + uuidv4().slice(0, 8),
  name: 'Store B (Attacker)',
  domain: 'store-b-test',
  status: 'active',
  plan: 'pro',
  ownerEmail: 'owner-b@test.com',
};

const PRODUCT_FROM_STORE_A = {
  id: 'product-a-test-' + uuidv4().slice(0, 8),
  storeId: STORE_A.id,
  name: 'Secret Product from Store A',
  price: 9999,
  stock: 10,
};

describeWithDb('Store Isolation Security Tests', () => {
  beforeAll(async () => {
    // Create test stores
    await db.insert(stores).values([
      { ...STORE_A, createdAt: new Date(), updatedAt: new Date() },
      { ...STORE_B, createdAt: new Date(), updatedAt: new Date() },
    ]).onConflictDoNothing();

    // Create a product in Store A
    await db.insert(products).values({
      id: PRODUCT_FROM_STORE_A.id,
      storeId: PRODUCT_FROM_STORE_A.storeId,
      name: PRODUCT_FROM_STORE_A.name,
      price: PRODUCT_FROM_STORE_A.price,
      stock: PRODUCT_FROM_STORE_A.stock,
    }).onConflictDoNothing();
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(products).where(eq(products.id, PRODUCT_FROM_STORE_A.id));
    await db.delete(stores).where(eq(stores.id, STORE_A.id));
    await db.delete(stores).where(eq(stores.id, STORE_B.id));
  });

  describe('ProductsService Isolation', () => {
    it('should NOT find product from Store A when querying as Store B', async () => {
      // Attempt to find Store A's product while being authenticated as Store B
      const product = await ProductsService.findById(PRODUCT_FROM_STORE_A.id, STORE_B.id);
      
      // Should return null (product not found for this store)
      expect(product).toBeNull();
    });

    it('should find product from Store A when querying as Store A', async () => {
      // Same query but with correct store context
      const product = await ProductsService.findById(PRODUCT_FROM_STORE_A.id, STORE_A.id);
      
      // Should find the product
      expect(product).not.toBeNull();
      expect(product?.name).toBe(PRODUCT_FROM_STORE_A.name);
    });

    it('should NOT update product from Store A when authenticated as Store B', async () => {
      // Attempt to update Store A's product while being authenticated as Store B
      const result = await ProductsService.update(
        PRODUCT_FROM_STORE_A.id,
        { name: 'Hacked by Store B!', price: 1 },
        STORE_B.id
      );
      
      // Should fail (return null = not found)
      expect(result).toBeNull();

      // Verify product was NOT modified
      const product = await ProductsService.findById(PRODUCT_FROM_STORE_A.id, STORE_A.id);
      expect(product?.name).toBe(PRODUCT_FROM_STORE_A.name);
    });

    it('should NOT delete product from Store A when authenticated as Store B', async () => {
      // Attempt to delete Store A's product while being authenticated as Store B
      const result = await ProductsService.delete(PRODUCT_FROM_STORE_A.id, STORE_B.id);
      
      // Should fail (return false = not found/deleted)
      expect(result).toBe(false);

      // Verify product still exists
      const product = await ProductsService.findById(PRODUCT_FROM_STORE_A.id, STORE_A.id);
      expect(product).not.toBeNull();
    });

    it('should return empty array when listing products without storeId', async () => {
      // findAll with undefined storeId should return empty (strict isolation)
      const result = await ProductsService.findAll(undefined, {});
      
      expect(result.products).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('Cross-Store Data Leakage Prevention', () => {
    it('should NOT leak product counts across stores', async () => {
      // Store A should only see its own products
      const storeAProducts = await ProductsService.findAll(STORE_A.id, {});
      const storeBProducts = await ProductsService.findAll(STORE_B.id, {});
      
      // Store A has at least 1 product (our test product)
      expect(storeAProducts.products.length).toBeGreaterThanOrEqual(1);
      
      // Store B should not see Store A's products
      const storeBHasStoreAProduct = storeBProducts.products.some(
        (p: { id: string }) => p.id === PRODUCT_FROM_STORE_A.id
      );
      expect(storeBHasStoreAProduct).toBe(false);
    });
  });
});
