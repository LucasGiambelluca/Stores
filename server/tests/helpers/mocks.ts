import { Request, Response } from 'express';
import { vi } from 'vitest';

// Extended request interface that matches our app's usage
interface MockRequest extends Partial<Request> {
  user?: { id: string; email?: string; role?: string; storeId?: string };
  storeId?: string;
  store?: { id: string; name?: string };
}

/**
 * Create a mock Express Request object
 */
export function createMockRequest(overrides: MockRequest = {}): MockRequest {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: undefined,
    storeId: undefined,
    ...overrides,
  };
}

/**
 * Create a mock Express Response object with spy methods
 */
export function createMockResponse(): Partial<Response> & { 
  _json: any; 
  _status: number;
  _sent: boolean;
} {
  const res: any = {
    _json: null,
    _status: 200,
    _sent: false,
    
    status: vi.fn(function(this: any, code: number) {
      this._status = code;
      return this;
    }),
    
    json: vi.fn(function(this: any, data: any) {
      this._json = data;
      this._sent = true;
      return this;
    }),
    
    send: vi.fn(function(this: any, data: any) {
      this._json = data;
      this._sent = true;
      return this;
    }),
    
    sendStatus: vi.fn(function(this: any, code: number) {
      this._status = code;
      this._sent = true;
      return this;
    }),
  };
  
  return res;
}

/**
 * Create mock database helpers
 */
export function createMockDb() {
  const mockTx = {
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
    delete: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    execute: vi.fn().mockResolvedValue([]),
  };

  return {
    ...mockTx,
    // Mock transaction that executes callback with mockTx
    transaction: vi.fn(async (callback: (tx: typeof mockTx) => Promise<unknown>) => callback(mockTx)),
    query: {
      products: { 
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
      },
      orders: { 
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
      storeConfig: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      users: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    },
  };
}

/**
 * Wait for async operations
 */
export const flushPromises = () => new Promise(resolve => setImmediate(resolve));
