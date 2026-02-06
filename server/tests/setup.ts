/// <reference types="vitest/globals" />

import { beforeAll, afterAll, afterEach } from 'vitest';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.MP_ACCESS_TOKEN = 'TEST-mock-token';
process.env.MP_PUBLIC_KEY = 'TEST-mock-public-key';

// Mock console.log in tests to reduce noise
const originalLog = console.log;
beforeAll(() => {
  console.log = (...args: any[]) => {
    // Only show logs with [TEST] prefix
    if (args[0]?.includes?.('[TEST]')) {
      originalLog(...args);
    }
  };
});

afterAll(() => {
  console.log = originalLog;
});

// Global test utilities
export const TEST_USER = {
  id: 'test-user-id',
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User',
  role: 'admin' as const,
  storeId: 'test-store-id',
};

export const TEST_STORE = {
  id: 'test-store-id',
  name: 'Test Store',
  domain: 'test-store',
  status: 'active',
  plan: 'pro',
};

export const TEST_LICENSE = {
  serial: 'TND-TEST-1234-ABCD',
  plan: 'pro',
  status: 'generated',
  maxProducts: 1000,
  maxOrders: null,
};

export const TEST_PRODUCT = {
  id: 'test-product-1',
  name: 'Test Product',
  price: 1000,
  stock: 100,
  storeId: 'test-store-id',
};
