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
    groupBy: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
  },
  orders: { id: 'id', status: 'status', total: 'total', createdAt: 'createdAt', storeId: 'storeId' },
  orderItems: { orderId: 'orderId', productId: 'productId', storeId: 'storeId', quantity: 'quantity', price: 'price', productName: 'productName' },
  products: { id: 'id', storeId: 'storeId' },
  users: { id: 'id', storeId: 'storeId', role: 'role' },
}));

// Mock licenseEnforcement middleware
vi.mock('../../src/middleware/licenseEnforcement.middleware.js', () => ({
  getLicenseUsage: vi.fn().mockResolvedValue({ maxProducts: 2000, maxOrders: null }),
}));

describe('Analytics Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboard()', () => {
    it('should return 400 when storeId is missing', async () => {
      const { getDashboard } = await import('../../src/controllers/analytics.controller.js');
      
      const req = createMockRequest({
        storeId: undefined,
        query: {},
      });
      const res = createMockResponse();

      await getDashboard(req as any, res as any);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('Store');
    });

    it('should return 403 when no license found', async () => {
      const { getDashboard } = await import('../../src/controllers/analytics.controller.js');
      const { getLicenseUsage } = await import('../../src/middleware/licenseEnforcement.middleware.js');
      
      // Mock no license
      (getLicenseUsage as any).mockResolvedValueOnce(null);
      
      const req = createMockRequest({
        storeId: 'test-store',
        query: {},
      });
      const res = createMockResponse();

      await getDashboard(req as any, res as any);

      expect(res._status).toBe(403);
    });
  });
});

