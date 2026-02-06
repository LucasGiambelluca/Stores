import { v4 as uuidv4 } from 'uuid';
import { eq, desc, sql, and, isNotNull, inArray } from 'drizzle-orm';
import { db, orders, orderItems, products, stores, type Order, type OrderItem } from '../db/drizzle.js';
import { checkStock } from '../controllers/products.controller.js';
import { withStore, withStoreContext } from '../db/rls.js';

interface OrderItemInput {
  productId: string;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

interface CreateOrderBody {
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  shippingAddress?: any; // JSONB object
  shippingMethod?: string;
  shippingCost?: number;
  items: OrderItemInput[];
  paymentMethod?: string;
  notes?: string;
}

export class OrdersService {
  // Helper: Format order to snake_case for frontend compatibility
  private formatOrder(order: Order) {
    return {
      id: order.id,
      order_number: order.orderNumber,
      user_id: order.userId,
      customer_email: order.customerEmail,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      shipping_address: order.shippingAddress,
      shipping_method: order.shippingMethod,
      shipping_cost: order.shippingCost,
      shipping_carrier: order.shippingCarrier,
      tracking_number: order.trackingNumber,
      subtotal: order.subtotal,
      total: order.total,
      status: order.status,
      payment_method: order.paymentMethod,
      payment_id: order.paymentId,
      payment_status: order.paymentStatus,
      payment_receipt: order.paymentReceipt,
      receipt_verified: order.receiptVerified,
      notes: order.notes,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
    };
  }

  // Helper: Format order item to snake_case
  private formatOrderItem(item: OrderItem) {
    return {
      id: item.id,
      order_id: item.orderId,
      product_id: item.productId,
      product_name: item.productName,
      product_image: item.productImage,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
    };
  }

  // Generate order number
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `XM-${timestamp}-${random}`;
  }

