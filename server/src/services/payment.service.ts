import { db } from '../db/drizzle.js';
import { orders, storeConfig } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { MercadoPagoProvider } from './payments/providers/mercadopago.provider.js';
import { PaymentProvider, WebhookVerificationParams } from './payments/payment.gateway.js';
import { logger } from './logger.service.js';

export interface WebhookHeaders {
  'x-signature'?: string;
  'x-request-id'?: string;
}

export interface WebhookResult {
  success: boolean;
  action?: 'ignored' | 'updated' | 'verification_failed' | 'payment_not_found';
  orderId?: string;
  paymentStatus?: string;
  error?: string;
}

export class PaymentService {
  private providers: Record<string, PaymentProvider>;

  constructor() {
    // Initialize available providers
    this.providers = {
      'mercadopago': new MercadoPagoProvider()
    };
  }

  private getProvider(name: string): PaymentProvider {
    const provider = this.providers[name];
    if (!provider) {
      throw new Error(`Payment provider '${name}' not supported`);
    }
    return provider;
  }

  /**
   * Initiates the checkout process by creating a preference/link with the provider.
   */
  async createCheckoutLink(orderId: string, storeId: string, providerName: string = 'mercadopago') {
    // 1. Fetch Order
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.storeId, storeId))
    });

    if (!order) throw new Error('Order not found');

    // 2. Fetch Store Config (for credentials)
    const configRow = await db.query.storeConfig.findFirst({
      where: and(eq(storeConfig.storeId, storeId), eq(storeConfig.key, 'mercadopago_config'))
    });

    if (!configRow) {
      throw new Error('Payment provider not configured for this store');
    }

    // 3. Get Provider and Create Preference
    const provider = this.getProvider(providerName);
    const preference = await provider.createPreference(order, configRow);

    // 4. Update Order with Payment Init Metadata
    await db.update(orders)
      .set({
        paymentProvider: providerName,
        paymentStatus: 'pending',
        paymentMeta: { preferenceId: preference.id, initPoint: preference.initPoint }
      })
      .where(eq(orders.id, orderId));

    return preference;
  }

  /**
   * Handles incoming webhooks from payment providers
   * Implements verification + double-check pattern for security
   */
  async handleWebhook(
    providerName: string, 
    storeId: string,
    query: Record<string, any>, 
    body: any,
    headers: WebhookHeaders
  ): Promise<WebhookResult> {
    logger.info(`[Webhook] Received from ${providerName} for store ${storeId}`, { data: { type: body?.type || query?.type } });

    const provider = this.getProvider(providerName);

    // 1. Fetch Store Config
    const configRow = await db.query.storeConfig.findFirst({
      where: and(eq(storeConfig.storeId, storeId), eq(storeConfig.key, 'mercadopago_config'))
    });

    if (!configRow) {
      logger.error(`[Webhook] No config found for store ${storeId}`);
      return { success: false, action: 'verification_failed', error: 'Store config not found' };
    }

    // 2. Extract data based on provider webhook format
    // MercadoPago sends: type, data.id in body or query
    const notificationType = body?.type || query?.type;
    const dataId = body?.data?.id || query?.['data.id'] || query?.id;

    // Only process payment notifications
    if (notificationType !== 'payment') {
      console.log(`[Webhook] Ignoring non-payment notification: ${notificationType}`);
      return { success: true, action: 'ignored' };
    }

    if (!dataId) {
      logger.error('[Webhook] No data.id in webhook');
      return { success: false, action: 'verification_failed', error: 'Missing data.id' };
    }

    // 3. Verify Webhook Signature (HMAC verification)
    const verificationParams: WebhookVerificationParams = {
      config: configRow,
      xSignature: headers['x-signature'],
      xRequestId: headers['x-request-id'],
      dataId: String(dataId),
    };

    const isValid = provider.verifyWebhookSignature(verificationParams);
    
    if (!isValid) {
      console.error(`[Webhook] Signature verification failed for payment ${dataId}`);
      return { success: false, action: 'verification_failed', error: 'Invalid signature' };
    }

    console.log(`[Webhook] Signature verified for payment ${dataId}`);

    // 4. Double-Check: Fetch payment status directly from provider API
    let paymentStatus;
    try {
      paymentStatus = await provider.getPaymentStatus(String(dataId), configRow);
    } catch (error) {
      console.error(`[Webhook] Failed to fetch payment status from provider:`, error);
      return { success: false, action: 'verification_failed', error: 'Failed to verify payment with provider' };
    }

    logger.info(`[Webhook] Payment ${dataId} status from provider: ${paymentStatus.status}`);

    // 5. Find Order by external_reference (which we set to order.id)
    const orderId = paymentStatus.externalReference;
    
    if (!orderId) {
      console.error(`[Webhook] No external_reference in payment ${dataId}`);
      return { success: false, action: 'payment_not_found', error: 'No order reference in payment' };
    }

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.storeId, storeId))
    });

    if (!order) {
      console.error(`[Webhook] Order ${orderId} not found for store ${storeId}`);
      return { success: false, action: 'payment_not_found', error: 'Order not found' };
    }

    // 6. Update Order Status based on payment status
    const statusMap: Record<string, string> = {
      'approved': 'paid',
      'pending': 'pending_payment',
      'in_process': 'pending_payment',
      'rejected': 'payment_failed',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
      'charged_back': 'disputed',
      'authorized': 'pending_capture',
      'in_mediation': 'disputed',
    };

    const newOrderStatus = statusMap[paymentStatus.status] || 'pending';

    await db.update(orders)
      .set({
        status: newOrderStatus,
        paymentStatus: paymentStatus.status,
        paymentMeta: {
          ...(order.paymentMeta as any || {}),
          lastWebhookAt: new Date().toISOString(),
          providerPaymentId: paymentStatus.id,
          providerStatusDetail: paymentStatus.statusDetail,
          transactionAmount: paymentStatus.transactionAmount,
        },
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    console.log(`[Webhook] Order ${orderId} updated to status: ${newOrderStatus}`);

    return {
      success: true,
      action: 'updated',
      orderId,
      paymentStatus: paymentStatus.status,
    };
  }

  /**
   * Creates a subscription for SaaS billing
   */
  async createSubscription(planId: string, email: string, storeId: string, providerName: string = 'mercadopago') {
    // Define plans with pricing details
    const plans: Record<string, { amount: number; frequency: number }> = {
      'starter': { amount: 1900, frequency: 1 }, // $19/month in cents
      'pro': { amount: 4900, frequency: 1 },     // $49/month in cents
      'enterprise': { amount: 9900, frequency: 1 }, // Custom, using $99 as placeholder
    };

    const planDetails = plans[planId];
    if (!planDetails) {
      throw new Error(`Invalid plan: ${planId}`);
    }

    // Fetch Store Config (for credentials)
    const configRow = await db.query.storeConfig.findFirst({
      where: and(eq(storeConfig.storeId, storeId), eq(storeConfig.key, 'mercadopago_config'))
    });

    if (!configRow) {
      throw new Error('Payment provider not configured for this store');
    }

    const provider = this.getProvider(providerName);
    const subscription = await provider.createSubscription({
      planId,
      email,
      storeId,
      amount: planDetails.amount,
      frequency: planDetails.frequency,
      currencyId: 'ARS',
    }, configRow);

    return subscription;
  }

  /**
   * Gets payment status by payment ID from provider
   */
  async getPaymentStatus(paymentId: string, storeId: string, providerName: string = 'mercadopago') {
    // Fetch Store Config (for credentials)
    const configRow = await db.query.storeConfig.findFirst({
      where: and(eq(storeConfig.storeId, storeId), eq(storeConfig.key, 'mercadopago_config'))
    });

    if (!configRow) {
      throw new Error('Payment provider not configured for this store');
    }

    const provider = this.getProvider(providerName);
    const status = await provider.getPaymentStatus(paymentId, configRow);

    return status;
  }
}

