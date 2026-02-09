import { Request, Response, NextFunction } from 'express';
import { db, stores } from '../db/drizzle.js';
import { eq } from 'drizzle-orm';

/**
 * In-memory cache for store lookups
 * Significantly reduces DB queries for repeated requests
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const storeCache = new Map<string, CacheEntry<any>>();
const STORE_CACHE_TTL = 30 * 1000; // 30 seconds cache

function getCachedStore(key: string): any | null {
  const entry = storeCache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data;
  }
  if (entry) {
    storeCache.delete(key);
  }
  return null;
}

function cacheStore(key: string, data: any): void {
  storeCache.set(key, {
    data,
    expiresAt: Date.now() + STORE_CACHE_TTL,
  });
}

// Export for clearing cache when store is updated
export function invalidateStoreCache(storeId?: string): void {
  if (storeId) {
    // Clear specific store entries
    for (const [key] of storeCache) {
      if (key.includes(storeId)) {
        storeCache.delete(key);
      }
    }
  } else {
    storeCache.clear();
  }
}

/**
 * Store Resolver Middleware
 * 
 * Resolves the current store based on:
 * 1. Query param: ?store=domain (for development)
 * 2. Subdomain: domain.tiendita.app (for production)
 * 3. Custom header: X-Store-Domain
 * 
 * Attaches store info to req.store and req.storeId
 */

interface StoreInfo {
  id: string;
  name: string;
  domain: string;
  status: string;
  plan: string;
  type: string | null;
  licenseKey: string | null;
}

declare global {
  namespace Express {
    interface Request {
      store?: StoreInfo;
      storeId?: string;
      storeDomain?: string;
    }
  }
}

