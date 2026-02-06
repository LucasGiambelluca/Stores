import { Order, StoreConfigRow } from '../../db/schema.js';

export interface PaymentPreference {
  id: string;      // The preference ID from the provider (e.g., MP preference id)
  initPoint: string; // The URL to redirect the user to
  sandboxInitPoint?: string; // Sandbox URL
}

/**
 * Parameters for webhook signature verification
 * Different providers may use different parameters
 */
export interface WebhookVerificationParams {
  // Provider-agnostic params
  config: StoreConfigRow;
  
  // MercadoPago specific
  xSignature?: string;
  xRequestId?: string;
  dataId?: string;
  
  // Generic params for future providers
  signature?: string;
  body?: any;
  rawBody?: Buffer;
  timestamp?: string;
}

/**
 * Payment status response from provider
 */
export interface PaymentStatus {
  id: string;
  status: 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back';
  statusDetail: string;
  externalReference: string;
  transactionAmount: number;
  currencyId: string;
}

/**
 * Subscription preference response from provider
 */
export interface SubscriptionPreference {
  id: string;
  initPoint?: string;
  preapprovalPlanId?: string;
  status?: string;
}

/**
 * Subscription details for creating a recurring payment
 */
export interface SubscriptionDetails {
  planId: string;
  email: string;
  storeId: string;
  amount: number; // Monthly amount in cents
  frequency: number; // Billing frequency (e.g., 1 for monthly)
  currencyId: string;
}

export interface PaymentProvider {
  /**
   * Creates a payment preference/link for the checkout flow.
   * @param order The order details
   * @param config The store configuration containing encrypted credentials
   */
  createPreference(order: Order, config: StoreConfigRow): Promise<PaymentPreference>;

  /**
   * Creates a recurring subscription/preapproval for SaaS billing.
   * @param details Subscription details (plan, email, amount, etc.)
   * @param config The store configuration containing encrypted credentials
   */
  createSubscription(details: SubscriptionDetails, config: StoreConfigRow): Promise<SubscriptionPreference>;

  /**
   * Verifies the signature of a webhook to ensure it comes from the provider.
   * Each provider may use different verification methods.
   */
  verifyWebhookSignature(params: WebhookVerificationParams): boolean;

  /**
   * Gets the generic name of the provider.
   */
  getProviderName(): string;

  /**
   * Fetches payment status directly from the provider API (double-check pattern)
   * @param paymentId The payment ID from the provider
   * @param config The store configuration
   */
  getPaymentStatus(paymentId: string, config: StoreConfigRow): Promise<PaymentStatus>;
}

