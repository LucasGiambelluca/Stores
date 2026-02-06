import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockResponse } from '../helpers/mocks.js';

// Mock dependencies
vi.mock('../../src/db/drizzle.js', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    query: {
      stores: {
        findFirst: vi.fn().mockResolvedValue({ id: 'store-1' }),
      },
    },
  },
}));

vi.mock('../../src/services/config.service.js', () => ({
  configService: {
    getAllConfig: vi.fn(),
    setConfigValue: vi.fn(),
    initialSetup: vi.fn(),
  },
}));

describe('Config Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStoreConfig()', () => {
    it('should return default config when no db config exists', async () => {
      const { getStoreConfig } = await import('../../src/controllers/config.controller.js');
      const { configService } = await import('../../src/services/config.service.js');
      
      (configService.getAllConfig as any).mockResolvedValue({});

      const req = createMockRequest({
        storeId: 'store-1',
      });
      const res = createMockResponse();

      await getStoreConfig(req as any, res as any);

      expect(res._status).toBe(200);
      expect(res._json.store.name).toBeDefined();
      expect(res._json.isConfigured).toBe(false);
    });

    it('should return configured flag when store is configured', async () => {
      const { getStoreConfig } = await import('../../src/controllers/config.controller.js');
      const { configService } = await import('../../src/services/config.service.js');
      
      (configService.getAllConfig as any).mockResolvedValue({
        'store_name': 'Test Store',
        'is_configured': 'true',
      });

      const req = createMockRequest({
        storeId: 'store-1',
      });
      const res = createMockResponse();

      await getStoreConfig(req as any, res as any);

      expect(res._status).toBe(200);
      expect(res._json.store.name).toBe('Test Store');
      expect(res._json.isConfigured).toBe(true);
    });
  });

  describe('updateStoreConfig()', () => {
    it('should return 400 when updates are invalid', async () => {
      const { updateStoreConfig } = await import('../../src/controllers/config.controller.js');
      
      const req = createMockRequest({
        body: null,
      });
      const res = createMockResponse();

      await updateStoreConfig(req as any, res as any);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('inválidos');
    });

    it('should update config successfully', async () => {
      const { updateStoreConfig } = await import('../../src/controllers/config.controller.js');
      const { configService } = await import('../../src/services/config.service.js');
      
      const req = createMockRequest({
        user: { storeId: 'store-1' },
        body: {
          name: 'New Name',
          email: 'new@email.com',
        },
      });
      const res = createMockResponse();

      await updateStoreConfig(req as any, res as any);

      expect(configService.setConfigValue).toHaveBeenCalled();
      expect(res._status).toBe(200);
      expect(res._json.success).toBe(true);
    });
  });

  describe('initialSetup()', () => {
    it('should return 403 if already configured', async () => {
      const { initialSetup } = await import('../../src/controllers/config.controller.js');
      const { configService } = await import('../../src/services/config.service.js');
      
      (configService.initialSetup as any).mockRejectedValue(new Error('La tienda ya está configurada'));

      const req = createMockRequest({
        body: { name: 'Test' },
      });
      const res = createMockResponse();

      await initialSetup(req as any, res as any);

      expect(res._status).toBe(403);
      expect(res._json.error).toContain('ya está configurada');
    });

    it('should complete setup successfully', async () => {
      const { initialSetup } = await import('../../src/controllers/config.controller.js');
      const { configService } = await import('../../src/services/config.service.js');
      
      (configService.initialSetup as any).mockResolvedValue('Tienda configurada correctamente');

      const req = createMockRequest({
        body: { name: 'Test' },
      });
      const res = createMockResponse();

      await initialSetup(req as any, res as any);

      expect(res._status).toBe(200);
      expect(res._json.success).toBe(true);
    });
  });
});