  async createOrder(body: CreateOrderBody, userId: string | null, storeId?: string) {
    // Validation
    if (!body.customerEmail || !body.customerName || !body.items?.length) {
      throw new Error('Datos de orden incompletos');
    }

    // If storeId is not provided, we try to infer it, but with RLS this might fail if we don't have context.
    // However, if we are calling this, we likely already have context set?
    // No, `withStore` sets the context.
    // So we need `storeId` passed in to set the context.
    
    if (!storeId) {
        // Try to find storeId from products. 
        // This query might fail if RLS is active and strict.
        // We'll try anyway.
        const productIds = body.items.map(item => item.productId);
        const productsData = await db.select({ id: products.id, storeId: products.storeId })
          .from(products)
          .where(inArray(products.id, productIds));
          
        const storeIds = new Set(productsData.map(p => p.storeId));
        if (storeIds.size === 0) throw new Error('No se encontraron los productos');
        if (storeIds.size > 1) throw new Error('Los productos pertenecen a diferentes tiendas');
        storeId = Array.from(storeIds)[0];
    }

    return withStore(storeId!, async (tx) => {
        // Validate stock availability INSIDE transaction/context
        // We need to pass tx to checkStock or it will use global db and fail RLS?
        // checkStock uses db.select. It needs to be refactored or we use a local check.
        // Let's implement a local check here to be safe and atomic.
        
        const productIds = body.items.map(item => item.productId);
        const productsData = await tx.select({
            id: products.id,
            name: products.name,
            stock: products.stock,
            variantsStock: products.variantsStock,
            price: products.price,
            storeId: products.storeId,
        })
          .from(products)
          .where(inArray(products.id, productIds));
          
        const productMap = new Map(productsData.map((p: any) => [p.id, p]));
        
        // Calculate totals using DB prices
        let subtotal = 0;
        const validItems: any[] = [];

        for (const item of body.items) {
            const product = productMap.get(item.productId) as any; // Cast to any to avoid inference issues
            if (!product) throw new Error(`Producto no encontrado: ${item.productId}`);
            
            // SECURITY: Use price from DB, ignore frontend price
            const realPrice = Number(product.price);
            
            // Check stock: variant-specific if color provided, otherwise total
            const variantsStock = product.variantsStock as Record<string, number> | null;
            if (item.color && variantsStock && variantsStock[item.color] !== undefined) {
                if (variantsStock[item.color] < item.quantity) {
                    throw new Error(`Stock insuficiente de "${product.name}" en color "${item.color}"`);
                }
            } else if ((product.stock ?? 0) < item.quantity) {
                throw new Error(`Stock insuficiente de "${product.name}"`);
            }

            subtotal += realPrice * item.quantity;
            
            validItems.push({
                ...item,
                price: realPrice, // Override with real price
                productName: product.name // Ensure name matches DB
            });
        }

        const orderId = uuidv4();
        const orderNumber = this.generateOrderNumber();

        const shippingCost = body.shippingCost || 0;
        const total = subtotal + shippingCost;
        
        // 0. Check license limits
        const { getLicenseUsage } = await import('../middleware/licenseEnforcement.middleware.js');
        const usage = await getLicenseUsage(storeId!, tx);

        if (!usage) throw new Error('NO_LICENSE: No valid license found');
        if (!usage.canCreateOrder) {
            throw new Error(`ORDER_LIMIT_EXCEEDED: Has alcanzado el límite de ${usage.maxOrders} órdenes mensuales.`);
        }

        // 1. Create order
        await tx.insert(orders).values({
            id: orderId,
            storeId: storeId!,
            orderNumber,
            userId,
            customerEmail: body.customerEmail,
            customerName: body.customerName,
            customerPhone: body.customerPhone ?? null,
            shippingAddress: body.shippingAddress ?? null,
            shippingMethod: body.shippingMethod ?? null,
            shippingCost,
            subtotal,
            total,
            paymentMethod: body.paymentMethod ?? null,
            notes: body.notes ?? null,
            status: 'pending',
        });

        // 2. Batch insert all order items
        const orderItemsData = validItems.map(item => ({
            id: uuidv4(),
            storeId: storeId!,
            orderId,
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage ?? null,
            price: item.price, // This is now the DB price
            quantity: item.quantity,
            size: item.size ?? null,
            color: item.color ?? null,
        }));
        
        await tx.insert(orderItems).values(orderItemsData);

        // 3. Batch update stock (both total and variant-specific)
        // First update total stock
        const stockUpdates = validItems.map(item => 
            sql`WHEN ${products.id} = ${item.productId} THEN ${products.stock} - ${item.quantity}`
        );
        
        await tx.update(products)
            .set({
            stock: sql`CASE ${sql.join(stockUpdates, sql` `)} ELSE ${products.stock} END`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(inArray(products.id, productIds));
        
        // Update variant-specific stock for items with color
        for (const item of validItems) {
            if (item.color) {
                const product = productMap.get(item.productId) as any;
                const variantsStock = product.variantsStock as Record<string, number> | null;
                if (variantsStock && variantsStock[item.color] !== undefined) {
                    const newVariantsStock = { ...variantsStock, [item.color]: variantsStock[item.color] - item.quantity };
                    await tx.update(products)
                        .set({ variantsStock: newVariantsStock, updatedAt: sql`CURRENT_TIMESTAMP` })
                        .where(eq(products.id, item.productId));
                }
            }
        }
            
        // Send confirmation emails (async)
        import('../services/email.service.js').then(async (emailService) => {
            // 1. Send to Buyer
            emailService.sendOrderConfirmation({
                orderNumber,
                customerName: body.customerName,
                customerEmail: body.customerEmail,
                items: body.items.map(i => ({
                    productName: i.productName,
                    quantity: i.quantity,
                    price: i.price,
                    size: i.size,
                    color: i.color,
                })),
                subtotal,
                shippingCost,
                total,
                shippingAddress: body.shippingAddress,
                paymentMethod: body.paymentMethod,
            }).catch(err => console.error('Buyer email error:', err));

            // 2. Send to Seller (Store Owner)
            // Fetch store owner email first
            try {
                 const storeResult = await db.select({ ownerEmail: stores.ownerEmail })
                    .from(stores)
                    .where(eq(stores.id, storeId!))
                    .limit(1);
                 
                 const ownerEmail = storeResult[0]?.ownerEmail;

                 if (ownerEmail) {
                    emailService.sendNewOrderNotification(
                        ownerEmail,
                        orderNumber,
                        total,
                        body.customerName
                    ).catch(err => console.error('Seller email error:', err));
                 }
            } catch (err) {
                console.error('Error fetching store owner for email:', err);
            }
        });

        return {
            id: orderId,
            orderNumber,
            total,
            status: 'pending'
        };
    });
  }

  /**
   * Get order by ID or order number with optional store isolation
   * @param id - Order ID or order number
   * @param storeId - Optional store ID for isolation
   */
  async getOrder(id: string, storeId?: string) {
    return withStoreContext(storeId, async (tx) => {
        // Build where clause with optional store isolation
        const baseCondition = sql`(${orders.id} = ${id} OR ${orders.orderNumber} = ${id})`;
        const whereClause = storeId 
        ? sql`${baseCondition} AND ${orders.storeId} = ${storeId}`
        : baseCondition;

        const result = await tx.select()
        .from(orders)
        .where(whereClause)
        .limit(1);

        const order = result[0];

        if (!order) {
        throw new Error('Orden no encontrada');
        }

        // Get items
        const items = await tx.select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

        return {
        ...this.formatOrder(order),
        items: items.map(this.formatOrderItem)
        };
    });
  }

  async getUserOrders(userId: string, storeId?: string) {
    return withStoreContext(storeId, async (tx) => {
        const result = await tx.select()
        .from(orders)
        .where(and(eq(orders.userId, userId), storeId ? eq(orders.storeId, storeId) : undefined))
        .orderBy(desc(orders.createdAt));

        return result.map(this.formatOrder);
    });
  }

  /**
   * Get all orders with store isolation
   * @param storeId - Store ID (required for isolation)
   * @param status - Optional status filter
   * @param limit - Pagination limit
   * @param offset - Pagination offset
   */
  async getAllOrders(storeId: string, status?: string, limit: number = 50, offset: number = 0) {
    return withStore(storeId, async (tx) => {
        const statusValue = status as 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | undefined;
        
        // Always filter by storeId for strict isolation
        let result;
        if (statusValue) {
        result = await tx.select()
            .from(orders)
            .where(and(eq(orders.storeId, storeId), eq(orders.status, statusValue)))
            .orderBy(desc(orders.createdAt))
            .limit(limit)
            .offset(offset);
        } else {
        result = await tx.select()
            .from(orders)
            .where(eq(orders.storeId, storeId))
            .orderBy(desc(orders.createdAt))
            .limit(limit)
            .offset(offset);
        }

        // Get count with storeId filter
        const countQuery = statusValue
        ? await tx.select({ count: sql<number>`count(*)` }).from(orders).where(and(eq(orders.storeId, storeId), eq(orders.status, statusValue)))
        : await tx.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.storeId, storeId));

        return {
        orders: result.map(this.formatOrder),
        total: countQuery[0]?.count ?? 0
        };
    });
  }

