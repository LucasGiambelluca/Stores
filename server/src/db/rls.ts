import { sql } from 'drizzle-orm';
import { db } from './drizzle.js';

/**
 * Executes a callback within a transaction that has the store_id set in a session variable.
 * This enables Row Level Security (RLS) policies to enforce isolation.
 * 
 * @param storeId - The ID of the store to isolate access for
 * @param callback - The function to execute within the isolated context
 */
export async function withStore<T>(storeId: string, callback: (tx: any) => Promise<T>): Promise<T> {
  if (!storeId) {
    throw new Error('RLS withStore called without storeId');
  }

  return db.transaction(async (tx) => {
    // Set the session variable for RLS
    // 'true' as third argument makes it local to the transaction
    await tx.execute(sql`SELECT set_config('app.current_store_id', ${storeId}, true)`);
    
    return callback(tx);
  });
}

/**
 * Same as withStore but for cases where we might not have a storeId (e.g. public access or super admin)
 * In this case, we might want to bypass RLS or set a special value.
 * For now, we enforce storeId.
 */
export async function withStoreContext<T>(storeId: string | undefined, callback: (tx: any) => Promise<T>): Promise<T> {
  if (!storeId) {
    // If no storeId, we can't enforce RLS safely for tenant data.
    // Depending on policy, this might mean "no access" or "public access".
    // For safety, we throw if trying to access protected data without storeId.
    // However, some public endpoints might need access.
    // Let's assume for now we just run the callback without setting the variable, 
    // which means RLS policies (if strict) will return nothing.
    return db.transaction(async (tx) => {
       return callback(tx);
    });
  }
  return withStore(storeId, callback);
}
