import React from 'react';
import { Truck, Lock } from 'lucide-react';
import { useStoreConfig } from '../../context/StoreContext';
import { CouponInput } from '../../context/CouponContext';

interface CartItem {
  id: string | number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

interface ShippingQuote {
  carrier: string;
  carrierName: string;
  service: string;
  price: number;
  estimatedDays: { min: number; max: number };
  isFree: boolean;
}

interface CheckoutOrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  transferDiscount: number;
  discountAmount: number;
  total: number;
  selectedShipping: ShippingQuote | null;
}

export const CheckoutOrderSummary: React.FC<CheckoutOrderSummaryProps> = ({
  items,
  subtotal,
  shippingCost,
  transferDiscount,
  discountAmount,
  total,
  selectedShipping,
}) => {
  const { config } = useStoreConfig();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm sticky top-4">
      <h2 className="text-lg font-bold mb-4">Resumen del Pedido</h2>
      
      {/* Items */}
      <div className="space-y-4 mb-6">
        {items.map((item, index) => (
          <div key={index} className="flex gap-4">
            <img 
              src={item.image} 
              alt={item.name} 
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex-1">
              <p className="font-medium text-sm">{item.name}</p>
              <p className="text-xs text-gray-500">
                Talle: {item.size} {item.color && `| Color: ${item.color}`}
              </p>
              <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
            </div>
            <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 mb-6">
        <CouponInput cartTotal={subtotal} />
      </div>

      {/* Totals */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        
        {transferDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Descuento transferencia (15%)</span>
            <span>-{formatPrice(transferDiscount)}</span>
          </div>
        )}

        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Descuento cupón</span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-1">
            <Truck size={14} /> Envío
          </span>
          <span className={selectedShipping?.isFree ? 'text-green-600' : ''}>
            {selectedShipping 
              ? (selectedShipping.isFree ? 'GRATIS' : formatPrice(shippingCost))
              : 'Ingresá tu CP'
            }
          </span>
        </div>

        <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      {/* Free shipping notice */}
      {subtotal < config.freeShippingFrom && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <p className="text-yellow-800">
            ¡Te faltan <strong>{formatPrice(config.freeShippingFrom - subtotal)}</strong> para envío gratis!
          </p>
        </div>
      )}

      {/* Trust Badges */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex items-center justify-center gap-2 text-green-600 mb-3">
          <Lock size={18} />
          <span className="text-sm font-semibold">Compra 100% Segura</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-500">
          <div className="flex flex-col items-center gap-1 p-2 bg-gray-50 rounded">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
            <span>SSL Encriptado</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 bg-gray-50 rounded">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <path d="M1 10h22"/>
            </svg>
            <span>Pago Seguro</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 bg-gray-50 rounded">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>Garantía</span>
          </div>
        </div>
      </div>
    </div>
  );
};
