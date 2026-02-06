import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockResponse } from '../helpers/mocks.js';
import * as productsController from '../../src/controllers/products.controller.js';

// Create mock transaction that passes through
const mockTx = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  execute: vi.fn().mockResolvedValue([]),
};

// Mock the RLS module
vi.mock('../../src/db/rls.js', () => ({
  withStore: vi.fn(async (storeId, callback) => callback(mockTx)),
  withStoreContext: vi.fn(async (storeId, callback) => callback(mockTx)),
}));

// Mock the database module
vi.mock('../../src/db/drizzle.js', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    transaction: vi.fn(async (callback: (tx: any) => Promise<any>) => callback(mockTx)),
    query: {
      products: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
      },
    },
  },
  products: {
    id: 'id',
    name: 'name',
    price: 'price',
    stock: 'stock',
    storeId: 'storeId',
  },
  categories: {
    id: 'id',
    name: 'name',
    slug: 'slug',
  },
}));

// Helper to setup mockTx for select queries
function setupMockTxSelect(data: any[]) {
  mockTx.select.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(data),
    }),
  });
}

describe('Products Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mockTx to default behavior
    mockTx.select.mockReturnThis();
    mockTx.from.mockReturnThis();
    mockTx.where.mockReturnThis();
    mockTx.execute.mockResolvedValue([]);
  });

  describe('checkStock()', () => {
    it('should return valid=true when all items have sufficient stock', async () => {
      // Setup mockTx to return products with sufficient stock
      setupMockTxSelect([
        { id: 'prod-1', name: 'Product 1', stock: 100 },
        { id: 'prod-2', name: 'Product 2', stock: 50 }
      ]);

      const items = [
        { productId: 'prod-1', quantity: 10 },
        { productId: 'prod-2', quantity: 5 },
      ];

      const result = await productsController.checkStock(items);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid=false with errors when stock is insufficient', async () => {
      // Setup mockTx to return product with insufficient stock
      setupMockTxSelect([{ id: 'prod-1', name: 'iPhone', stock: 2 }]);

      const items = [{ productId: 'prod-1', quantity: 10 }];

      const result = await productsController.checkStock(items);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Stock insuficiente');
      expect(result.errors[0]).toContain('iPhone');
    });

    it('should return error when product not found', async () => {
      // Setup mockTx to return empty array (product not found)
      setupMockTxSelect([]);

      const items = [{ productId: 'nonexistent', quantity: 1 }];

      const result = await productsController.checkStock(items);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Producto no encontrado');
    });

    it('should handle empty items array', async () => {
      const result = await productsController.checkStock([]);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('updateStock()', () => {
    it('should return true when stock update succeeds', async () => {
      const { db } = await import('../../src/db/drizzle.js');
      
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const result = await productsController.updateStock('prod-1', 10);

      expect(result).toBe(true);
    });

    // Note: updateStock now always returns true unless an exception is thrown
    // The verification query was removed for optimization
    it('should return true even when product may not exist (fire-and-forget)', async () => {
      const { db } = await import('../../src/db/drizzle.js');
      
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const result = await productsController.updateStock('nonexistent', 10);

      // Returns true because update succeeds (just affects 0 rows)
      expect(result).toBe(true);
    });
  });

  describe('createProduct()', () => {
    it('should return 400 when name is missing', async () => {
      const req = createMockRequest({
        body: { price: 100 },
        user: { id: 'user-1', storeId: 'store-1' },
      });
      const res = createMockResponse();

      await productsController.createProduct(req as any, res as any);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('Nombre y precio');
    });

    it('should return 400 when price is missing', async () => {
      const req = createMockRequest({
        body: { name: 'Test Product' },
        user: { id: 'user-1', storeId: 'store-1' },
      });
      const res = createMockResponse();

      await productsController.createProduct(req as any, res as any);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('Nombre y precio');
    });

    it('should return 400 when storeId is missing from user', async () => {
      const req = createMockRequest({
        body: { name: 'Test Product', price: 100 },
        user: { id: 'user-1' }, // No storeId
      });
      const res = createMockResponse();

      await productsController.createProduct(req as any, res as any);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('Store context required');
    });
  });
});
