import { Request, Response } from 'express';
import { eq, desc, sql, like, or, and, isNull } from 'drizzle-orm';
import { db, users, orders, orderItems, addresses, products } from '../db/drizzle.js';
import { withStore } from '../db/rls.js';

// Get all customers (admin)
export async function getAllCustomers(req: Request, res: Response) {
  try {
    const { search, limit = 50, offset = 0 } = req.query;

    if (!req.storeId) {
      return res.status(400).json({ error: 'Store context required' });
    }

    const result = await withStore(req.storeId, async (tx) => {
      // Build base query with subqueries for aggregates
      let baseQuery = tx
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          phone: users.phone,
          role: users.role,
          createdAt: users.createdAt,
          orderCount: sql<number>`(SELECT COUNT(*) FROM orders WHERE customer_email = ${users.email})`,
          totalSpent: sql<number>`(SELECT COALESCE(SUM(total), 0) FROM orders WHERE customer_email = ${users.email} AND status != 'cancelled')`,
        })
        .from(users)
        .where(and(eq(users.role, 'customer'), eq(users.storeId, req.storeId!)))
        .orderBy(desc(users.createdAt))
        .limit(Number(limit))
        .offset(Number(offset));

      let customers;
      if (search) {
        const searchPattern = `%${search}%`;
        customers = await tx
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            phone: users.phone,
            role: users.role,
            createdAt: users.createdAt,
            orderCount: sql<number>`(SELECT COUNT(*) FROM orders WHERE customer_email = ${users.email})`,
            totalSpent: sql<number>`(SELECT COALESCE(SUM(total), 0) FROM orders WHERE customer_email = ${users.email} AND status != 'cancelled')`,
          })
          .from(users)
          .where(and(
            eq(users.role, 'customer'),
            eq(users.storeId, req.storeId!),
            or(
              like(users.email, searchPattern),
              like(users.name, searchPattern),
              like(users.phone, searchPattern)
            )
          ))
          .orderBy(desc(users.createdAt))
          .limit(Number(limit))
          .offset(Number(offset));
      } else {
        customers = await baseQuery;
      }

      // Get total count
      const countQuery = search
        ? await tx.select({ count: sql<number>`count(*)` })
            .from(users)
            .where(and(
              eq(users.role, 'customer'),
              eq(users.storeId, req.storeId!),
              or(
                like(users.email, `%${search}%`),
                like(users.name, `%${search}%`),
                like(users.phone, `%${search}%`)
              )
            ))
        : await tx.select({ count: sql<number>`count(*)` })
            .from(users)
            .where(and(eq(users.role, 'customer'), eq(users.storeId, req.storeId!)));

      return {
        customers,
        total: countQuery[0]?.count ?? 0
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
}

// Get customer details with orders
export async function getCustomerDetails(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!req.storeId) {
      return res.status(400).json({ error: 'Store context required' });
    }

    const result = await withStore(req.storeId, async (tx) => {
      const customerResult = await tx
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          phone: users.phone,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(and(eq(users.id, id), eq(users.storeId, req.storeId!))) // Ensure store isolation
        .limit(1);

      const customer = customerResult[0];

      if (!customer) {
        return null;
      }

      // Get customer orders
      const customerOrders = await tx
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          total: orders.total,
          status: orders.status,
          paymentStatus: orders.paymentStatus,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(eq(orders.customerEmail, customer.email))
        .orderBy(desc(orders.createdAt));

      // Get addresses
      const customerAddresses = await tx.select()
        .from(addresses)
        .where(eq(addresses.userId, id));
      
      return {
        customer: {
          ...customer,
          orders: customerOrders,
          addresses: customerAddresses
        }
      };
    });

    if (!result) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(result);
  } catch (error) {
    console.error('Get customer details error:', error);
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
}

