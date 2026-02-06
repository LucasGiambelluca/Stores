import { Router, type Router as RouterType } from 'express';
import { saasService } from '../services/saas.service.js';
import { mothershipLimiter } from '../middleware/rateLimit.middleware.js';
import { authMiddleware, requireSuperAdmin } from '../middleware/auth.js';
import { z } from 'zod';

const router: RouterType = Router();

// ===========================================
// PUBLIC ENDPOINTS (For Landing Page)
// ===========================================

// DTO for checkout creation
const CheckoutSchema = z.object({
  plan: z.enum(['free', 'starter', 'pro', 'enterprise']),
  buyerEmail: z.string().email(),
  buyerName: z.string().optional(),
  storeName: z.string().min(2).max(50).optional(),
});

/**
 * POST /api/saas/checkout
 * Creates a MercadoPago payment preference for store purchase
 * Returns init_point URL to redirect buyer
 */
router.post('/checkout', async (req, res) => {
  try {
    const validation = CheckoutSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: validation.error.flatten().fieldErrors 
      });
    }

    const result = await saasService.createSaasCheckout(validation.data);

    res.json({
      success: true,
      initPoint: result.initPoint,
      externalReference: result.externalReference,
    });
  } catch (error: any) {
    console.error('[SaaS Checkout] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to create checkout' });
  }
});

/**
 * POST /api/saas/webhook
 * Handles MercadoPago webhook for SaaS payments
 * Called by MercadoPago when payment status changes
 */
router.post('/webhook', async (req, res) => {
  try {
    // MercadoPago sends payment ID in body or query
    const paymentId = req.body?.data?.id || req.query?.['data.id'] || req.query?.id;
    const type = req.body?.type || req.query?.type;

    // Only process payment notifications
    if (type !== 'payment' || !paymentId) {
      console.log(`[SaaS Webhook] Ignoring non-payment notification: ${type}`);
      return res.status(200).json({ received: true, action: 'ignored' });
    }

    const result = await saasService.handleSaasWebhook(String(paymentId));

    res.status(200).json({
      received: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[SaaS Webhook] Error:', error);
    // Always return 200 to MercadoPago to prevent retries
    res.status(200).json({ received: true, error: 'Internal processing error' });
  }
});

// ===========================================
// MOTHERSHIP ENDPOINTS (Super Admin Only)
// ===========================================

/**
 * GET /api/saas/sales
 * Get all SaaS sales for Mothership dashboard
 */
router.get('/sales', mothershipLimiter, authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const result = await saasService.getSales(page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/saas/stats
 * Get SaaS sales statistics for Mothership dashboard
 */
router.get('/stats', mothershipLimiter, authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const stats = await saasService.getStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
