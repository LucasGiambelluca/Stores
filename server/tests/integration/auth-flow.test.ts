
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';

// We need to import the app, but since it's in index.ts which starts the server,
// we might need to refactor index.ts later. For now, we'll assume we can import it
// or we'll hit the running server if we can't import app easily without side effects.
// Ideally, we should export 'app' from a separate file.

// For this first step, let's try to hit the running server (since we haven't refactored yet)
// or use a local URL if the server is running.
const API_URL = 'http://localhost:3001/api';

// Skip these E2E tests when running in CI or when server is not running
// These tests require a live server and real database
const describeE2E = process.env.RUN_E2E_TESTS ? describe : describe.skip;

describeE2E('Auth Integration Flow', () => {
  const uniqueId = uuidv4().substring(0, 8);
  const testUser = {
    email: `test-${uniqueId}@example.com`,
    password: 'password123',
    name: 'Test User',
    storeName: `Test Store ${uniqueId}`,
  };
  
  let authToken = '';
  let storeId = '';

  it('should register a new store and admin', async () => {
    const res = await request(API_URL)
      .post('/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('store');
    expect(res.body.store).toHaveProperty('id');
    
    authToken = res.body.token;
    storeId = res.body.store.id;
  });

  it('should login with the new credentials', async () => {
    const res = await request(API_URL)
      .post('/auth/login')
      .set('x-store-id', storeId)
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(testUser.email);
  });


});
