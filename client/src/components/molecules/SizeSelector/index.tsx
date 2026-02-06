import React from 'react';

export interface SizeSelectorProps {
  sizes: string[];
  selectedSize: string | null;
  onSelect: (size: string) => void;
  disabled?: boolean;
  outOfStock?: string[];
  className?: string;
}

export const SizeSelector: React.FC<SizeSelectorProps> = ({
  sizes,
  selectedSize,
  onSelect,
  disabled = false,
  outOfStock = [],
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {sizes.map((size) => {
        const isOutOfStock = outOfStock.includes(size);
        const isSelected = selectedSize === size;

        return (
          <button
            key={size}
            type="button"
            onClick={() => !isOutOfStock && onSelect(size)}
            disabled={disabled || isOutOfStock}
            className={`
              hm-size-btn relative
              ${isSelected ? 'selected' : ''}
              ${isOutOfStock ? 'opacity-40 cursor-not-allowed line-through' : ''}
            `}
            title={isOutOfStock ? 'Sin stock' : size}
          >
            {size}
          </button>
        );
      })}
    </div>
  );
};

export default SizeSelector;
