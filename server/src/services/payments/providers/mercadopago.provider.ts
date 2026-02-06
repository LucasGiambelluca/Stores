import crypto from 'crypto';
import { PaymentProvider, PaymentPreference, WebhookVerificationParams, PaymentStatus, SubscriptionPreference, SubscriptionDetails } from '../payment.gateway.js';
import { Order, StoreConfigRow } from '../../../db/schema.js';
import { decrypt } from '../../../utils/crypto.utils.js';
import { MercadoPagoConfig, Preference, Payment, PreApproval } from 'mercadopago';

export class MercadoPagoProvider implements PaymentProvider {
  
  getProviderName(): string {
    return 'mercadopago';
  }

  async createPreference(order: Order, config: StoreConfigRow): Promise<PaymentPreference> {
    const accessTokenEncrypted = (config.value as any).mercadopagoAccessToken;
    
    if (!accessTokenEncrypted) {
      throw new Error('MercadoPago Access Token not configured for this store');
    }

    // Decrypt credentials only for this scope
    const accessToken = decrypt(accessTokenEncrypted);
    
    // Initialize MP Client
    const client = new MercadoPagoConfig({ accessToken: accessToken });
    const preference = new Preference(client);

    // Build notification URL with storeId for webhook routing
    const webhookUrl = process.env.WEBHOOK_BASE_URL 
      ? `${process.env.WEBHOOK_BASE_URL}/api/payments/webhook/mercadopago?storeId=${order.storeId}`
      : undefined;

    // Create preference
    const result = await preference.create({
      body: {
        items: [
          {
            id: 'ORDER-' + order.id,
            title: `Orden #${order.orderNumber}`,
            quantity: 1,
            unit_price: order.total / 100, // Convert cents to standard currency unit
            currency_id: 'ARS',
          }
        ],
        back_urls: {
          success: `https://${(config.value as any).domain || 'tiendita.com'}/checkout/success`,
          failure: `https://${(config.value as any).domain || 'tiendita.com'}/checkout/failure`,
          pending: `https://${(config.value as any).domain || 'tiendita.com'}/checkout/pending`,
        },
        auto_return: 'approved',
        external_reference: order.id,
        notification_url: webhookUrl,
      }
    });

    if (!result.id || !result.init_point) {
      throw new Error('Failed to create MercadoPago preference');
    }

    return {
      id: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point
    };
  }

  /**
   * Create a subscription using MercadoPago PreApproval (Recurring Payments)
   * @see https://www.mercadopago.com/developers/en/reference/subscriptions/_preapproval/post
   */
  async createSubscription(details: SubscriptionDetails, config: StoreConfigRow): Promise<SubscriptionPreference> {
    const accessTokenEncrypted = (config.value as any).mercadopagoAccessToken;
    
    if (!accessTokenEncrypted) {
      throw new Error('MercadoPago Access Token not configured for this store');
    }

    const accessToken = decrypt(accessTokenEncrypted);
    const client = new MercadoPagoConfig({ accessToken });
    const preApproval = new PreApproval(client);

    // Calculate start and end dates
    const autoRecurringStartDate = new Date();
    autoRecurringStartDate.setDate(autoRecurringStartDate.getDate() + 1); // Start tomorrow

    const result = await preApproval.create({
      body: {
        reason: `Suscripción Plan ${details.planId}`,
        external_reference: `${details.storeId}-${details.planId}`,
        payer_email: details.email,
        auto_recurring: {
          frequency: details.frequency,
          frequency_type: 'months',
          transaction_amount: details.amount / 100, // Convert cents
          currency_id: details.currencyId,
          start_date: autoRecurringStartDate.toISOString(),
        },
        back_url: `https://${(config.value as any).domain || 'tiendita.com'}/subscription/success`,
        status: 'pending',
      }
    });

    if (!result.id) {
      throw new Error('Failed to create MercadoPago subscription');
    }

    return {
      id: result.id,
      initPoint: result.init_point,
      preapprovalPlanId: result.id,
      status: result.status,
    };
  }

  /**
   * Verify MercadoPago webhook signature using HMAC-SHA256
   * @see https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
   */
  verifyWebhookSignature(params: WebhookVerificationParams): boolean {
    const { xSignature, xRequestId, dataId, config } = params;
    const webhookSecretEncrypted = (config.value as any).mercadopagoWebhookSecret;
    
    // SECURITY: Fail closed - if no secret configured, reject webhook
    if (!webhookSecretEncrypted) {
      console.warn('[MercadoPago] Webhook secret not configured - rejecting webhook');
      return false;
    }

    // Validate required headers
    if (!xSignature || !xRequestId || !dataId) {
      console.error('[MercadoPago] Missing required webhook headers or data');
      return false;
    }

    try {
      const secret = decrypt(webhookSecretEncrypted);
      
      // Parse x-signature header format: ts=TIMESTAMP,v1=HASH
      const signatureParts: Record<string, string> = {};
      xSignature.split(',').forEach(part => {
        const [key, value] = part.trim().split('=');
        if (key && value) {
          signatureParts[key] = value;
        }
      });

      const timestamp = signatureParts['ts'];
      const receivedHash = signatureParts['v1'];

      if (!timestamp || !receivedHash) {
        console.error('[MercadoPago] Invalid signature format');
        return false;
      }

      // Build the manifest string for HMAC
      // Format: id:{data.id};request-id:{x-request-id};ts:{ts};
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${timestamp};`;
      
      // Calculate expected HMAC
      const expectedHash = crypto
        .createHmac('sha256', secret)
        .update(manifest)
        .digest('hex');

      // Use timing-safe comparison to prevent timing attacks
      const receivedBuffer = Buffer.from(receivedHash, 'hex');
      const expectedBuffer = Buffer.from(expectedHash, 'hex');

      if (receivedBuffer.length !== expectedBuffer.length) {
        console.error('[MercadoPago] Hash length mismatch');
        return false;
      }

      const isValid = crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
      
      if (!isValid) {
        console.error('[MercadoPago] Signature verification failed');
      }

      return isValid;
    } catch (error) {
      console.error('[MercadoPago] Error verifying signature:', error);
      return false;
    }
  }

  /**
   * Fetch payment status from MercadoPago API (Double-check pattern)
   * This provides an additional layer of security by verifying the payment
   * directly with MercadoPago's servers
   */
  async getPaymentStatus(paymentId: string, config: StoreConfigRow): Promise<PaymentStatus> {
    const accessTokenEncrypted = (config.value as any).mercadopagoAccessToken;
    
    if (!accessTokenEncrypted) {
      throw new Error('MercadoPago Access Token not configured');
    }

    const accessToken = decrypt(accessTokenEncrypted);
    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    const result = await payment.get({ id: paymentId });

    if (!result.id || !result.status) {
      throw new Error('Invalid payment response from MercadoPago');
    }

    return {
      id: String(result.id),
      status: result.status as PaymentStatus['status'],
      statusDetail: result.status_detail || '',
      externalReference: result.external_reference || '',
      transactionAmount: result.transaction_amount || 0,
      currencyId: result.currency_id || 'ARS',
    };
  }
}