  /**
   * Update order status with store isolation
   * @param id - Order ID
   * @param storeId - Store ID for isolation
   * @param updates - Status and other updates
   */
  async updateOrderStatus(id: string, storeId: string, updates: { status?: string, notes?: string, shippingStatus?: string, trackingNumber?: string, carrier?: string }) {
    return withStore(storeId, async (tx) => {
        // Get current order with store isolation
        const currentOrder = await tx.select().from(orders)
        .where(and(eq(orders.id, id), eq(orders.storeId, storeId)))
        .limit(1);
        const orderData = currentOrder[0];
        
        if (!orderData) {
        throw new Error('Orden no encontrada');
        }

        // Validate status if provided
        if (updates.status) {
        const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(updates.status)) {
            throw new Error('Estado inválido');
        }

        // If cancelling, restore stock
        if (updates.status === 'cancelled' && orderData.status !== 'cancelled') {
            const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, id));
            
            for (const item of items) {
            // Increment stock back using raw SQL
            await tx.execute(
                sql`UPDATE products SET stock = stock + ${item.quantity}, updated_at = CURRENT_TIMESTAMP WHERE id = ${item.productId}`
            );
            }
            console.log(`📦 Stock restored for cancelled order ${orderData.orderNumber}`);
        }
        }

        // Build update object dynamically
        const updateData: Record<string, string | ReturnType<typeof sql> | undefined> = {
        updatedAt: sql`CURRENT_TIMESTAMP`,
        };
        
