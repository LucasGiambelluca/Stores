import { Request, Response, NextFunction } from 'express';
import { db } from '../db/drizzle.js';
import { licenses, storeConfig, products, orders } from '../db/schema.js';
import { eq, and, gte, sql } from 'drizzle-orm';

/**
 * Middleware to check if store has a valid active license
 * Blocks request if no license, expired, or suspended
 */
export async function requireActiveLicense(req: Request, res: Response, next: NextFunction) {
  try {
    // Get license key from store config
    const [licenseConfig] = await db.select()
      .from(storeConfig)
      .where(eq(storeConfig.key, 'license_key'))
      .limit(1);

    if (!licenseConfig || !licenseConfig.value) {
      return res.status(403).json({
        error: 'No license',
        message: 'Esta tienda no tiene una licencia activada. Por favor activa tu licencia para continuar.',
        requiresActivation: true,
      });
    }

    // Get license details
    const [license] = await db.select()
      .from(licenses)
      .where(eq(licenses.serial, licenseConfig.value as string))
      .limit(1);

    if (!license) {
      return res.status(403).json({
        error: 'Invalid license',
        message: 'La licencia no es válida.',
        requiresActivation: true,
      });
    }

    // Check if revoked
    if (license.status === 'revoked') {
      return res.status(403).json({
        error: 'License revoked',
        message: 'Tu licencia ha sido revocada. Contacta a soporte.',
        requiresSupport: true,
      });
    }

    // Check if suspended
    if (license.status === 'suspended') {
      return res.status(403).json({
        error: 'License suspended',
        message: 'Tu licencia está suspendida. Contacta a soporte para resolver.',
        requiresSupport: true,
      });
    }

    // Check if expired
    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      return res.status(403).json({
        error: 'License expired',
        message: 'Tu licencia ha expirado. Por favor renueva tu plan para continuar.',
        expiresAt: license.expiresAt,
        requiresRenewal: true,
      });
    }

    // Add license info to request for use in controllers
    (req as any).license = license;

    next();
  } catch (error) {
    console.error('License middleware error:', error);
    res.status(500).json({ error: 'Failed to verify license' });
  }
}

/**
 * Middleware to check product limit
 * Only allows creating products if under the license limit
 */
export async function checkProductLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const license = (req as any).license;

    if (!license) {
      return res.status(403).json({ error: 'No license found' });
    }

    // If no product limit, allow unlimited
    if (license.maxProducts === null) {
      return next();
    }

    // Count current products for this store
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.storeId, license.storeId));
    
    const count = result[0]?.count || 0;

    if (count >= license.maxProducts) {
      return res.status(403).json({
        error: 'Product limit reached',
        message: `Has alcanzado el límite de ${license.maxProducts} productos para tu plan ${license.plan.toUpperCase()}. Actualiza tu plan para agregar más productos.`,
        currentCount: count,
        maxAllowed: license.maxProducts,
        plan: license.plan,
        requiresUpgrade: true,
      });
    }

    next();
  } catch (error) {
    console.error('Product limit check error:', error);
    res.status(500).json({ error: 'Failed to check product limit' });
  }
}

/**
 * Middleware to check order limit
 * Only allows creating orders if under the license limit
 */
export async function checkOrderLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const license = (req as any).license;

    if (!license) {
      return res.status(403).json({ error: 'No license found' });
    }

    // If no order limit, allow unlimited
    if (license.maxOrders === null) {
      return next();
    }

    // Count current orders for this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(
        and(
          eq(orders.userId, license.storeId),
          gte(orders.createdAt, startOfMonth)
        )
      );
    
    const count = result[0]?.count || 0;

    if (count >= license.maxOrders) {
      return res.status(403).json({
        error: 'Order limit reached',
        message: `Has alcanzado el límite de ${license.maxOrders} pedidos mensuales para tu plan ${license.plan.toUpperCase()}. Actualiza tu plan para procesar más pedidos.`,
        currentCount: count,
        maxAllowed: license.maxOrders,
        plan: license.plan,
        requiresUpgrade: true,
      });
    }

    next();
  } catch (error) {
    console.error('Order limit check error:', error);
    res.status(500).json({ error: 'Failed to check order limit' });
  }
}
