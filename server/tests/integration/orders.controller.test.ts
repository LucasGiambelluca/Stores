import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockResponse } from '../helpers/mocks.js';

// Create mock transaction
const mockTx = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  execute: vi.fn().mockResolvedValue([]),
};

// Mock RLS module
vi.mock('../../src/db/rls.js', () => ({
  withStore: vi.fn(async (storeId: string, callback: any) => callback(mockTx)),
  withStoreContext: vi.fn(async (storeId: string, callback: any) => callback(mockTx)),
}));

// Mock dependencies
vi.mock('../../src/db/drizzle.js', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue(undefined),
    transaction: vi.fn(async (callback: any) => callback(mockTx)),
  },
  orders: { id: 'id', orderNumber: 'orderNumber', status: 'status', storeId: 'storeId' },
  orderItems: { id: 'id', orderId: 'orderId' },
  products: { id: 'id', storeId: 'storeId', stock: 'stock' },
}));

vi.mock('../../src/controllers/products.controller.js', () => ({
  checkStock: vi.fn(),
  batchUpdateStock: vi.fn().mockResolvedValue(true),
}));

vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('mock-uuid'),
}));

// Mock licenseEnforcement to allow order creation
vi.mock('../../src/middleware/licenseEnforcement.middleware.js', () => ({
  getLicenseUsage: vi.fn().mockResolvedValue({
    maxProducts: 2000,
    maxOrders: null,
    canCreateOrder: true,
    canCreateProduct: true,
  }),
}));

// Helper to setup mockTx for select queries
function setupMockTxSelectChain(data: any[], includeLimit = false) {
  if (includeLimit) {
    mockTx.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(data),
        }),
      }),
    });
  } else {
    mockTx.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(data),
      }),
    });
  }
}

describe('Orders Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mockTx
    mockTx.select.mockReturnThis();
    mockTx.from.mockReturnThis();
    mockTx.where.mockReturnThis();
    mockTx.limit.mockReturnThis();
  });

  describe('createOrder()', () => {
    it('should return 400 when customer email is missing', async () => {
      const { createOrder } = await import('../../src/controllers/orders.controller.js');
      
      const req = createMockRequest({
        storeId: 'test-store',
        body: {
          customerName: 'Test Customer',
          items: [{ productId: 'p1', quantity: 1, price: 100, productName: 'Test' }],
        },
      });
      const res = createMockResponse();

      await createOrder(req as any, res as any);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('incompletos');
    });

    it('should return 400 when customer name is missing', async () => {
      const { createOrder } = await import('../../src/controllers/orders.controller.js');
      
      const req = createMockRequest({
        storeId: 'test-store',
        body: {
          customerEmail: 'test@test.com',
          items: [{ productId: 'p1', quantity: 1, price: 100, productName: 'Test' }],
        },
      });
      const res = createMockResponse();

      await createOrder(req as any, res as any);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('incompletos');
    });

    it('should return 400 when items are empty', async () => {
      const { createOrder } = await import('../../src/controllers/orders.controller.js');
      
      const req = createMockRequest({
        storeId: 'test-store',
        body: {
          customerEmail: 'test@test.com',
          customerName: 'Test Customer',
          items: [],
        },
      });
      const res = createMockResponse();

      await createOrder(req as any, res as any);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('incompletos');
    });

    // TODO: This test needs full transaction chain mocking. Consider E2E test instead.
    it.skip('should return 400 when stock is insufficient', async () => {
      const { createOrder } = await import('../../src/controllers/orders.controller.js');
      
      // Mock product with insufficient stock via mockTx
      // The orders service validates stock inside withStore using tx.select
      setupMockTxSelectChain([{ 
        id: 'p1', 
        name: 'iPhone', 
        stock: 2, // Only 2 in stock
        price: 100,
        storeId: 'test-store'
      }]);

      const req = createMockRequest({
        storeId: 'test-store',
        body: {
          customerEmail: 'test@test.com',
          customerName: 'Test Customer',
          items: [{ productId: 'p1', quantity: 10, price: 100, productName: 'iPhone' }],
        },
      });
      const res = createMockResponse();

      await createOrder(req as any, res as any);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('Stock insuficiente');
    });

    // TODO: This test needs full transaction chain mocking. Consider E2E test instead.
    it.skip('should return 400 when products not found', async () => {
      const { createOrder } = await import('../../src/controllers/orders.controller.js');
      
      // Mock no products found via mockTx
      setupMockTxSelectChain([]);

      const req = createMockRequest({
        storeId: 'test-store',
        body: {
          customerEmail: 'test@test.com',
          customerName: 'Test Customer',
          items: [{ productId: 'p1', quantity: 1, price: 100, productName: 'Test' }],
        },
      });
      const res = createMockResponse();

      await createOrder(req as any, res as any);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('No se encontraron');
    });
  });

  describe('getOrder()', () => {
    it('should return 404 when order not found', async () => {
      const { getOrder } = await import('../../src/controllers/orders.controller.js');
      
      // Mock no order found
      setupMockTxSelectChain([], true);

      const req = createMockRequest({
        storeId: 'test-store',
        params: { id: 'nonexistent-order' },
      });
      const res = createMockResponse();

      await getOrder(req as any, res as any);

      expect(res._status).toBe(404);
      expect(res._json.error).toContain('no encontrada');
    });
  });

  describe('updateOrderStatus()', () => {
    it('should return 404 when order not found', async () => {
      const { updateOrderStatus } = await import('../../src/controllers/orders.controller.js');
      
      // Mock no order found
      setupMockTxSelectChain([], true);

      const req = createMockRequest({
        storeId: 'test-store',
        params: { id: 'nonexistent-order' },
        body: { status: 'paid' },
      });
      const res = createMockResponse();

      await updateOrderStatus(req as any, res as any);

      expect(res._status).toBe(404);
      expect(res._json.error).toContain('no encontrada');
    });

    it('should return 400 for invalid status', async () => {
      const { updateOrderStatus } = await import('../../src/controllers/orders.controller.js');
      
      // Mock order found
      setupMockTxSelectChain([{
        id: 'order-1',
        orderNumber: 'XM-123',
        status: 'pending',
      }], true);

      const req = createMockRequest({
        storeId: 'test-store',
        params: { id: 'order-1' },
        body: { status: 'invalid_status' },
      });
      const res = createMockResponse();

      await updateOrderStatus(req as any, res as any);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('Estado inválido');
    });
  });

  describe('uploadReceipt()', () => {
    it('should return 400 when receipt URL is missing', async () => {
      const { uploadReceipt } = await import('../../src/controllers/orders.controller.js');
      
      const req = createMockRequest({
        params: { orderId: 'order-1' },
        body: {},
      });
      const res = createMockResponse();

      await uploadReceipt(req as any, res as any);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('URL del comprobante');
    });
  });
});
