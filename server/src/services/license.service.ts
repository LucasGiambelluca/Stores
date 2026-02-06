import { db } from '../db/drizzle.js';
import { licenses, storeConfig, products, orders } from '../db/schema.js';
import { eq, and, gte, sql } from 'drizzle-orm';

/**
 * Simple in-memory cache with TTL for license data
 * Reduces database queries significantly
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const licenseCache = new Map<string, CacheEntry<any>>();
const LICENSE_CACHE_TTL = 60 * 1000; // 1 minute cache

function getCached<T>(key: string): T | null {
  const entry = licenseCache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data as T;
  }
  if (entry) {
    licenseCache.delete(key); // Clean up expired
  }
  return null;
}

function setCache<T>(key: string, data: T, ttl: number = LICENSE_CACHE_TTL): void {
  licenseCache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
  });
}

function invalidateCache(key?: string): void {
  if (key) {
    licenseCache.delete(key);
  } else {
    licenseCache.clear();
  }
}

/**
 * License Service - Centralized license validation and usage tracking
 */
export class LicenseService {
  /**
   * Check if current store has a valid active license
   */
  static async checkLicenseStatus(): Promise<{
    valid: boolean;
    license?: any;
    error?: string;
  }> {
    // Check cache first
    const cacheKey = 'license_status';
    const cached = getCached<{ valid: boolean; license?: any; error?: string }>(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      // Get license key from store config
      const [licenseConfig] = await db.select()
        .from(storeConfig)
        .where(eq(storeConfig.key, 'license_key'))
        .limit(1);

      if (!licenseConfig || !licenseConfig.value) {
        return {
          valid: false,
          error: 'No license activated',
        };
      }

      // Get license details
      const [license] = await db.select()
        .from(licenses)
        .where(eq(licenses.serial, licenseConfig.value as string))
        .limit(1);

      if (!license) {
        return {
          valid: false,
          error: 'License not found',
        };
      }

      // Check status
      if (license.status === 'revoked') {
        return { valid: false, error: 'License revoked' };
      }

      if (license.status === 'suspended') {
        return { valid: false, error: 'License suspended' };
      }

      // Check expiration
      if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
        return { valid: false, error: 'License expired' };
      }

      // Cache successful result
      const result = {
        valid: true,
        license,
      };
      setCache(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Check license status error:', error);
      return {
        valid: false,
        error: 'Failed to check license',
      };
    }
  }

  /**
   * Check if store can add more products
   */
  static async checkProductLimit(storeId: string): Promise<{
    allowed: boolean;
    current: number;
    max: number | null;
    message?: string;
  }> {
    try {
      const { valid, license } = await this.checkLicenseStatus();

      if (!valid || !license) {
        return {
          allowed: false,
          current: 0,
          max: 0,
          message: 'No valid license',
        };
      }

      // If no limit, allow unlimited
      if (license.maxProducts === null) {
        return {
          allowed: true,
          current: 0,
          max: null,
        };
      }

      // Count current products
      const result = await db.select({ count: sql<number>`count(*)::int` })
        .from(products)
        .where(eq(products.storeId, storeId));

      const current = result[0]?.count || 0;

      return {
        allowed: current < license.maxProducts,
        current,
        max: license.maxProducts,
        message: current >= license.maxProducts
          ? `Límite de ${license.maxProducts} productos alcanzado`
          : undefined,
      };
    } catch (error) {
      console.error('Check product limit error:', error);
      return {
        allowed: false,
        current: 0,
        max: 0,
        message: 'Error checking limit',
      };
    }
  }

  /**
   * Check if store can process more orders this month
   */
  static async checkOrderLimit(storeId: string): Promise<{
    allowed: boolean;
    current: number;
    max: number | null;
    message?: string;
  }> {
    try {
      const { valid, license } = await this.checkLicenseStatus();

      if (!valid || !license) {
        return {
          allowed: false,
          current: 0,
          max: 0,
          message: 'No valid license',
        };
      }

      // If no limit, allow unlimited
      if (license.maxOrders === null) {
        return {
          allowed: true,
          current: 0,
          max: null,
        };
      }

      // Count orders this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const result = await db.select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(
          and(
            eq(orders.storeId, storeId),
            gte(orders.createdAt, startOfMonth)
          )
        );

      const current = result[0]?.count || 0;

      return {
        allowed: current < license.maxOrders,
        current,
        max: license.maxOrders,
        message: current >= license.maxOrders
          ? `Límite de ${license.maxOrders} pedidos mensuales alcanzado`
          : undefined,
      };
    } catch (error) {
      console.error('Check order limit error:', error);
      return {
        allowed: false,
        current: 0,
        max: 0,
        message: 'Error checking limit',
      };
    }
  }

  /**
   * Get current usage statistics
   */
  static async getLicenseUsage(storeId: string): Promise<{
    license: any;
    usage: {
      products: { current: number; max: number | null; percentage: number | null };
      orders: { current: number; max: number | null; percentage: number | null };
    };
  } | null> {
    try {
      const { valid, license } = await this.checkLicenseStatus();

      if (!valid || !license) {
        return null;
      }

      // Get product count
      const productResult = await db.select({ count: sql<number>`count(*)::int` })
        .from(products)
        .where(eq(products.storeId, storeId));

      const productCount = productResult[0]?.count || 0;

      // Get order count for this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const orderResult = await db.select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(
          and(
            eq(orders.storeId, storeId),
            gte(orders.createdAt, startOfMonth)
          )
        );

      const orderCount = orderResult[0]?.count || 0;

      return {
        license,
        usage: {
          products: {
            current: productCount,
            max: license.maxProducts,
            percentage: license.maxProducts
              ? Math.round((productCount / license.maxProducts) * 100)
              : null,
          },
          orders: {
            current: orderCount,
            max: license.maxOrders,
            percentage: license.maxOrders
              ? Math.round((orderCount / license.maxOrders) * 100)
              : null,
          },
        },
      };
    } catch (error) {
      console.error('Get license usage error:', error);
      return null;
    }
  }
  /**
   * Invalidate license cache (call after license changes)
   */
  static invalidateCache(): void {
    invalidateCache();
  }
}

export default LicenseService;
