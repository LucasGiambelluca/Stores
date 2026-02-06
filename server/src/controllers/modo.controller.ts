import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db, orders } from '../db/drizzle.js';

// MODO API Endpoints
const MODO_API_URL = {
  sandbox: 'https://sandbox.modo.com.ar/api/v2',
  production: 'https://backend.modo.com.ar/api/v2',
};

// Helper to get config (in a real app, this might come from DB or Env, here we simulate reading what frontend saves)
// NOTE: For security, sensitive credentials should be in ENV variables, but for this "user configurable" requirement
// we are assuming they might be stored in a secure config table. For now, we'll use a placeholder or ENV.
const getModoCredentials = () => {
  return {
    enabled: process.env.MODO_ENABLED === 'true',
    mode: process.env.MODO_MODE || 'sandbox',
    storeId: process.env.MODO_STORE_ID,
    clientId: process.env.MODO_CLIENT_ID,
    clientSecret: process.env.MODO_CLIENT_SECRET,
  };
};

export async function createPaymentIntention(req: Request, res: Response) {
  try {
    const { orderId, items, payer } = req.body;
    const config = getModoCredentials();

    // 1. Get Order
    const orderResult = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    const order = orderResult[0];

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    // 2. Authenticate with MODO (Mocked for now as we don't have real creds)
    // const token = await authenticate(config);

    // 3. Create Intention
    // const intention = await createIntention(token, order, items, payer);

    // MOCK RESPONSE for UI development
    // In a real scenario, this would return the QR payload or Deep Link from MODO API
    const mockResponse = {
      qr: "00020101021243540010com.mercadolibre012800000000-0000-0000-0000-0000000000005204000053030325802AR5913Tienda Ejemplo6012Buenos Aires63046B35",
      deeplink: `https://modo.com.ar/pay?qr=mock-qr-data&amount=${order.total}`,
      id: `modo-intention-${Date.now()}`
    };

    // Update order with payment ID
    await db.update(orders)
      .set({ 
        paymentId: mockResponse.id,
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId));

    res.json(mockResponse);

  } catch (error) {
    console.error('MODO Create Intention Error:', error);
    res.status(500).json({ error: 'Error al iniciar pago con MODO' });
  }
}

export async function webhook(req: Request, res: Response) {
  try {
    const { id, status, external_reference } = req.body;
    console.log('📦 MODO Webhook:', req.body);

    // Map MODO status to our status
    let orderStatus = 'pending';
    let paymentStatus = 'pending';

    if (status === 'COMPLETED' || status === 'AUTHORIZED') {
      orderStatus = 'paid';
      paymentStatus = 'paid';
    } else if (status === 'REJECTED' || status === 'CANCELLED') {
      orderStatus = 'cancelled';
      paymentStatus = 'rejected';
    }

    if (external_reference) {
       await db.update(orders)
        .set({
          status: orderStatus,
          paymentStatus: paymentStatus,
          updatedAt: new Date()
        })
        .where(eq(orders.id, external_reference));
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('MODO Webhook Error:', error);
    res.sendStatus(500);
  }
}

export function getModoConfig(req: Request, res: Response) {
  // Only return public info
  const config = getModoCredentials();
  res.json({
    enabled: config.enabled,
    mode: config.mode,
  });
}
