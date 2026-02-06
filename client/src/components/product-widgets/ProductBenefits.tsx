/**
 * ProductBenefits Widget
 * 
 * Displays shipping, payment, and return policy benefits.
 * Extracted from ProductDetail.tsx for use with the Product Page Builder.
 * 
 * @plan free - Available to all plans
 */

import React from 'react';
import { Truck, CreditCard, RefreshCcw, Shield, Clock, Gift } from 'lucide-react';
import { STORE_INFO } from '../../constants';

interface Benefit {
  icon: 'truck' | 'card' | 'return' | 'shield' | 'clock' | 'gift';
  title: string;
  subtitle: string;
}

interface ProductBenefitsProps {
  benefits?: Benefit[];
  layout?: 'grid' | 'row' | 'stack';
  columns?: 2 | 3 | 4;
}

const defaultBenefits: Benefit[] = [
  { icon: 'truck', title: 'Envío Gratis', subtitle: `+$${(STORE_INFO.freeShippingFrom/1000).toFixed(0)}k` },
  { icon: 'card', title: `${STORE_INFO.installments} Cuotas`, subtitle: 'Sin interés' },
  { icon: 'return', title: 'Devolución', subtitle: `${STORE_INFO.returnDays} días` },
];

const iconMap = {
  truck: Truck,
  card: CreditCard,
  return: RefreshCcw,
  shield: Shield,
  clock: Clock,
  gift: Gift,
};

export const ProductBenefits: React.FC<ProductBenefitsProps> = ({
  benefits = defaultBenefits,
  layout = 'grid',
  columns = 3,
}) => {
  const getLayoutClass = () => {
    if (layout === 'row') return 'flex flex-wrap justify-center gap-8';
    if (layout === 'stack') return 'flex flex-col gap-4';
    return `grid gap-4 grid-cols-${columns}`;
  };

  return (
    <div className={`product-benefits-widget py-6 border-t border-b border-gray-200 ${getLayoutClass()}`}>
      {benefits.map((benefit, index) => {
        const Icon = iconMap[benefit.icon];
        return (
          <div key={index} className="text-center">
            <Icon size={24} className="mx-auto mb-2 text-gray-600" />
            <p className="text-xs font-medium">{benefit.title}</p>
            <p className="text-xs text-gray-500">{benefit.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
};

export default ProductBenefits;