// Get guest customers (from orders without user account)
export async function getGuestCustomers(req: Request, res: Response) {
  try {
    const { limit = 50, offset = 0 } = req.query;

    if (!req.storeId) {
      return res.status(400).json({ error: 'Store context required' });
    }

    const result = await withStore(req.storeId, async (tx) => {
      // Use raw SQL for complex GROUP BY with aggregates
      const guests = await tx.execute(sql`
        SELECT 
          customer_email as email,
          customer_name as name,
          customer_phone as phone,
          COUNT(*)::int as order_count,
          SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END) as total_spent,
          MAX(created_at) as last_order
        FROM orders
        WHERE user_id IS NULL AND store_id = ${req.storeId}
        GROUP BY customer_email, customer_name, customer_phone
        ORDER BY last_order DESC
        LIMIT ${Number(limit)} OFFSET ${Number(offset)}
      `);

      const countResult = await tx.execute(sql`
        SELECT COUNT(DISTINCT customer_email)::int as count 
        FROM orders WHERE user_id IS NULL AND store_id = ${req.storeId}
      `);
      const countData = countResult[0] as { count: number } | undefined;

      return {
        guests,
        total: countData?.count ?? 0
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Get guest customers error:', error);
    res.status(500).json({ error: 'Error al obtener invitados' });
  }
}

// ============================================
// REPORTS CONTROLLERS
// ============================================

// Sales report
export async function getSalesReport(req: Request, res: Response) {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    if (!req.storeId) {
      return res.status(400).json({ error: 'Store context required' });
    }

    const result = await withStore(req.storeId, async (tx) => {
      // Build date filter
      const dateFilter = startDate && endDate
        ? sql`created_at >= ${startDate} AND created_at <= ${endDate}`
        : startDate
          ? sql`created_at >= ${startDate}`
          : endDate
            ? sql`created_at <= ${endDate}`
            : sql`store_id = ${req.storeId}`;

      // Add store filter to date filter if it's not just 1=1
      const finalFilter = startDate || endDate 
        ? sql`${dateFilter} AND store_id = ${req.storeId}`
        : dateFilter;

      // Get overall stats
      const statsResult = await tx.execute(sql`
        SELECT 
          COUNT(*)::int as total_orders,
          COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) as total_revenue,
          COALESCE(AVG(CASE WHEN status != 'cancelled' THEN total ELSE NULL END), 0) as avg_order_value,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::int as cancelled_orders
        FROM orders
        WHERE ${finalFilter}
      `);
      const stats = statsResult[0];

      // Get sales by date using PostgreSQL date formatting
      const dateFormat = groupBy === 'month' ? 'YYYY-MM' : groupBy === 'week' ? 'IYYY-"W"IW' : 'YYYY-MM-DD';

      const salesByDate = await tx.execute(sql`
        SELECT 
          to_char(created_at, ${dateFormat}) as date,
          COUNT(*)::int as orders,
          SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END) as revenue
        FROM orders
        WHERE ${finalFilter}
        GROUP BY to_char(created_at, ${dateFormat})
        ORDER BY date DESC
        LIMIT 30
      `);

      // Get orders by status
      const ordersByStatus = await tx.execute(sql`
        SELECT 
          status,
          COUNT(*)::int as count,
          SUM(total) as revenue
        FROM orders
        WHERE ${finalFilter}
        GROUP BY status
      `);

      // Top products
      const topProducts = await tx.execute(sql`
        SELECT 
          product_name,
          SUM(quantity)::int as total_sold,
          SUM(price * quantity) as revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.status != 'cancelled' AND ${finalFilter}
        GROUP BY product_name
        ORDER BY total_sold DESC
        LIMIT 10
      `);

      return {
        stats,
        salesByDate,
        ordersByStatus,
        topProducts
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
}

// Dashboard stats
export async function getDashboardStats(req: Request, res: Response) {
  try {
    if (!req.storeId) {
      return res.status(400).json({ error: 'Store context required' });
    }

    const result = await withStore(req.storeId, async (tx) => {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      // Today's stats
      const todayStatsResult = await tx.execute(sql`
        SELECT 
          COUNT(*)::int as orders,
          COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) as revenue
        FROM orders
        WHERE date(created_at) = CURRENT_DATE AND store_id = ${req.storeId}
      `);
      const todayStats = todayStatsResult[0] as { orders: number; revenue: number };

      // This month's stats
      const monthStatsResult = await tx.execute(sql`
        SELECT 
          COUNT(*)::int as orders,
          COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) as revenue
        FROM orders
        WHERE created_at >= ${startOfMonth} AND store_id = ${req.storeId}
      `);
      const monthStats = monthStatsResult[0] as { orders: number; revenue: number };

      // Total customers
      const customerCountResult = await tx.execute(sql`
        SELECT COUNT(*)::int as count FROM users WHERE role = 'customer' AND store_id = ${req.storeId}
      `);
      const customerCount = customerCountResult[0] as { count: number } | undefined;

      // Total products
      const productCount = await tx.select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.storeId, req.storeId!));

      // Pending orders
      const pendingOrdersResult = await tx.execute(sql`
        SELECT COUNT(*)::int as count FROM orders WHERE (status = 'pending' OR status = 'paid') AND store_id = ${req.storeId}
      `);
      const pendingOrders = pendingOrdersResult[0] as { count: number } | undefined;

      // Execute independent queries in parallel
      const [
        recentOrders,
        ordersByStatusResult,
        salesLast7DaysResult,
        topViewedProducts,
        topClickedProducts
      ] = await Promise.all([
        // 1. Recent orders
        tx.select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          customerName: orders.customerName,
          customerEmail: orders.customerEmail,
          total: orders.total,
          status: orders.status,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(eq(orders.storeId, req.storeId!))
        .orderBy(desc(orders.createdAt))
        .limit(5),

        // 2. Orders by status
        tx.execute(sql`
          SELECT status, COUNT(*)::int as count
          FROM orders
          WHERE store_id = ${req.storeId}
          GROUP BY status
        `),

        // 3. Sales last 7 days
        tx.execute(sql`
          SELECT 
            to_char(created_at, 'YYYY-MM-DD') as date,
            COUNT(*)::int as orders,
            COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) as revenue
          FROM orders
          WHERE created_at >= CURRENT_DATE - INTERVAL '6 days' AND store_id = ${req.storeId}
          GROUP BY to_char(created_at, 'YYYY-MM-DD')
          ORDER BY date ASC
        `),

        // 4. Top Viewed Products
        tx.select({
          id: products.id,
          name: products.name,
          image: products.image,
          views: products.views,
          price: products.price
        })
        .from(products)
        .where(eq(products.storeId, req.storeId!))
        .orderBy(desc(products.views))
        .limit(5),

        // 5. Top Clicked Products
        tx.select({
          id: products.id,
          name: products.name,
          image: products.image,
          clicks: products.clicks,
          price: products.price
        })
        .from(products)
        .where(eq(products.storeId, req.storeId!))
        .orderBy(desc(products.clicks))
        .limit(5)
      ]);

      return {
        today: todayStats,
        month: monthStats,
        customers: customerCount?.count ?? 0,
        products: productCount[0]?.count ?? 0,
        pendingOrders: pendingOrders?.count ?? 0,
        recentOrders,
        ordersByStatus: ordersByStatusResult,
        salesLast7Days: salesLast7DaysResult,
        topViewedProducts,
        topClickedProducts
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
}
// Get system audit logs (Super Admin)
export async function getSystemLogs(req: Request, res: Response) {
  try {
    const { action, userId, limit = 50, offset = 0 } = req.query;
    
    // Import dynamically to avoid circular deps if any, or just standard import
    const { getAuditLogs } = await import('../services/audit.service.js');
    
    const logs = await getAuditLogs({
      action: action as any,
      userId: userId as string,
      limit: Number(limit),
      offset: Number(offset)
    });
    
    res.json({ logs });
  } catch (error) {
    console.error('Get system logs error:', error);
    res.status(500).json({ error: 'Error al obtener logs del sistema' });
  }
}
