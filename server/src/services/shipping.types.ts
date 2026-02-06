export type ShippingProvider = 'enviopack' | 'andreani' | 'correo_argentino' | 'mock';

export interface ShipmentInfo {
  id: string;
  orderId: string;
  orderNumber?: string;
  carrier: ShippingProvider;
  trackingNumber?: string;
  labelUrl?: string;
  status: string;
  estimatedDelivery?: string;
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
}