export async function storeResolver(req: Request, res: Response, next: NextFunction) {
  try {
    // console.log('Headers:', JSON.stringify(req.headers)); // Uncomment for debugging
    // 1. Try storeId query param (UUID - for direct access from Mothership)
    let storeIdParam = req.query.storeId as string | undefined;
    
    // 2. Also try X-Store-Id header (for API calls from frontend)
    if (!storeIdParam) {
      storeIdParam = req.headers['x-store-id'] as string | undefined;
    }
    
    if (storeIdParam) {
      // Check cache first
      const cacheKey = `store:id:${storeIdParam}`;
      const cachedStore = getCachedStore(cacheKey);
      
      if (cachedStore) {
        req.store = cachedStore;
        req.storeId = cachedStore.id;
        req.storeDomain = cachedStore.domain || undefined;
        console.log(`[StoreResolver] Cached store by ID: ${cachedStore.name} (${cachedStore.id})`);
        return next();
      }
      
      // Look up store directly by ID
      const [store] = await db.select({
        id: stores.id,
        name: stores.name,
        domain: stores.domain,
        status: stores.status,
        plan: stores.plan,
        type: stores.type,
        licenseKey: stores.licenseKey,
        deletedAt: stores.deletedAt,
      })
      .from(stores)
      .where(eq(stores.id, storeIdParam))
      .limit(1);
      
      if (store) {
        // Check if store is deleted
        if (store.deletedAt) {
          return res.status(404).json({
            error: 'Store not found',
            message: 'This store has been deleted',
            code: 'STORE_DELETED'
          });
        }

        // Check if store is suspended
        if (store.status === 'suspended') {
          return res.status(403).json({
            error: 'Store suspended',
            message: 'This store is currently suspended',
            code: 'STORE_SUSPENDED'
          });
        }
        
        // Cache the store for future requests
        cacheStore(cacheKey, store);
        
        req.store = store as StoreInfo;
        req.storeId = store.id;
        req.storeDomain = store.domain || undefined;
        
        console.log(`[StoreResolver] Resolved store by ID: ${store.name} (${store.id}) [status: ${store.status}]`);
        return next();
      } else {
        // Store ID was provided but not found - this is an error, not a new store
        // Previous behavior allowed this to proceed, which caused the Setup Wizard to appear
        // for deleted/non-existent stores. Now we correctly return 404.
        console.log(`[StoreResolver] Store ID ${storeIdParam} not found in DB - returning 404`);
        return res.status(404).json({
          error: 'Store not found',
          message: 'No store exists with this ID',
          code: 'STORE_NOT_FOUND'
        });
      }
    }
    
    // 2. Try store domain query param (development)
    let storeDomain = req.query.store as string | undefined;
    
    // 3. Try custom header
    if (!storeDomain) {
      storeDomain = req.headers['x-store-domain'] as string | undefined;
    }
    
    // 4. Try subdomain from Host header (production)
    if (!storeDomain) {
      const host = req.headers.host || '';
      // Extract subdomain: "tienda.example.com" -> "tienda"
      // Skip for localhost, IP addresses, Render, and Vercel domains
      if (!host.includes('localhost') && 
          !host.includes('onrender.com') && 
          !host.includes('vercel.app') && 
          !host.match(/^\d+\.\d+\.\d+\.\d+/)) {
        const parts = host.split('.');
        if (parts.length >= 3) {
          storeDomain = parts[0];
        }
      }
    }
    
    // If no store domain found, try other methods
    if (!storeDomain) {
      // For development: try to get store from authenticated user
      const authUser = (req as any).user;
      if (authUser?.storeId) {
        const [userStore] = await db.select({
          id: stores.id,
          name: stores.name,
          domain: stores.domain,
          status: stores.status,
          plan: stores.plan,
          type: stores.type,
          licenseKey: stores.licenseKey,
        })
        .from(stores)
        .where(eq(stores.id, authUser.storeId))
        .limit(1);
        
        if (userStore) {
          req.store = userStore as StoreInfo;
          req.storeId = userStore.id;
          console.log(`[StoreResolver] Resolved store from user: ${userStore.name} (${userStore.id})`);
          return next();
        }
      }
      
      // ❌ DO NOT fallback to first store - this breaks multi-tenant isolation!
      // If no store identifier was provided, req.storeId stays undefined
      // This ensures /api/init returns isConfigured: false for new stores
      console.log(`[StoreResolver] No store identifier provided - proceeding without store context`);
      
      return next();
    }
    
    req.storeDomain = storeDomain;
    
    // Look up store by domain
    const [store] = await db.select({
      id: stores.id,
      name: stores.name,
      domain: stores.domain,
      status: stores.status,
      plan: stores.plan,
      type: stores.type,
      licenseKey: stores.licenseKey,
      deletedAt: stores.deletedAt,
    })
    .from(stores)
    .where(eq(stores.domain, storeDomain))
    .limit(1);
    
    if (!store) {
      // Store not found - could be a new store or wrong domain
      console.log(`[StoreResolver] Store not found for domain: ${storeDomain}`);
      return res.status(404).json({ 
        error: 'Store not found',
        message: `No store found for domain: ${storeDomain}`,
        code: 'STORE_NOT_FOUND'
      });
    }

    if (store.deletedAt) {
      return res.status(404).json({
        error: 'Store not found',
        message: 'This store has been deleted',
        code: 'STORE_DELETED'
      });
    }
    
    // Check if store is suspended
    if (store.status === 'suspended') {
      return res.status(403).json({
        error: 'Store suspended',
        message: 'This store is currently suspended',
        code: 'STORE_SUSPENDED'
      });
    }
    
    // Attach store info to request
    req.store = store as StoreInfo;
    req.storeId = store.id;
    
    console.log(`[StoreResolver] Resolved store: ${store.name} (${store.id})`);
    
    next();
  } catch (error) {
    console.error('[StoreResolver] Error:', error);
    next(error);
  }
}

/**
 * Require Store Middleware
 * Use this after storeResolver for routes that MUST have a store context
 */
export function requireStore(req: Request, res: Response, next: NextFunction) {
  if (!req.store || !req.storeId) {
    return res.status(400).json({
      error: 'Store context required',
      message: 'Please specify a store using ?store=domain or X-Store-Domain header',
      code: 'STORE_REQUIRED'
    });
  }
  next();
}
