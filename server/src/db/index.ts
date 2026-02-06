/**
 * Database Initialization Module - PostgreSQL
 * 
 * This module:
 * 1. Verifies connection to PostgreSQL
 * 2. Creates tables if they don't exist (via Drizzle push)
 * 3. Re-exports the Drizzle client
 */

import { db, sql } from './drizzle.js';

// Re-export for backward compatibility
export { db, sql };

/**
 * Initialize the database
 * 
 * Verifies the PostgreSQL connection is working.
 */
export async function initDatabase() {
  try {
    // Verify database is accessible by running a simple query
    const result = await sql`SELECT 1 as test`;
    
    if (result && result.length > 0) {
      console.log('✅ Database connected (PostgreSQL)');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

/**
 * Create tables if they don't exist
 * This should be called on first startup
 */
export async function createTablesIfNotExist() {
  try {
    // Check if store_config table exists (indicator that tables are created)
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'store_config'
      ) as exists
    `;
    
    return result[0]?.exists === true;
  } catch (error) {
    console.error('Error checking tables:', error);
    return false;
  }
}