        if (updates.status) updateData.status = updates.status;
        if (updates.notes !== undefined) updateData.notes = updates.notes;
        if (updates.shippingStatus) updateData.shippingStatus = updates.shippingStatus;
        if (updates.trackingNumber !== undefined) updateData.trackingNumber = updates.trackingNumber;
        if (updates.carrier !== undefined) updateData.shippingCarrier = updates.carrier;

        await tx.update(orders)
        .set(updateData)
        .where(and(eq(orders.id, id), eq(orders.storeId, storeId)));

        // Send status update email for important status changes
        if (updates.status && ['paid', 'shipped', 'delivered'].includes(updates.status)) {
        import('../services/email.service.js').then(emailService => {
            emailService.sendOrderStatusUpdate(
            orderData.customerEmail,
            orderData.customerName,
            orderData.orderNumber,
            updates.status!,
            (updates.trackingNumber || orderData.trackingNumber) || undefined
            ).catch(err => console.error('Status email error:', err));
        });
        }
    });
  }

  async uploadReceipt(orderId: string, receiptUrl: string, storeId?: string) {
    if (!receiptUrl) {
      throw new Error('URL del comprobante requerida');
    }

    return withStoreContext(storeId, async (tx) => {
        // Check order exists
        const result = await tx.select()
        .from(orders)
        .where(and(
            sql`${orders.id} = ${orderId} OR ${orders.orderNumber} = ${orderId}`,
            storeId ? eq(orders.storeId, storeId) : undefined
        ))
        .limit(1);
        
        const order = result[0];
        
        if (!order) {
        throw new Error('Orden no encontrada');
        }

        // Update order with receipt
        await tx.update(orders)
        .set({
            paymentReceipt: receiptUrl,
            updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(orders.id, order.id));

        return {
        id: order.id,
        orderNumber: order.orderNumber,
        paymentReceipt: receiptUrl,
        };
    });
  }

  async verifyReceipt(id: string, approved: boolean, storeId?: string, notes?: string) {
    return withStoreContext(storeId, async (tx) => {
        // Get order
        const result = await tx.select()
        .from(orders)
        .where(and(eq(orders.id, id), storeId ? eq(orders.storeId, storeId) : undefined))
        .limit(1);
        
        const order = result[0];
        
        if (!order) {
        throw new Error('Orden no encontrada');
        }

        if (!order.paymentReceipt) {
        throw new Error('Esta orden no tiene comprobante adjunto');
        }

        if (approved) {
        // Approve: mark as verified and update status to 'paid'
        await tx.update(orders)
            .set({
            receiptVerified: true,
            status: 'paid',
            notes: notes ?? 'Comprobante verificado',
            updatedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(eq(orders.id, id));

        // Send confirmation email
        import('../services/email.service.js').then(emailService => {
            emailService.sendOrderStatusUpdate(
            order.customerEmail,
            order.customerName,
            order.orderNumber,
            'paid'
            ).catch(err => console.error('Receipt email error:', err));
        });

        return 'Comprobante aprobado, orden marcada como pagada';
        } else {
        // Reject: keep pending but add note
        await tx.update(orders)
            .set({
            receiptVerified: false,
            notes: notes ?? 'Comprobante rechazado',
            updatedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(eq(orders.id, id));

        return 'Comprobante rechazado';
        }
    });
  }

  async getPendingReceipts(storeId?: string) {
    return withStoreContext(storeId, async (tx) => {
        const result = await tx.select()
        .from(orders)
        .where(and(
            isNotNull(orders.paymentReceipt),
            eq(orders.receiptVerified, false),
            eq(orders.status, 'pending'),
            storeId ? eq(orders.storeId, storeId) : undefined
        ))
        .orderBy(desc(orders.createdAt));

        return result.map(this.formatOrder);
    });
  }
}

export const ordersService = new OrdersService();
