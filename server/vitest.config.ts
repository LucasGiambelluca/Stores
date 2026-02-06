
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret-key-minimum-16-chars',
      MP_ACCESS_TOKEN: 'TEST-mock-token',
      MP_PUBLIC_KEY: 'TEST-mock-public-key',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/tiendita_test',
      ADMIN_EMAIL: 'admin@test.com',
      ADMIN_PASSWORD: 'TestPassword123',
      ENCRYPTION_KEY: 'test-encryption-key-32-characters!',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    testTimeout: 10000,
  },
});
