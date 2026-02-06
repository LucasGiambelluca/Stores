import { Request, Response, NextFunction } from 'express';
import { db, licenses, products, orders, stores } from '../db/drizzle.js';
import { eq, sql, and, gte } from 'drizzle-orm';

/**
 * License Enforcement Middleware
 * 
 * Validates that the store has not exceeded their license limits
 * before allowing product/order creation
 */

interface LicenseUsage {
  plan: string;
  productCount: number;
  maxProducts: number;
  orderCount: number; // orders this month
  maxOrders: number;
  canCreateProduct: boolean;
  canCreateOrder: boolean;
  productPercentage: number;
  orderPercentage: number;
}

/**
 * Get current usage for a store's license
 */
/**
 * Get current usage for a store's license
 * Supports optional transaction for atomic checks
 */
export async function getLicenseUsage(storeId: string, tx: any = db): Promise<LicenseUsage | null> {
  try {
    // Get license limits directly by storeId (more robust than licenseKey)
    const [license] = await tx.select()
      .from(licenses)
      .where(eq(licenses.storeId, storeId))
      .limit(1);

    if (!license) {
      console.warn(`[LicenseEnforcement] No license found for store ${storeId}`);
      return null;
    }

    // Count current products for this store
    const [productCountResult] = await tx.select({
      count: sql<number>`count(*)::int`
    })
    .from(products)
    .where(eq(products.storeId, storeId));

    const productCount = productCountResult?.count || 0;

    // Count orders this month for this store
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [orderCountResult] = await tx.select({
      count: sql<number>`count(*)::int`
    })
    .from(orders)
    .where(
      and(
        eq(orders.storeId, storeId),
        gte(orders.createdAt, startOfMonth)
      )
    );

    const orderCount = orderCountResult?.count || 0;

    // Get limits (null = unlimited)
    const maxProducts = license.maxProducts || 999999;
    const maxOrders = license.maxOrders || 999999;

    return {
      plan: license.plan,
      productCount,
      maxProducts,
      orderCount,
      maxOrders,
      canCreateProduct: productCount < maxProducts,
      canCreateOrder: orderCount < maxOrders,
      productPercentage: Math.min(100, Math.round((productCount / maxProducts) * 100)),
      orderPercentage: Math.min(100, Math.round((orderCount / maxOrders) * 100)),
    };
  } catch (error) {
    console.error('[LicenseEnforcement] Error getting usage:', error);
    return null;
  }
}

/**
 * Middleware to check product creation limit
 */
export async function enforceProductLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const storeId = req.storeId;
    
    if (!storeId) {
      return res.status(400).json({
        error: 'Store context required',
        code: 'STORE_REQUIRED'
      });
    }

    const usage = await getLicenseUsage(storeId);

    if (!usage) {
      return res.status(403).json({
        error: 'No valid license found',
        code: 'NO_LICENSE'
      });
    }

    if (!usage.canCreateProduct) {
      return res.status(403).json({
        error: 'Product limit reached',
        message: `Has alcanzado el límite de ${usage.maxProducts} productos para tu plan. Actualiza tu licencia para agregar más productos.`,
        code: 'PRODUCT_LIMIT_EXCEEDED',
        currentCount: usage.productCount,
        maxAllowed: usage.maxProducts
      });
    }

    // Attach usage to request for potential use in controller
    (req as any).licenseUsage = usage;
    next();
  } catch (error) {
    console.error('[LicenseEnforcement] Product limit check error:', error);
    next(error);
  }
}

/**
 * Middleware to check order creation limit
 */
export async function enforceOrderLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const storeId = req.storeId;
    
    if (!storeId) {
      return res.status(400).json({
        error: 'Store context required',
        code: 'STORE_REQUIRED'
      });
    }

    const usage = await getLicenseUsage(storeId);

    if (!usage) {
      return res.status(403).json({
        error: 'No valid license found',
        code: 'NO_LICENSE'
      });
    }

    if (!usage.canCreateOrder) {
      return res.status(403).json({
        error: 'Order limit reached',
        message: `Has alcanzado el límite de ${usage.maxOrders} órdenes mensuales para tu plan. Actualiza tu licencia para procesar más órdenes.`,
        code: 'ORDER_LIMIT_EXCEEDED',
        currentCount: usage.orderCount,
        maxAllowed: usage.maxOrders
      });
    }

    (req as any).licenseUsage = usage;
    next();
  } catch (error) {
    console.error('[LicenseEnforcement] Order limit check error:', error);
    next(error);
  }
}
