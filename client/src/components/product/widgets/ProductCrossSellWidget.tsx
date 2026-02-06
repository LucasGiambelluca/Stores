import React from 'react';
import { Plus, Check } from 'lucide-react';

interface CrossSellProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
}

interface ProductCrossSellWidgetProps {
  config: {
    title?: string;
    subtitle?: string;
    products?: string[]; // IDs
    discount?: number;
  };
  product: any;
  onToggleProduct?: (productId: string, selected: boolean) => void;
  selectedProducts?: string[];
  accentColor?: string;
}

export const ProductCrossSellWidget: React.FC<ProductCrossSellWidgetProps> = ({ 
  config, 
  product,
  onToggleProduct,
  selectedProducts = [],
  accentColor = '#000000'
}) => {
  const { title = 'Armá tu pack', subtitle = 'Seleccioná los complementos', discount = 0 } = config;

  // Mock products if none provided (for demo/preview)
  // In real app, we would fetch these by ID
  const mockComplements: CrossSellProduct[] = [
    { id: 'comp-1', name: 'Tarjetero', price: 31500, image: '' },
    { id: 'comp-2', name: 'Bolso', price: 49990, image: '' },
    { id: 'comp-3', name: 'Llavero', price: 9900, image: '' },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleToggle = (id: string) => {
    if (onToggleProduct) {
      const isSelected = selectedProducts.includes(id);
      onToggleProduct(id, !isSelected);
    }
  };

  return (
    <div className="w-full bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        {discount > 0 && (
          <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
            -{discount}% OFF
          </span>
        )}
      </div>
      
      <div className="divide-y divide-gray-100">
        {mockComplements.map((item) => {
          const isSelected = selectedProducts.includes(item.id);
          
          return (
            <div 
              key={item.id}
              onClick={() => handleToggle(item.id)}
              className={`
                flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors
                ${isSelected ? 'bg-gray-50' : ''}
              `}
            >
              {/* Checkbox */}
              <div 
                className={`
                  w-5 h-5 rounded border flex items-center justify-center mr-4 transition-colors
                  ${isSelected ? 'border-transparent text-white' : 'border-gray-300 bg-white'}
                `}
                style={{ backgroundColor: isSelected ? accentColor : undefined }}
              >
                {isSelected && <Check size={14} strokeWidth={3} />}
              </div>

              {/* Image Placeholder */}
              <div className="w-12 h-12 bg-gray-200 rounded-md mr-4 flex-shrink-0" />

              {/* Info */}
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-bold text-gray-900">
                    {formatPrice(item.price)}
                  </span>
                  {discount > 0 && isSelected && (
                    <span className="text-xs text-green-600 bg-green-50 px-1.5 rounded">
                      Ahorrado: {formatPrice(item.price * (discount / 100))}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedProducts.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <button 
            className="w-full py-3 rounded-lg font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: accentColor }}
          >
            Agregar al carrito ({selectedProducts.length + 1})
          </button>
        </div>
      )}
    </div>
  );
};
