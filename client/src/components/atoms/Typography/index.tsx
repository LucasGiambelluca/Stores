import React from 'react';

// Heading Component
export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface HeadingProps {
  level?: HeadingLevel;
  children: React.ReactNode;
  className?: string;
  as?: HeadingLevel;
}

const headingClasses: Record<HeadingLevel, string> = {
  h1: 'text-4xl md:text-5xl font-bold',
  h2: 'text-3xl md:text-4xl font-bold',
  h3: 'text-2xl md:text-3xl font-semibold',
  h4: 'text-xl md:text-2xl font-semibold',
  h5: 'text-lg md:text-xl font-medium',
  h6: 'text-base md:text-lg font-medium',
};

export const Heading: React.FC<HeadingProps> = ({
  level = 'h2',
  children,
  className = '',
  as,
}) => {
  const Tag = as || level;
  return (
    <Tag className={`${headingClasses[level]} text-primary ${className}`}>
      {children}
    </Tag>
  );
};

// Text Component
export type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl';
export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';

export interface TextProps {
  size?: TextSize;
  weight?: TextWeight;
  muted?: boolean;
  children: React.ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div';
}

const textSizeClasses: Record<TextSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

const textWeightClasses: Record<TextWeight, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export const Text: React.FC<TextProps> = ({
  size = 'base',
  weight = 'normal',
  muted = false,
  children,
  className = '',
  as = 'p',
}) => {
  const Tag = as;
  return (
    <Tag
      className={`
        ${textSizeClasses[size]}
        ${textWeightClasses[weight]}
        ${muted ? 'text-gray-500' : 'text-gray-800'}
        ${className}
      `}
    >
      {children}
    </Tag>
  );
};

// Price Component
export interface PriceProps {
  amount: number;
  originalAmount?: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const priceSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
};

export const Price: React.FC<PriceProps> = ({
  amount,
  originalAmount,
  currency = '$',
  size = 'md',
  className = '',
}) => {
  const formatPrice = (value: number) => {
    return value.toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const hasDiscount = originalAmount && originalAmount > amount;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className={`font-semibold ${priceSizeClasses[size]} ${
          hasDiscount ? 'text-accent' : 'text-primary'
        }`}
      >
        {currency}{formatPrice(amount)}
      </span>
      {hasDiscount && (
        <span className="text-gray-400 line-through text-sm">
          {currency}{formatPrice(originalAmount)}
        </span>
      )}
    </div>
  );
};

export default { Heading, Text, Price };
