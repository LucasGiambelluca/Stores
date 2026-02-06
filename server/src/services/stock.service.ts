/**
 * Stock Management Service
 * 
 * Handles stock alerts, low stock detection, and stock movement history.
 */

import { db, products, storeConfig } from '../db/drizzle.js';
import { eq, and, lte, gt, sql, desc } from 'drizzle-orm';
import { sendLowStockAlert } from './email.service.js';

// Default low stock threshold
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

// Get low stock threshold for a store
export async function getLowStockThreshold(storeId: string): Promise<number> {
  try {
    const result = await db.select()
      .from(storeConfig)
      .where(and(
        eq(storeConfig.key, 'low_stock_threshold'),
        eq(storeConfig.storeId, storeId)
      ))
      .limit(1);
    
    if (result.length > 0) {
      return Number(result[0].value) || DEFAULT_LOW_STOCK_THRESHOLD;
    }
  } catch (error) {
    console.error('Error getting low stock threshold:', error);
  }
  return DEFAULT_LOW_STOCK_THRESHOLD;
}

// Set low stock threshold for a store
export async function setLowStockThreshold(storeId: string, threshold: number): Promise<void> {
  const existing = await db.select()
    .from(storeConfig)
    .where(and(
      eq(storeConfig.key, 'low_stock_threshold'),
      eq(storeConfig.storeId, storeId)
    ))
    .limit(1);

  if (existing.length > 0) {
    await db.update(storeConfig)
      .set({ value: threshold.toString(), updatedAt: new Date() })
      .where(and(
        eq(storeConfig.key, 'low_stock_threshold'),
        eq(storeConfig.storeId, storeId)
      ));
  } else {
    await db.insert(storeConfig)
      .values({
        key: 'low_stock_threshold',
        storeId,
        value: threshold.toString(),
        updatedAt: new Date(),
      });
  }
}

// Get products with low stock
export async function getLowStockProducts(storeId: string, limit: number = 20) {
  const threshold = await getLowStockThreshold(storeId);
  
  const result = await db.select({
    id: products.id,
    name: products.name,
    image: products.image,
    stock: products.stock,
    price: products.price,
  })
  .from(products)
  .where(and(
    eq(products.storeId, storeId),
    lte(products.stock, threshold),
    gt(products.stock, 0) // Not out of stock
  ))
  .orderBy(products.stock)
  .limit(limit);

  return {
    products: result,
    threshold,
    count: result.length,
  };
}

// Get out of stock products
export async function getOutOfStockProducts(storeId: string, limit: number = 20) {
  const result = await db.select({
    id: products.id,
    name: products.name,
    image: products.image,
    stock: products.stock,
    price: products.price,
  })
  .from(products)
  .where(and(
    eq(products.storeId, storeId),
    lte(products.stock, 0)
  ))
  .orderBy(desc(products.updatedAt))
  .limit(limit);

  return {
    products: result,
    count: result.length,
  };
}

// Get stock summary for dashboard
export async function getStockSummary(storeId: string) {
  const threshold = await getLowStockThreshold(storeId);
  
  // Count products by stock status
  const summary = await db.select({
    totalProducts: sql<number>`COUNT(*)`,
    inStock: sql<number>`SUM(CASE WHEN ${products.stock} > ${threshold} THEN 1 ELSE 0 END)`,
    lowStock: sql<number>`SUM(CASE WHEN ${products.stock} > 0 AND ${products.stock} <= ${threshold} THEN 1 ELSE 0 END)`,
    outOfStock: sql<number>`SUM(CASE WHEN ${products.stock} <= 0 THEN 1 ELSE 0 END)`,
    totalStockValue: sql<number>`COALESCE(SUM(${products.stock} * ${products.price}), 0)`,
  })
  .from(products)
  .where(eq(products.storeId, storeId));

  const result = summary[0];
  
  return {
    totalProducts: Number(result?.totalProducts || 0),
    inStock: Number(result?.inStock || 0),
    lowStock: Number(result?.lowStock || 0),
    outOfStock: Number(result?.outOfStock || 0),
    totalStockValue: Number(result?.totalStockValue || 0),
    threshold,
  };
}

// Check and send low stock alerts
export async function checkAndSendLowStockAlerts(storeId: string, adminEmail: string) {
  const { products: lowStockProducts, threshold } = await getLowStockProducts(storeId, 50);
  
  if (lowStockProducts.length > 0) {
    // Send email alert
    await sendLowStockAlert(adminEmail, lowStockProducts, threshold);
    return {
      sent: true,
      productsCount: lowStockProducts.length,
    };
  }
  
  return {
    sent: false,
    productsCount: 0,
  };
}

// Update stock for a product (with optional reason for history)
export async function updateStock(
  productId: string, 
  newStock: number, 
  reason?: string,
  userId?: string,
  orderId?: string
): Promise<boolean> {
  try {
    // First, get the current stock value
    const product = await db.select({ stock: products.stock, storeId: products.storeId })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product || product.length === 0) {
      console.error(`Product ${productId} not found`);
      return false;
    }

    const previousStock = product[0].stock ?? 0;
    const storeId = product[0].storeId;
    const delta = newStock - previousStock;

    // Update the product stock
    await db.update(products)
      .set({ 
        stock: newStock,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(products.id, productId));
    
    // Record the movement in stockMovements table
    const { stockMovements } = await import('../db/schema.js');
    const { nanoid } = await import('nanoid');
    
    await db.insert(stockMovements).values({
      id: nanoid(),
      storeId,
      productId,
      delta,
      previousStock,
      newStock,
      reason: reason || 'manual_update',
      userId: userId || undefined,
      orderId: orderId || undefined,
    });
    
    console.log(`📦 Stock updated for product ${productId}: ${previousStock} → ${newStock} (Δ${delta >= 0 ? '+' : ''}${delta}) - ${reason || 'manual update'}`);
    
    return true;
  } catch (error) {
    console.error('Error updating stock:', error);
    return false;
  }
}
