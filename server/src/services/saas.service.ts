import { db } from '../db/drizzle.js';
import { saasSales, stores, licenses } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { LicenseGenerator } from '../utils/license-generator.js';
import { logger } from './logger.service.js';
import { sendActivationLicense, sendNewSaasSaleNotification, sendStoreCreated } from './email.service.js';
import { env } from '../env.js';

// Plan pricing configuration (in cents)
const PLAN_PRICING: Record<string, { amount: number; duration: string }> = {
  free: { amount: 0, duration: 'lifetime' },
  starter: { amount: 1900, duration: '1month' },  // $19/month
  pro: { amount: 4900, duration: '1month' },       // $49/month
  enterprise: { amount: 9900, duration: '1month' }, // $99/month
};

export class SaasService {
  /**
   * Creates a MercadoPago checkout preference for SaaS purchase
   * Returns the init_point URL for redirecting the buyer
   */
  async createSaasCheckout(data: {
    plan: string;
    buyerEmail: string;
    buyerName?: string;
    storeName?: string;
  }): Promise<{ initPoint: string; externalReference: string }> {
    const { plan, buyerEmail, buyerName, storeName } = data;

    // Validate plan
    const planConfig = PLAN_PRICING[plan];
    if (!planConfig) {
      throw new Error(`Invalid plan: ${plan}`);
    }

    // Generate unique reference for tracking
    const saleId = uuidv4();
    const externalReference = `saas_${saleId}`;

    // Create sale record (pending state)
    await db.insert(saasSales).values({
      id: saleId,
      externalReference,
      plan,
      amount: planConfig.amount,
      currency: 'ARS',
      buyerEmail,
      buyerName: buyerName || null,
      storeName: storeName || null,
      status: 'pending',
    });

    // For FREE plan, skip payment and provision immediately
    if (planConfig.amount === 0) {
      logger.info(`[SaaS] Free plan - skipping payment, provisioning directly`);
      await this.provisionStore(externalReference);
      
      return {
        initPoint: `${env.STORE_URL}/setup?ref=${externalReference}`, // Redirect to setup
        externalReference,
      };
    }

    // Create MercadoPago preference
    const MercadoPago = await import('mercadopago');
    const client = new MercadoPago.MercadoPagoConfig({ accessToken: env.MP_ACCESS_TOKEN || '' });
    const preference = new MercadoPago.Preference(client);

    const planNames: Record<string, string> = {
      starter: 'LimeStore Starter',
      pro: 'LimeStore Pro',
      enterprise: 'LimeStore Enterprise',
    };

    const preferenceData = await preference.create({
      body: {
        items: [{
          id: `saas-${plan}`,
          title: planNames[plan] || `LimeStore ${plan}`,
          description: `Suscripción mensual - ${planNames[plan]}`,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: planConfig.amount / 100, // Convert cents to currency
        }],
        payer: {
          email: buyerEmail,
          name: buyerName || undefined,
        },
        external_reference: externalReference,
        back_urls: {
          success: `${env.STORE_URL}/purchase/success?ref=${externalReference}`,
          failure: `${env.STORE_URL}/purchase/failed?ref=${externalReference}`,
          pending: `${env.STORE_URL}/purchase/pending?ref=${externalReference}`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.BACKEND_URL || env.STORE_URL.replace(':3000', ':3001')}/api/payments/webhook/saas`,
      }
    });

    logger.info(`[SaaS] Created checkout preference for ${plan}: ref=${externalReference}, id=${preferenceData.id}`);

    return {
      initPoint: preferenceData.init_point || '',
      externalReference,
    };
  }

  /**
   * Handles webhook from MercadoPago for SaaS payments
   * Called when payment status changes
   */
  async handleSaasWebhook(paymentId: string): Promise<{ success: boolean; action: string }> {
    // Fetch payment details from MercadoPago
    const MercadoPago = await import('mercadopago');
    const client = new MercadoPago.MercadoPagoConfig({ accessToken: env.MP_ACCESS_TOKEN || '' });
    const payment = new MercadoPago.Payment(client);

    const paymentData = await payment.get({ id: paymentId });
    
    if (!paymentData || !paymentData.external_reference) {
      logger.error(`[SaaS Webhook] No external_reference in payment ${paymentId}`);
      return { success: false, action: 'no_reference' };
    }

    const externalReference = paymentData.external_reference as string;
    
    // Verify it's a SaaS payment
    if (!externalReference.startsWith('saas_')) {
      return { success: false, action: 'not_saas_payment' };
    }

    // Find the sale record
    const [sale] = await db.select()
      .from(saasSales)
      .where(eq(saasSales.externalReference, externalReference))
      .limit(1);

    if (!sale) {
      logger.error(`[SaaS Webhook] Sale not found: ${externalReference}`);
      return { success: false, action: 'sale_not_found' };
    }

    // Update payment info
    await db.update(saasSales)
      .set({
        paymentId: String(paymentId),
      })
      .where(eq(saasSales.id, sale.id));

    // Handle based on payment status
    const status = paymentData.status;
    
    if (status === 'approved') {
      // Payment successful - provision the store
      await db.update(saasSales)
        .set({ status: 'paid', paidAt: new Date() })
        .where(eq(saasSales.id, sale.id));

      await this.provisionStore(externalReference);
      
      return { success: true, action: 'provisioned' };
    } else if (status === 'rejected' || status === 'cancelled') {
      await db.update(saasSales)
        .set({ status: 'failed', errorMessage: `Payment ${status}` })
        .where(eq(saasSales.id, sale.id));
      
      return { success: true, action: 'payment_failed' };
    }

    // Pending or other status
    return { success: true, action: 'pending' };
  }

  /**
   * Provisions a new store after successful payment
   * Creates store, generates license, sends emails
   */
  async provisionStore(externalReference: string): Promise<void> {
    // Find the sale
    const [sale] = await db.select()
      .from(saasSales)
      .where(eq(saasSales.externalReference, externalReference))
      .limit(1);

    if (!sale) {
      throw new Error(`Sale not found: ${externalReference}`);
    }

    if (sale.status === 'provisioned') {
      logger.warn(`[SaaS] Store already provisioned for ${externalReference}`);
      return;
    }

    const storeId = uuidv4();
    const storeName = sale.storeName || `Store-${storeId.slice(0, 8)}`;
    const domain = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Generate license and hash it
    const licenseSerial = LicenseGenerator.generate();
    const licenseHash = await LicenseGenerator.hashLicenseKey(licenseSerial);
    const planLimits = LicenseGenerator.getPlanLimits(sale.plan);
    const expiresAt = LicenseGenerator.getExpirationDate(PLAN_PRICING[sale.plan]?.duration || '1month');

    await db.transaction(async (tx) => {
      // 1. Create Store
      await tx.insert(stores).values({
        id: storeId,
        name: storeName,
        domain,
        status: 'pending', // Will be 'active' after setup wizard
        plan: sale.plan,
        licenseKey: licenseSerial, // Store the actual key (encrypted in DB if needed)
        ownerEmail: sale.buyerEmail,
        ownerName: sale.buyerName,
      });

      // 2. Create License
      await tx.insert(licenses).values({
        serial: licenseSerial,
        plan: sale.plan,
        status: 'generated', // Will be 'activated' after setup
        storeId,
        expiresAt,
        maxProducts: planLimits.maxProducts,
        maxOrders: planLimits.maxOrders,
        ownerEmail: sale.buyerEmail,
        ownerName: sale.buyerName,
      });

      // 3. Update Sale with provisioning info
      await tx.update(saasSales)
        .set({
          status: 'provisioned',
          storeId,
          licenseKeyHash: licenseHash, // Only hash stored, real key sent via email
          provisionedAt: new Date(),
        })
        .where(eq(saasSales.id, sale.id));
    });

    logger.info(`[SaaS] Store provisioned: ${storeName} (${storeId})`);

    // 4. Send emails
    const setupUrl = `${env.STORE_URL}/${domain}/#/setup?license=${licenseSerial}`;
    
    try {
      // Email to buyer with license
      await sendActivationLicense(sale.buyerEmail, licenseSerial, sale.plan);
      await sendStoreCreated(sale.buyerEmail, storeName, setupUrl);
      
      // Email to super admin about new sale
      const adminEmail = env.ADMIN_EMAIL || 'admin@limestore.com';
      await sendNewSaasSaleNotification(adminEmail, {
        plan: sale.plan,
        amount: sale.amount,
        buyerEmail: sale.buyerEmail,
        storeName,
      });
      
      logger.info(`[SaaS] Emails sent for ${sale.buyerEmail}`);
    } catch (emailError) {
      logger.error(`[SaaS] Failed to send provisioning emails:`, { error: emailError as Error });
      // Don't fail the provisioning if email fails
    }
  }

  /**
   * Get all SaaS sales for Mothership dashboard
   */
  async getSales(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const sales = await db.select()
      .from(saasSales)
      .orderBy(saasSales.createdAt)
      .limit(limit)
      .offset(offset);

    return { sales };
  }

  /**
   * Get SaaS sales statistics
   */
  async getStats() {
    const allSales = await db.select().from(saasSales);
    
    const stats = {
      total: allSales.length,
      pending: allSales.filter(s => s.status === 'pending').length,
      paid: allSales.filter(s => s.status === 'paid').length,
      provisioned: allSales.filter(s => s.status === 'provisioned').length,
      failed: allSales.filter(s => s.status === 'failed').length,
      totalRevenue: allSales
        .filter(s => s.status === 'paid' || s.status === 'provisioned')
        .reduce((sum, s) => sum + (s.amount || 0), 0),
    };

    return stats;
  }
}

export const saasService = new SaasService();
