import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { IconButton } from '../atoms/Icon';

export interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  const buttonSize = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
  const inputSize = size === 'sm' ? 'w-10 h-7 text-xs' : 'w-12 h-9 text-sm';

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className={`${buttonSize} flex items-center justify-center rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
      >
        <Minus size={size === 'sm' ? 14 : 16} />
      </button>
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        disabled={disabled}
        className={`${inputSize} text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-accent disabled:bg-gray-100`}
      />
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className={`${buttonSize} flex items-center justify-center rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
      >
        <Plus size={size === 'sm' ? 14 : 16} />
      </button>
    </div>
  );
};

export default QuantitySelector;
