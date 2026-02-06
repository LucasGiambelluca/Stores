import { Request, Response } from 'express';
import { PaymentService, WebhookHeaders } from '../services/payment.service.js';
import { env } from '../env.js';

const paymentService = new PaymentService();

/**
 * Get MercadoPago public key for client-side SDK
 */
export async function getMPConfig(req: Request, res: Response) {
  try {
    // Return public key for frontend initialization
    res.json({
      publicKey: env.MP_PUBLIC_KEY || null,
      sdkUrl: 'https://sdk.mercadopago.com/js/v2',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Create payment preference for an order
 */
export async function createPreference(req: Request, res: Response) {
  try {
    const { orderId } = req.body;
    const storeId = req.storeId;

    if (!storeId) {
      return res.status(401).json({ error: 'Store context required' });
    }

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const preference = await paymentService.createCheckoutLink(orderId, storeId, 'mercadopago');
    
    res.json({
      success: true,
      preferenceId: preference.id,
      initPoint: preference.initPoint,
      sandboxInitPoint: preference.sandboxInitPoint,
    });
  } catch (error: any) {
    console.error('Create preference error:', error);
    res.status(500).json({ error: error.message || 'Failed to create preference' });
  }
}

/**
 * Create payment intent for SaaS subscription
 */
export async function createIntent(req: Request, res: Response) {
  try {
    const { planId, email, storeId } = req.body;

    if (!planId || !email) {
      return res.status(400).json({ error: 'planId and email are required' });
    }

    if (!storeId) {
      return res.status(400).json({ error: 'storeId is required' });
    }

    // Create subscription via PaymentService
    const subscription = await paymentService.createSubscription(planId, email, storeId, 'mercadopago');

    res.json({
      success: true,
      subscriptionId: subscription.id,
      initPoint: subscription.initPoint,
      message: 'Subscription created successfully',
    });
  } catch (error: any) {
    console.error('Create subscription error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Handle payment webhook (generic endpoint)
 */
export async function webhook(req: Request, res: Response) {
  try {
    const storeId = req.query.storeId as string || req.storeId;
    
    if (!storeId) {
      console.error('[Webhook] Missing storeId');
      return res.status(200).json({ received: true, error: 'Missing storeId' });
    }

    const headers: WebhookHeaders = {
      'x-signature': req.headers['x-signature'] as string | undefined,
      'x-request-id': req.headers['x-request-id'] as string | undefined,
    };

    const result = await paymentService.handleWebhook(
      'mercadopago',
      storeId,
      req.query as Record<string, any>,
      req.body,
      headers
    );

    if (!result.success && result.action === 'verification_failed') {
      console.error('[Webhook] Verification failed:', result.error);
      return res.status(401).json({ received: false, error: 'Verification failed' });
    }

    res.status(200).json({
      received: true,
      action: result.action,
      orderId: result.orderId,
    });
  } catch (error: any) {
    console.error('[Webhook] Error:', error);
    res.status(200).json({ received: true, error: 'Internal processing error' });
  }
}

/**
 * Get payment status by payment ID
 */
export async function getPaymentStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const storeId = req.storeId;

    if (!storeId) {
      return res.status(401).json({ error: 'Store context required' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    // Fetch status from payment provider
    const status = await paymentService.getPaymentStatus(id, storeId, 'mercadopago');

    res.json({
      success: true,
      payment: status,
    });
  } catch (error: any) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get full payment configuration (Admin)
 */
export async function getFullConfig(req: Request, res: Response) {
  try {
    const storeId = req.storeId;
    
    if (!storeId) {
      return res.status(401).json({ error: 'Store context required' });
    }

    // Return configuration status without exposing secrets
    res.json({
      mercadopago: {
        configured: !!env.MP_ACCESS_TOKEN,
        publicKeySet: !!env.MP_PUBLIC_KEY,
      },
      stripe: {
        configured: false,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Update payment configuration (Admin)
 */
export async function updateConfig(req: Request, res: Response) {
  try {
    const storeId = req.storeId;
    const { provider, accessToken, publicKey, webhookSecret } = req.body;

    if (!storeId) {
      return res.status(401).json({ error: 'Store context required' });
    }

    if (!provider) {
      return res.status(400).json({ error: 'provider is required' });
    }

    if (provider === 'mercadopago') {
      if (!accessToken) {
        return res.status(400).json({ error: 'accessToken is required for MercadoPago' });
      }

      // Import encryption utility
      const { encrypt } = await import('../utils/crypto.utils.js');

      // Encrypt sensitive credentials
      const configValue = {
        mercadopagoAccessToken: encrypt(accessToken),
        mercadopagoPublicKey: publicKey || null,
        mercadopagoWebhookSecret: webhookSecret ? encrypt(webhookSecret) : null,
        domain: req.get('host') || 'tiendita.com',
      };

      // Upsert config to storeConfig table
      const { db } = await import('../db/drizzle.js');
      const { storeConfig } = await import('../db/schema.js');
      const { eq, and } = await import('drizzle-orm');

      const existing = await db.query.storeConfig.findFirst({
        where: and(
          eq(storeConfig.storeId, storeId),
          eq(storeConfig.key, 'mercadopago_config')
        )
      });

      if (existing) {
        await db.update(storeConfig)
          .set({ value: configValue as any, updatedAt: new Date() })
          .where(and(
            eq(storeConfig.storeId, storeId),
            eq(storeConfig.key, 'mercadopago_config')
          ));
      } else {
        await db.insert(storeConfig).values({
          storeId,
          key: 'mercadopago_config',
          value: configValue as any,
          updatedAt: new Date(),
        });
      }

      res.json({
        success: true,
        message: 'MercadoPago configuration updated successfully',
      });
    } else {
      res.status(400).json({ error: `Provider ${provider} not supported yet` });
    }
  } catch (error: any) {
    console.error('Update config error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * PaymentsController class for backwards compatibility
 */
export class PaymentsController {
  
  /**
   * POST /api/payments/checkout
   * Starts the checkout process for an order.
   */
  static async startCheckout(req: Request, res: Response) {
    return createPreference(req, res);
  }

  /**
   * POST /api/payments/webhook/:provider
   * Public endpoint for payment provider notifications (MercadoPago, etc.)
   */
  static async handleWebhook(req: Request, res: Response) {
    return webhook(req, res);
  }
}


