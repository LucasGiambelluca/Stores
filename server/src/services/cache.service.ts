/**
 * Simple In-Memory Cache Service
 * 
 * Provides TTL-based caching for frequently accessed data.
 * For production, consider using Redis for distributed caching.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 60 * 1000; // 1 minute default

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Set a value in cache with TTL
   */
  set<T>(key: string, data: T, ttlMs: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Get or set - returns cached value or executes getter and caches result
   */
  async getOrSet<T>(
    key: string, 
    getter: () => Promise<T>, 
    ttlMs: number = this.defaultTTL
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    const data = await getter();
    this.set(key, data, ttlMs);
    return data;
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Delete all keys matching a pattern (prefix)
   */
  deleteByPrefix(prefix: string): number {
    let deleted = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  /**
   * Invalidate all cache entries for a specific store
   */
  invalidateStore(storeId: string): number {
    return this.deleteByPrefix(`store:${storeId}`);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  stats(): { size: number; keys: string[] } {
    // Clean up expired entries first
    for (const [key, entry] of this.cache.entries()) {
      if (Date.now() > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
    
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const cache = new CacheService();

// ============================================
// CACHE KEY GENERATORS
// ============================================

export const cacheKeys = {
  // Store config - cached for 5 minutes
  storeConfig: (storeId: string) => `store:${storeId}:config`,
  
  // Products list - cached for 2 minutes
  products: (storeId: string) => `store:${storeId}:products`,
  productById: (storeId: string, productId: string) => `store:${storeId}:product:${productId}`,
  
  // Categories - cached for 5 minutes
  categories: (storeId: string) => `store:${storeId}:categories`,
  
  // Banners - cached for 5 minutes
  banners: (storeId: string) => `store:${storeId}:banners`,
};

// ============================================
// TTL CONSTANTS (in milliseconds)
// ============================================

export const cacheTTL = {
  SHORT: 30 * 1000,        // 30 seconds - for dynamic data
  MEDIUM: 2 * 60 * 1000,   // 2 minutes - for products
  LONG: 5 * 60 * 1000,     // 5 minutes - for config/categories
  HOUR: 60 * 60 * 1000,    // 1 hour - for static data
};
