import React from 'react';
import { Check, Tag } from 'lucide-react';

interface Bundle {
  quantity: number;
  discount: number;
  label: string;
  isPopular?: boolean;
}

interface ProductBundlesWidgetProps {
  config: {
    title?: string;
    bundles?: Bundle[];
  };
  product: any;
  selectedBundle?: Bundle | null;
  onSelectBundle?: (bundle: Bundle | null) => void;
  currentPrice: number;
  accentColor?: string;
}

export const ProductBundlesWidget: React.FC<ProductBundlesWidgetProps> = ({ 
  config, 
  product,
  selectedBundle,
  onSelectBundle,
  currentPrice,
  accentColor = '#000000'
}) => {
  const { title = 'Ahorrá llevando más', bundles = [] } = config;

  // Default bundles if none configured
  const effectiveBundles = bundles.length > 0 ? bundles : [
    { quantity: 2, discount: 15, label: 'Pack x2', isPopular: true },
    { quantity: 3, discount: 20, label: 'Pack x3', isPopular: false }
  ];

  // Add single unit option
  const allOptions = [
    { quantity: 1, discount: 0, label: 'Pack x1', isPopular: false },
    ...effectiveBundles
  ];

  const handleSelect = (option: any) => {
    if (onSelectBundle) {
      // If quantity is 1, we deselect bundle (null)
      onSelectBundle(option.quantity === 1 ? null : option);
    }
  };

  const isSelected = (option: any) => {
    if (option.quantity === 1) return !selectedBundle;
    return selectedBundle?.quantity === option.quantity;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="w-full bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {title && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <h3 className="font-medium text-gray-900">{title}</h3>
        </div>
      )}
      
      <div className="p-4 space-y-3">
        {allOptions.map((option, index) => {
          const active = isSelected(option);
          const unitPrice = currentPrice * (1 - option.discount / 100);
          const totalPrice = unitPrice * option.quantity;
          const originalTotal = currentPrice * option.quantity;
          const savings = originalTotal - totalPrice;

          return (
            <div 
              key={index}
              onClick={() => handleSelect(option)}
              className={`
                relative flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all
                ${active ? 'border-current bg-opacity-5' : 'border-gray-100 hover:border-gray-200'}
              `}
              style={{ 
                borderColor: active ? accentColor : undefined,
                backgroundColor: active ? `${accentColor}0D` : undefined // 5% opacity hex
              }}
            >
              {/* Radio Circle */}
              <div 
                className={`
                  w-5 h-5 rounded-full border flex items-center justify-center mr-3
                  ${active ? 'border-current' : 'border-gray-300'}
                `}
                style={{ borderColor: active ? accentColor : undefined }}
              >
                {active && (
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: accentColor }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{option.label}</span>
                  <div className="text-right">
                    {option.discount > 0 && (
                      <span className="text-xs text-gray-400 line-through block">
                        {formatPrice(originalTotal)}
                      </span>
                    )}
                    <span className="font-bold text-gray-900">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                </div>
                
                {option.discount > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                      Ahorrá {option.discount}%
                    </span>
                    <span className="text-xs text-gray-500">
                      ({formatPrice(unitPrice)} c/u)
                    </span>
                  </div>
                )}
              </div>

              {/* Badge */}
              {option.isPopular && (
                <div className="absolute -top-2.5 right-4">
                  <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
                    Más vendido
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
