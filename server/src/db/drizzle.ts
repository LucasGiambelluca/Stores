/**
 * Drizzle ORM Client - PostgreSQL
 * 
 * This module provides the Drizzle client configured with postgres.js
 * for Supabase/PostgreSQL connection.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Import all schema tables and relations
import * as schema from './schema.js';

// Get connection string from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

// Create postgres.js connection with pooling settings for Supabase
// prepare: false is required for Transaction Pooler mode (port 6543)
const client = postgres(connectionString, {
  prepare: false, // Required for Supabase Transaction Mode
  max: 10, // Maximum connections in pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout
});

// Create Drizzle client with schema for relations
export const db = drizzle(client, { schema });

// Export the raw postgres client for cases where we need it (like raw SQL)
export const sql = client;

// Re-export schema for convenience
export * from './schema.js';
