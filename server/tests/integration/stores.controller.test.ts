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
    offset: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  },
}));

vi.mock('../../src/services/store.service.js', () => ({
  storeService: {
    getAllStores: vi.fn(),
    getStoreById: vi.fn(),
    createStore: vi.fn(),
    updateStore: vi.fn(),
    deleteStore: vi.fn(),
    getStoreStats: vi.fn(),
    getStoreAdmins: vi.fn(),
    resetAdminPassword: vi.fn(),
    bulkDeleteStores: vi.fn(),
  },
}));

describe('Stores Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllStores()', () => {
    it('should return stores list', async () => {
      const { getAllStores } = await import('../../src/controllers/stores.controller.js');
      const { storeService } = await import('../../src/services/store.service.js');
      
      (storeService.getAllStores as any).mockResolvedValue({
        stores: [],
        pagination: { total: 0, page: 1, limit: 20, pages: 0 }
      });

      const req = createMockRequest({
        query: { page: '1', limit: '20' }
      });
      const res = createMockResponse();

      await getAllStores(req as any, res as any);

      expect(res._status).toBe(200);
      expect(res._json.data.stores).toEqual([]);
    });
  });

  describe('getStoreById()', () => {
    it('should return 404 when store not found', async () => {
      const { getStoreById } = await import('../../src/controllers/stores.controller.js');
      const { storeService } = await import('../../src/services/store.service.js');
      
      (storeService.getStoreById as any).mockRejectedValue(new Error('Store not found'));

      const req = createMockRequest({
        params: { id: 'nonexistent' }
      });
      const res = createMockResponse();

      await getStoreById(req as any, res as any);

      expect(res._status).toBe(404);
      expect(res._json.error).toBe('Store not found');
    });

    it('should return store details', async () => {
      const { getStoreById } = await import('../../src/controllers/stores.controller.js');
      const { storeService } = await import('../../src/services/store.service.js');
      
      (storeService.getStoreById as any).mockResolvedValue({
        store: { id: 'store-1', name: 'Test' },
        license: null,
        stats: { products: 0, orders: 0, users: 0 }
      });

      const req = createMockRequest({
        params: { id: 'store-1' }
      });
      const res = createMockResponse();

      await getStoreById(req as any, res as any);

      expect(res._status).toBe(200);
      expect(res._json.store.id).toBe('store-1');
    });
  });

  describe('createStore()', () => {
    it('should return 400 when name/email missing', async () => {
      const { createStore } = await import('../../src/controllers/stores.controller.js');
      const { storeService } = await import('../../src/services/store.service.js');
      
      (storeService.createStore as any).mockRejectedValue(new Error('Name and owner email are required'));

      const req = createMockRequest({
        body: { name: 'Test' } // missing email
      });
      const res = createMockResponse();

      await createStore(req as any, res as any);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('required');
    });

    it('should create store successfully', async () => {
      const { createStore } = await import('../../src/controllers/stores.controller.js');
      const { storeService } = await import('../../src/services/store.service.js');
      
      (storeService.createStore as any).mockResolvedValue({
        store: { id: 'new-store' },
        license: { serial: 'LICENSE-KEY' }
      });

      const req = createMockRequest({
        body: { name: 'Test Store', ownerEmail: 'test@test.com' }
      });
      const res = createMockResponse();

      await createStore(req as any, res as any);

      expect(res._status).toBe(201);
      expect(res._json.message).toContain('successfully');
    });
  });

  describe('deleteStore()', () => {
    it('should return 404 when store not found', async () => {
      const { deleteStore } = await import('../../src/controllers/stores.controller.js');
      const { storeService } = await import('../../src/services/store.service.js');
      
      (storeService.deleteStore as any).mockRejectedValue(new Error('Store not found'));

      const req = createMockRequest({
        params: { id: 'nonexistent' }
      });
      const res = createMockResponse();

      await deleteStore(req as any, res as any);

      expect(res._status).toBe(404);
    });

    it('should delete store successfully', async () => {
      const { deleteStore } = await import('../../src/controllers/stores.controller.js');
      const { storeService } = await import('../../src/services/store.service.js');
      
      (storeService.deleteStore as any).mockResolvedValue(undefined);

      const req = createMockRequest({
        params: { id: 'store-1' }
      });
      const res = createMockResponse();

      await deleteStore(req as any, res as any);

      expect(res._status).toBe(200);
      expect(res._json.message).toContain('deleted');
    });
  });
});
