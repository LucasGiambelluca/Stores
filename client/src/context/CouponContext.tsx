import React, { createContext, useContext, useState, ReactNode } from 'react';
import { getStoreId } from '../utils/storeDetection';

interface Coupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number; // percentage (10 = 10%) or fixed amount in pesos
  minPurchase?: number;
  maxDiscount?: number;
  expiresAt?: Date;
  usageLimit?: number;
  usedCount?: number;
  description: string;
  active?: boolean;
  // New fields
  isStackable?: boolean; // Can be combined with other coupons (default: false)
  allowedPaymentMethods?: string[]; // ['mercadopago', 'transfer', 'cash'] - if empty, all allowed
}

// Pre-defined coupons (in production, these would come from an API)
const AVAILABLE_COUPONS: Coupon[] = [
  {
    code: 'BIENVENIDO10',
    type: 'percentage',
    value: 10,
    minPurchase: 10000,
    description: '10% OFF en tu primera compra (mín. $10.000)',
    isStackable: false,
    allowedPaymentMethods: ['mercadopago', 'transfer'], // No cash
  },
  {
    code: 'ENVIOGRATIS',
    type: 'fixed',
    value: 5000,
    minPurchase: 30000,
    description: 'Envío bonificado (mín. $30.000)',
    isStackable: true, // This one can stack
    allowedPaymentMethods: [], // All payment methods
  },
  {
    code: 'VERANO20',
    type: 'percentage',
    value: 20,
    minPurchase: 25000,
    maxDiscount: 15000,
    description: '20% OFF (máx. $15.000, mín. compra $25.000)',
    isStackable: false,
    allowedPaymentMethods: ['mercadopago', 'transfer'],
  },
  {
    code: 'PROMO500',
    type: 'fixed',
    value: 5000,
    minPurchase: 20000,
    description: '$5.000 OFF en compras mayores a $20.000',
    isStackable: false,
    allowedPaymentMethods: [], // All methods allowed
  },
];

