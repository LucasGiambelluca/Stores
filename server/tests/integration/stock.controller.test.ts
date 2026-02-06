import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockResponse } from '../helpers/mocks.js';

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
  },
  products: { id: 'id', storeId: 'storeId', stock: 'stock' },
  storeConfig: { key: 'key', storeId: 'storeId', value: 'value' },
}));

describe('Stock Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStockSummary()', () => {
    it('should return 400 when storeId is missing', async () => {
      const { getStockSummary } = await import('../../src/controllers/stock.controller.js');
      
      const req = createMockRequest({
        storeId: undefined,
      });
      const res = createMockResponse();

      await getStockSummary(req as any, res as any);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('Store ID');
    });
  });

  describe('getLowStock()', () => {
    it('should return 400 when storeId is missing', async () => {
      const { getLowStock } = await import('../../src/controllers/stock.controller.js');
      
      const req = createMockRequest({
        storeId: undefined,
        query: {},
      });
      const res = createMockResponse();

      await getLowStock(req as any, res as any);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('Store ID');
    });
  });

  describe('getOutOfStock()', () => {
    it('should return 400 when storeId is missing', async () => {
      const { getOutOfStock } = await import('../../src/controllers/stock.controller.js');
      
      const req = createMockRequest({
        storeId: undefined,
        query: {},
      });
      const res = createMockResponse();

      await getOutOfStock(req as any, res as any);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('Store ID');
    });
  });

  describe('getThreshold()', () => {
    it('should return 400 when storeId is missing', async () => {
      const { getThreshold } = await import('../../src/controllers/stock.controller.js');
      
      const req = createMockRequest({
        storeId: undefined,
      });
      const res = createMockResponse();

      await getThreshold(req as any, res as any);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('Store ID');
    });
  });

  describe('setThreshold()', () => {
    it('should return 400 when storeId is missing', async () => {
      const { setThreshold } = await import('../../src/controllers/stock.controller.js');
      
      const req = createMockRequest({
        storeId: undefined,
        body: { threshold: 10 },
      });
      const res = createMockResponse();

      await setThreshold(req as any, res as any);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('Store ID');
    });

    it('should return 400 for invalid threshold', async () => {
      const { setThreshold } = await import('../../src/controllers/stock.controller.js');
      
      const req = createMockRequest({
        storeId: 'test-store',
        body: { threshold: -5 },
      });
      const res = createMockResponse();

      await setThreshold(req as any, res as any);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('Umbral inválido');
    });
  });
});
