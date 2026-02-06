/**
 * Analytics Service
 * 
 * Provides metrics and statistics for the admin dashboard.
 * All queries are scoped to the store (multi-tenant).
 */

import { db, orders, orderItems, products, users, reviews } from '../db/drizzle.js';
import { eq, sql, and, gte, lte, desc, count } from 'drizzle-orm';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalProducts: number;
  totalCustomers: number;
  conversionRate: number;
  revenueByDay: { date: string; revenue: number; orders: number }[];
  topProducts: { id: string; name: string; revenue: number; quantity: number }[];
  ordersByStatus: { status: string; count: number }[];
  recentOrders: any[];
}

// Get dashboard metrics for a store
export async function getDashboardMetrics(
  storeId: string, 
  dateRange?: DateRange
): Promise<DashboardMetrics> {
  const startDate = dateRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
  const endDate = dateRange?.endDate || new Date();
  
  try {
    // Total revenue and orders
    const revenueResult = await db.select({
      totalRevenue: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
      totalOrders: sql<number>`COUNT(*)`,
    })
    .from(orders)
    .where(and(
      gte(orders.createdAt, startDate),
      lte(orders.createdAt, endDate),
      sql`${orders.status} != 'cancelled'`
    ));
    
    const totalRevenue = Number(revenueResult[0]?.totalRevenue || 0);
    const totalOrders = Number(revenueResult[0]?.totalOrders || 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Total products for store
    const productsCount = await db.select({ count: sql<number>`COUNT(*)` })
      .from(products)
      .where(eq(products.storeId, storeId));

    // Total customers (registered users)
    const customersCount = await db.select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(and(
        eq(users.storeId, storeId),
        eq(users.role, 'customer')
      ));

    // Revenue by day
    const revenueByDayResult = await db.select({
      date: sql<string>`DATE(${orders.createdAt})`,
      revenue: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
      orders: sql<number>`COUNT(*)`,
    })
    .from(orders)
    .where(and(
      gte(orders.createdAt, startDate),
      lte(orders.createdAt, endDate),
      sql`${orders.status} != 'cancelled'`
    ))
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(sql`DATE(${orders.createdAt})`);

    // Top selling products
    const topProductsResult = await db.select({
      id: orderItems.productId,
      name: orderItems.productName,
      revenue: sql<number>`SUM(${orderItems.price} * ${orderItems.quantity})`,
      quantity: sql<number>`SUM(${orderItems.quantity})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(
      eq(orderItems.storeId, storeId),
      gte(orders.createdAt, startDate),
      lte(orders.createdAt, endDate),
      sql`${orders.status} != 'cancelled'`
    ))
    .groupBy(orderItems.productId, orderItems.productName)
    .orderBy(sql`SUM(${orderItems.price} * ${orderItems.quantity}) DESC`)
    .limit(10);

    // Orders by status
    const ordersByStatusResult = await db.select({
      status: orders.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(orders)
    .where(and(
      gte(orders.createdAt, startDate),
      lte(orders.createdAt, endDate)
    ))
    .groupBy(orders.status);

    // Recent orders
    const recentOrdersResult = await db.select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(5);

    // Calculate values before return
    const totalProducts = Number(productsCount[0]?.count || 0);
    const totalCustomers = Number(customersCount[0]?.count || 0);

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      totalProducts,
      totalCustomers,
      conversionRate: totalCustomers > 0 
        ? Math.round((totalOrders / totalCustomers) * 100 * 10) / 10 
        : 0, // Percentage of customers who placed orders
      revenueByDay: revenueByDayResult.map(r => ({
        date: String(r.date),
        revenue: Number(r.revenue),
        orders: Number(r.orders),
      })),
      topProducts: topProductsResult.map(p => ({
        id: p.id,
        name: p.name,
        revenue: Number(p.revenue),
        quantity: Number(p.quantity),
      })),
      ordersByStatus: ordersByStatusResult.map(s => ({
        status: s.status || 'unknown',
        count: Number(s.count),
      })),
      recentOrders: recentOrdersResult,
    };
  } catch (error) {
    console.error('Error getting dashboard metrics:', error);
    throw error;
  }
}

// Get sales summary for a specific period
export async function getSalesSummary(
  storeId: string,
  period: 'today' | 'week' | 'month' | 'year'
): Promise<{ revenue: number; orders: number; growth: number }> {
  const now = new Date();
  let startDate: Date;
  let previousStartDate: Date;
  let previousEndDate: Date;

  switch (period) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      previousStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
      previousEndDate = new Date(startDate.getTime() - 1);
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      previousEndDate = new Date(startDate.getTime() - 1);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousEndDate = new Date(startDate.getTime() - 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
      previousEndDate = new Date(startDate.getTime() - 1);
      break;
  }

  // Current period
  const currentResult = await db.select({
    revenue: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
    orders: sql<number>`COUNT(*)`,
  })
  .from(orders)
  .where(and(
    gte(orders.createdAt, startDate),
    sql`${orders.status} != 'cancelled'`
  ));

  // Previous period for comparison
  const previousResult = await db.select({
    revenue: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
  })
  .from(orders)
  .where(and(
    gte(orders.createdAt, previousStartDate),
    lte(orders.createdAt, previousEndDate),
    sql`${orders.status} != 'cancelled'`
  ));

  const currentRevenue = Number(currentResult[0]?.revenue || 0);
  const previousRevenue = Number(previousResult[0]?.revenue || 0);
  const growth = previousRevenue > 0 
    ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
    : 0;

  return {
    revenue: currentRevenue,
    orders: Number(currentResult[0]?.orders || 0),
    growth: Math.round(growth * 10) / 10, // Round to 1 decimal
  };
}

// Get product performance metrics
export async function getProductPerformance(storeId: string, limit: number = 10) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const result = await db.select({
    id: products.id,
    name: products.name,
    image: products.image,
    price: products.price,
    stock: products.stock,
    totalSold: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
    totalRevenue: sql<number>`COALESCE(SUM(${orderItems.price} * ${orderItems.quantity}), 0)`,
  })
  .from(products)
  .leftJoin(orderItems, eq(products.id, orderItems.productId))
  .leftJoin(orders, and(
    eq(orderItems.orderId, orders.id),
    gte(orders.createdAt, thirtyDaysAgo),
    sql`${orders.status} != 'cancelled'`
  ))
  .where(eq(products.storeId, storeId))
  .groupBy(products.id, products.name, products.image, products.price, products.stock)
  .orderBy(sql`COALESCE(SUM(${orderItems.price} * ${orderItems.quantity}), 0) DESC`)
  .limit(limit);

  return result.map(p => ({
    id: p.id,
    name: p.name,
    image: p.image,
    price: p.price,
    stock: p.stock,
    totalSold: Number(p.totalSold),
    totalRevenue: Number(p.totalRevenue),
  }));
}