interface CouponContextType {
  coupons: Coupon[];
  addCoupon: (coupon: Coupon) => void;
  updateCoupon: (code: string, updates: Partial<Coupon>) => void;
  deleteCoupon: (code: string) => void;
  appliedCoupon: Coupon | null;
  discountAmount: number;
  applyCoupon: (code: string, cartTotal: number, paymentMethod?: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  calculateDiscount: (cartTotal: number) => number;
  validatePaymentMethod: (paymentMethod: string) => { valid: boolean; message?: string };
}

const CouponContext = createContext<CouponContextType | undefined>(undefined);

// Use store ID in key for isolation
const getCouponsKey = () => {
  const storeId = getStoreId() || 'default';
  return `coupons_${storeId}`;
};

export const CouponProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const stored = sessionStorage.getItem(getCouponsKey());
    return stored ? JSON.parse(stored) : AVAILABLE_COUPONS;
  });
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Save to sessionStorage whenever coupons change
  React.useEffect(() => {
    sessionStorage.setItem(getCouponsKey(), JSON.stringify(coupons));
  }, [coupons]);

  const addCoupon = (coupon: Coupon) => {
    // Ensure new coupons have defaults
    setCoupons(prev => [...prev, { 
      ...coupon, 
      isStackable: coupon.isStackable ?? false,
      allowedPaymentMethods: coupon.allowedPaymentMethods ?? []
    }]);
  };

  const updateCoupon = (code: string, updates: Partial<Coupon>) => {
    setCoupons(prev => prev.map(c => c.code === code ? { ...c, ...updates } : c));
  };

  const deleteCoupon = (code: string) => {
    setCoupons(prev => prev.filter(c => c.code !== code));
  };

  const applyCoupon = (code: string, cartTotal: number, paymentMethod?: string): { success: boolean; message: string } => {
    const normalizedCode = code.trim().toUpperCase();
    const coupon = coupons.find(c => c.code === normalizedCode);

    if (!coupon) {
      return { success: false, message: 'Cupón no válido' };
    }

    if (!coupon.active && coupon.active !== undefined) {
      return { success: false, message: 'Este cupón está inactivo' };
    }

    // Check if already have a coupon and this one is not stackable
    if (appliedCoupon && !coupon.isStackable) {
      return { success: false, message: 'Este cupón no es acumulable con otros descuentos' };
    }

    // Check if already have a non-stackable coupon
    if (appliedCoupon && !appliedCoupon.isStackable) {
      return { success: false, message: 'Ya tenés un cupón aplicado que no es acumulable' };
    }

    if (coupon.minPurchase && cartTotal < coupon.minPurchase) {
      return { 
        success: false, 
        message: `Compra mínima de $${coupon.minPurchase.toLocaleString()} requerida` 
      };
    }

    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      return { success: false, message: 'Este cupón ha expirado' };
    }

    if (coupon.usageLimit && coupon.usedCount && coupon.usedCount >= coupon.usageLimit) {
      return { success: false, message: 'Este cupón agotó sus usos' };
    }

    // Check payment method restrictions
    if (paymentMethod && coupon.allowedPaymentMethods && coupon.allowedPaymentMethods.length > 0) {
      if (!coupon.allowedPaymentMethods.includes(paymentMethod)) {
        const methodNames: Record<string, string> = {
          'mercadopago': 'MercadoPago',
          'transfer': 'Transferencia',
          'cash': 'Efectivo'
        };
        const allowedNames = coupon.allowedPaymentMethods.map(m => methodNames[m] || m).join(', ');
        return { 
          success: false, 
          message: `Este cupón solo es válido con: ${allowedNames}` 
        };
      }
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (cartTotal * coupon.value) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.value;
    }

    setAppliedCoupon(coupon);
    setDiscountAmount(discount);

    return { 
      success: true, 
      message: `¡Cupón aplicado! Ahorrás $${discount.toLocaleString()}` 
    };
  };

  // Validate if the current coupon is valid for a payment method
  const validatePaymentMethod = (paymentMethod: string): { valid: boolean; message?: string } => {
    if (!appliedCoupon) {
      return { valid: true };
    }

    // If no restrictions, always valid
    if (!appliedCoupon.allowedPaymentMethods || appliedCoupon.allowedPaymentMethods.length === 0) {
      return { valid: true };
    }

    // Check if payment method is allowed
    if (!appliedCoupon.allowedPaymentMethods.includes(paymentMethod)) {
      const methodNames: Record<string, string> = {
        'mercadopago': 'MercadoPago',
        'transfer': 'Transferencia',
        'cash': 'Efectivo'
      };
      const allowedNames = appliedCoupon.allowedPaymentMethods.map(m => methodNames[m] || m).join(', ');
      return { 
        valid: false, 
        message: `El cupón "${appliedCoupon.code}" no es válido con este método de pago. Solo válido con: ${allowedNames}` 
      };
    }

    return { valid: true };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const calculateDiscount = (cartTotal: number): number => {
    if (!appliedCoupon) return 0;

    if (appliedCoupon.type === 'percentage') {
      let discount = (cartTotal * appliedCoupon.value) / 100;
      if (appliedCoupon.maxDiscount) {
        discount = Math.min(discount, appliedCoupon.maxDiscount);
      }
      return discount;
    }
    return appliedCoupon.value;
  };

  return (
    <CouponContext.Provider value={{
      appliedCoupon,
      discountAmount,
      applyCoupon,
      removeCoupon,
      calculateDiscount,
      validatePaymentMethod,
      coupons,
      addCoupon,
      updateCoupon,
      deleteCoupon
    }}>
      {children}
    </CouponContext.Provider>
  );
};

export const useCoupon = (): CouponContextType => {
  const context = useContext(CouponContext);
  if (!context) {
    throw new Error('useCoupon must be used within a CouponProvider');
  }
  return context;
};

// Coupon input component
export const CouponInput: React.FC<{ cartTotal: number }> = ({ cartTotal }) => {
  const { appliedCoupon, discountAmount, applyCoupon, removeCoupon } = useCoupon();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleApply = () => {
    const result = applyCoupon(code, cartTotal);
    setMessage({
      type: result.success ? 'success' : 'error',
      text: result.message,
    });
    if (result.success) {
      setCode('');
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <h3 className="font-semibold text-gray-800 mb-3">¿Tenés un cupón?</h3>
      
      {appliedCoupon ? (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div>
            <p className="font-medium text-green-800">{appliedCoupon.code}</p>
            <p className="text-sm text-green-600">
              Descuento: -${discountAmount.toLocaleString()}
            </p>
          </div>
          <button
            onClick={removeCoupon}
            className="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            Quitar
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ingresá tu código"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
            />
            <button
              onClick={handleApply}
              disabled={!code.trim()}
              className="px-4 py-2 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              Aplicar
            </button>
          </div>
          
          {message && (
            <p className={`mt-2 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {message.text}
            </p>
          )}
        </>
      )}
    </div>
  );
};
