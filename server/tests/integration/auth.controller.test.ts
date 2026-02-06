import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockResponse } from '../helpers/mocks.js';

// Create mock transaction
const mockTx = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
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
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    transaction: vi.fn(async (callback: any) => callback(mockTx)),
    query: {
      stores: {
        findFirst: vi.fn().mockResolvedValue({ id: 'store-1', name: 'Test Store' }),
      },
    },
  },
  users: { id: 'id', email: 'email', password: 'password', storeId: 'storeId' },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2a$10$hashedpassword'),
    compare: vi.fn(),
  },
}));

vi.mock('../../src/middleware/auth.js', () => ({
  generateToken: vi.fn().mockReturnValue('mock-jwt-token'),
  generateTokenPair: vi.fn().mockReturnValue({ 
    accessToken: 'mock-jwt-token', 
    refreshToken: 'mock-refresh-token' 
  }),
  AuthUser: {},
}));

vi.mock('../../src/services/audit.service.js', () => ({
  logAudit: vi.fn(),
  getRequestInfo: vi.fn().mockReturnValue({ ip: '127.0.0.1', userAgent: 'test' }),
}));

vi.mock('../../src/env.js', () => ({
  env: {
    ADMIN_EMAIL: 'admin@test.com',
    ADMIN_PASSWORD: 'adminpass',
  },
}));

vi.mock('../../src/services/store.service.js', () => ({
  storeService: {
    checkDomainAvailability: vi.fn().mockResolvedValue(true),
    createStore: vi.fn().mockResolvedValue({ store: { id: 'new-store', name: 'New Store' } }),
  },
}));

vi.mock('../../src/services/email.service.js', () => ({
  sendPasswordReset: vi.fn().mockResolvedValue(undefined),
}));

describe('Auth Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register()', () => {
    it('should return 500 when registration fails without store context', async () => {
      const { register } = await import('../../src/controllers/auth.controller.js');
      
      const req = createMockRequest({
        body: { email: 'test@test.com', password: 'test12345678' },
        storeId: undefined,
      });
      const res = createMockResponse();

      await register(req as any, res as any);

      // Without storeId and without storeName, it should fail
      expect([400, 500]).toContain(res._status);
    });

    it('should return 400 when email already exists', async () => {
      const { register } = await import('../../src/controllers/auth.controller.js');
      
      // Mock existing user in transaction
      mockTx.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 'existing-user' }]),
          }),
        }),
      });

      const req = createMockRequest({
        body: { email: 'exists@test.com', password: 'test12345678' },
        storeId: 'store-1',
      });
      const res = createMockResponse();

      await register(req as any, res as any);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('ya está registrado');
    });
  });

  describe('login()', () => {
    it('should return 400 when email is missing', async () => {
      const { login } = await import('../../src/controllers/auth.controller.js');
      
      const req = createMockRequest({
        body: { password: 'test123' },
      });
      const res = createMockResponse();

      await login(req as any, res as any);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('Email y contraseña');
    });

    it('should return 401 when user not found', async () => {
      const { login } = await import('../../src/controllers/auth.controller.js');
      const { db } = await import('../../src/db/drizzle.js');
      
      // Mock no user found
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const req = createMockRequest({
        body: { email: 'notfound@test.com', password: 'test123' },
      });
      const res = createMockResponse();

      await login(req as any, res as any);

      expect(res._status).toBe(401);
      expect(res._json.error).toContain('Credenciales inválidas');
    });

    it('should return 401 when password is wrong', async () => {
      const { login } = await import('../../src/controllers/auth.controller.js');
      const { db } = await import('../../src/db/drizzle.js');
      const bcrypt = await import('bcryptjs');
      
      // Mock user found
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 'user-1',
              email: 'test@test.com',
              password: '$2a$10$hashedpassword',
              role: 'customer',
              storeId: 'store-1',
            }]),
          }),
        }),
      });
      
      // Mock wrong password
      (bcrypt.default.compare as any).mockResolvedValue(false);

      const req = createMockRequest({
        body: { email: 'test@test.com', password: 'wrongpassword' },
      });
      const res = createMockResponse();

      await login(req as any, res as any);

      expect(res._status).toBe(401);
      expect(res._json.error).toContain('Credenciales inválidas');
    });

    it('should return token on successful login', async () => {
      const { login } = await import('../../src/controllers/auth.controller.js');
      const bcrypt = await import('bcryptjs');
      
      // Mock user found via mockTx (withStore passes mockTx to callback)
      mockTx.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 'user-1',
              email: 'test@test.com',
              password: '$2a$10$hashedpassword',
              name: 'Test User',
              role: 'customer',
              storeId: 'store-1',
            }]),
          }),
        }),
      });
      
      // Mock correct password
      (bcrypt.default.compare as any).mockResolvedValue(true);

      const req = createMockRequest({
        storeId: 'store-1',
        body: { email: 'test@test.com', password: 'correctpassword' },
      });
      const res = createMockResponse();

      await login(req as any, res as any);

      expect(res._status).toBe(200);
      expect(res._json.message).toBe('Login exitoso');
      expect(res._json.token).toBe('mock-jwt-token');
      expect(res._json.user.email).toBe('test@test.com');
    });
  });

  describe('me()', () => {
    it('should return 401 when not authenticated', async () => {
      const { me } = await import('../../src/controllers/auth.controller.js');
      
      const req = createMockRequest({
        user: undefined,
      });
      const res = createMockResponse();

      await me(req as any, res as any);

      expect(res._status).toBe(401);
      expect(res._json.error).toContain('No autenticado');
    });
  });
});
