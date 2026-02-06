import { withStore, withStoreContext } from '../db/rls.js';
import { sql, eq, and } from 'drizzle-orm';
import { shipments, orders, orderItems } from '../db/schema.js';
import { v4 as uuidv4 } from 'uuid';
import enviopackProvider from './providers/enviopack.provider.js';
import mockProvider from './providers/mock.provider.js';
import { ShippingProvider, ShipmentInfo } from './shipping.types.js';

function getProvider(): ShippingProvider {
  return (process.env.SHIPPING_PROVIDER as ShippingProvider) || 'mock';
}

export interface CreateShipmentInput {
  orderId: string;
  carrier?: ShippingProvider;
  storeId?: string; // Add storeId
}

// ... (types)

// Create a shipment for an order
export async function createShipment(input: CreateShipmentInput): Promise<{
  success: boolean;
  shipment?: ShipmentInfo;
  error?: string;
}> {
  try {
    const { orderId, carrier, storeId } = input;
    const selectedCarrier = carrier || getProvider();

    // Use withStoreContext to ensure RLS
    return withStoreContext(storeId, async (tx) => {
        // Check if shipment already exists
        const existingShipment = await tx.select()
        .from(shipments)
        .where(eq(shipments.orderId, orderId))
        .limit(1);

        if (existingShipment.length > 0) {
        return {
            success: false,
            error: 'Ya existe un envío para esta orden',
        };
        }

        // Get order details with items summary
        const orderResults = await tx.execute(sql`
        SELECT o.*, string_agg(oi.product_name || ' x' || oi.quantity, ', ') as items_summary
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE o.id = ${orderId}
        GROUP BY o.id
        `);
        const orderResult = orderResults[0] as any;

        if (!orderResult) {
        return {
            success: false,
            error: 'Orden no encontrada',
        };
        }

        // Get order items including storeId
        const items = await tx.select({
        name: orderItems.productName,
        quantity: orderItems.quantity,
        price: orderItems.price,
        storeId: orderItems.storeId,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));
        
        // Extract storeId from first order item (all items in an order should have the same storeId)
        const itemStoreId = items.length > 0 ? items[0].storeId : null;
        
        if (!itemStoreId) {
        return {
            success: false,
            error: 'No se pudo determinar el storeId de la orden',
        };
        }

        // Verify storeId matches context if present
        if (storeId && itemStoreId !== storeId) {
             // This implies we are trying to create a shipment for an order that doesn't belong to the current store context
             // RLS should have blocked reading the order, but if not, we block here.
             return {
                success: false,
                error: 'La orden no pertenece a esta tienda',
            };
        }

        // Prepare shipment input
        const shipmentInput = {
        orderId: orderResult.id,
        orderNumber: orderResult.order_number,
        customerName: orderResult.customer_name,
        customerEmail: orderResult.customer_email,
        customerPhone: orderResult.customer_phone,
        shippingAddress: orderResult.shipping_address || 'Sin dirección especificada',
        items,
        total: orderResult.total,
        };

        // Call the appropriate provider
        let result;
        switch (selectedCarrier) {
        case 'enviopack':
            result = await enviopackProvider.createShipment(shipmentInput);
            break;
        // case 'andreani': // TEMPORARILY DISABLED
        //   result = await andreaniProvider.createShipment(shipmentInput);
        //   break;
        // case 'correo_argentino': // TEMPORARILY DISABLED
        //   result = await correoArgentinoProvider.createShipment(shipmentInput);
        //   break;
        case 'mock':
        default:
            result = await mockProvider.createShipment(shipmentInput);
        }

        if (!result.success) {
        return {
            success: false,
            error: result.error || 'Error al crear envío',
        };
        }

        // Save shipment to database
        const shipmentId = uuidv4();
        await tx.insert(shipments).values({
        id: shipmentId,
        storeId: itemStoreId, // Now we have the storeId from order_items
        orderId,
        carrier: selectedCarrier,
        trackingNumber: result.trackingNumber ?? null,
        labelUrl: result.labelUrl ?? null,
        labelData: result.labelData ?? null,
        status: 'created',
        carrierResponse: result.carrierResponse || {},
        });

        // Update order with tracking info
        await tx.update(orders)
        .set({
            shippingCarrier: selectedCarrier,
            trackingNumber: result.trackingNumber,
            status: 'processing', // Keep processing until carrier confirms 'shipped'
            updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(orders.id, orderId));

        // Send shipping email
        try {
            const { sendOrderStatusUpdate } = await import('./email.service.js');
            await sendOrderStatusUpdate(
                orderResult.customer_email,
                orderResult.customer_name,
                orderResult.order_number,
                'shipped', // We treat creation as shipped for the email notification flow usually, or we can wait. 
                           // But usually "Package Shipped" email contains tracking.
                           // Let's check the previous logic. The previous logic in orders.service sent it on status change.
                           // Here we are setting status to 'processing'.
                           // The user asked for "Package Sent" email.
                           // Let's send it here if we have a tracking number.
                result.trackingNumber
            );
             console.log(`📧 Shipping email sent for order ${orderResult.order_number}`);
        } catch (emailError) {
             console.error('❌ Failed to send shipping email:', emailError);
        }

        return {
        success: true,
        shipment: {
            id: shipmentId,
            orderId,
            orderNumber: orderResult.order_number,
            carrier: selectedCarrier,
            trackingNumber: result.trackingNumber,
            labelUrl: result.labelUrl || '',
            status: 'created',
            estimatedDelivery: result.estimatedDelivery,
            createdAt: new Date().toISOString(),
        },
        };
    });
  } catch (error) {
    console.error('Create shipment error:', error);
    return {
      success: false,
      error: 'Error interno al crear envío',
    };
  }
}

// Get tracking information
export async function getTracking(trackingNumber: string, storeId?: string): Promise<{
  success: boolean;
  tracking?: any;
  error?: string;
}> {
  try {
    return withStoreContext(storeId, async (tx) => {
        // Find shipment in database
        const shipmentResults = await tx.execute(sql`
        SELECT s.*, o.order_number, o.customer_name, o.customer_email, o.shipping_address
        FROM shipments s
        JOIN orders o ON o.id = s.order_id
        WHERE s.tracking_number = ${trackingNumber}
        ${storeId ? sql`AND s.store_id = ${storeId}` : sql``}
        `);
        const shipmentResult = shipmentResults[0] as any;

        if (!shipmentResult) {
        return {
            success: false,
            error: 'Número de seguimiento no encontrado',
        };
        }

        // Get tracking from provider
        let trackingResult;
        switch (shipmentResult.carrier) {
        case 'enviopack':
            trackingResult = await enviopackProvider.getTracking(trackingNumber);
            break;
        // case 'andreani': // TEMPORARILY DISABLED
        //   trackingResult = await andreaniProvider.getTracking(trackingNumber);
        //   break;
        // case 'correo_argentino': // TEMPORARILY DISABLED
        //   trackingResult = await correoArgentinoProvider.getTracking(trackingNumber);
        //   break;
        case 'mock':
        default:
            trackingResult = await mockProvider.getTracking(trackingNumber);
        }

        // Update shipment status in database if changed
        if (trackingResult.success && trackingResult.status !== shipmentResult.status) {
        const updateData: any = {
            status: trackingResult.status,
            updatedAt: sql`CURRENT_TIMESTAMP`,
        };

        if (trackingResult.status === 'shipped' && !shipmentResult.shipped_at) {
            updateData.shippedAt = sql`CURRENT_TIMESTAMP`;
        }
        if (trackingResult.status === 'delivered' && !shipmentResult.delivered_at) {
            updateData.deliveredAt = sql`CURRENT_TIMESTAMP`;
        }

        await tx.update(shipments)
            .set(updateData)
            .where(eq(shipments.id, shipmentResult.id));

        // Also update order status
        if (trackingResult.status === 'shipped') {
            await tx.update(orders).set({ status: 'shipped' }).where(eq(orders.id, shipmentResult.order_id));
        } else if (trackingResult.status === 'delivered') {
            await tx.update(orders).set({ status: 'delivered' }).where(eq(orders.id, shipmentResult.order_id));
        }
        }

        return {
        success: true,
        tracking: {
            ...trackingResult,
            orderNumber: shipmentResult.order_number,
            customerName: shipmentResult.customer_name,
            shippingAddress: shipmentResult.shipping_address,
        },
        };
    });
  } catch (error) {
    console.error('Get tracking error:', error);
    return {
      success: false,
      error: 'Error al obtener información de seguimiento',
    };
  }
}

// Get shipment by order ID
export async function getShipmentByOrderId(orderId: string, storeId?: string): Promise<ShipmentInfo | null> {
  try {
    return withStoreContext(storeId, async (tx) => {
        const results = await tx.execute(sql`
        SELECT s.*, o.order_number
        FROM shipments s
        JOIN orders o ON o.id = s.order_id
        WHERE s.order_id = ${orderId}
        ${storeId ? sql`AND s.store_id = ${storeId}` : sql``}
        `);
        const result = results[0] as any;

        if (!result) return null;

        return {
        id: result.id,
        orderId: result.order_id,
        orderNumber: result.order_number,
        carrier: result.carrier,
        trackingNumber: result.tracking_number,
        labelUrl: result.label_url,
        status: result.status,
        createdAt: result.created_at,
        shippedAt: result.shipped_at,
        deliveredAt: result.delivered_at,
        };
    });
  } catch (error) {
    console.error('Get shipment error:', error);
    return null;
  }
}

// Get label data for an order
export async function getLabelData(orderId: string, storeId?: string): Promise<string | null> {
  try {
    return withStoreContext(storeId, async (tx) => {
        const result = await tx.select({ labelData: shipments.labelData })
        .from(shipments)
        .where(and(
            eq(shipments.orderId, orderId),
            storeId ? eq(shipments.storeId, storeId) : undefined
        ))
        .limit(1);

        return result[0]?.labelData || null;
    });
  } catch (error) {
    console.error('Get label data error:', error);
    return null;
  }
}

// Get tracking by order number (for customer lookup)
export async function getTrackingByOrderNumber(orderNumber: string, storeId?: string): Promise<{
  success: boolean;
  tracking?: any;
  error?: string;
}> {
  try {
    return withStoreContext(storeId, async (tx) => {
        const results = await tx.execute(sql`
        SELECT s.tracking_number
        FROM shipments s
        JOIN orders o ON o.id = s.order_id
        WHERE o.order_number = ${orderNumber}
        ${storeId ? sql`AND s.store_id = ${storeId}` : sql``}
        `);
        const result = results[0] as { tracking_number: string } | undefined;

        if (!result) {
        return {
            success: false,
            error: 'No se encontró envío para esta orden',
        };
        }

        return getTracking(result.tracking_number, storeId);
    });
  } catch (error) {
    console.error('Get tracking by order number error:', error);
    return {
      success: false,
      error: 'Error al buscar información de envío',
    };
  }
}

export default {
  createShipment,
  getTracking,
  getShipmentByOrderId,
  getLabelData,
  getTrackingByOrderNumber,
};
