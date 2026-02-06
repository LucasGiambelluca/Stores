import React from 'react';
import { Price } from '../atoms/Typography';

export interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  size?: 'sm' | 'md' | 'lg';
  showDiscount?: boolean;
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  originalPrice,
  discountPercentage,
  size = 'md',
  showDiscount = true,
  className = '',
}) => {
  const hasDiscount = originalPrice && originalPrice > price;
  const calculatedDiscount = hasDiscount
    ? discountPercentage || Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <Price amount={price} originalAmount={originalPrice} size={size} />
      {hasDiscount && showDiscount && calculatedDiscount > 0 && (
        <span className="text-xs font-semibold text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
          -{calculatedDiscount}%
        </span>
      )}
    </div>
  );
};

export default PriceDisplay;
