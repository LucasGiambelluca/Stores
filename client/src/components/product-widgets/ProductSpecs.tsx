
import React from 'react';
import { Product } from '../../types';

interface ProductSpecsProps {
  product: Product;
  title?: string;
  layout?: 'table' | 'list';
}

const ProductSpecs: React.FC<ProductSpecsProps> = ({
  product,
  title = 'Especificaciones',
  layout = 'table'
}) => {
  // Use product attributes or fallback to mock data if empty (for demo purposes)
  const attributes = product.attributes || {
    'Material': 'Algodón 100% Orgánico',
    'Peso': '250g',
    'Origen': 'Argentina',
    'Cuidados': 'Lavado a mano con agua fría',
    'Garantía': '30 días por defectos de fábrica',
    'SKU': `PRD-${product.id}`
  };

  const entries = Object.entries(attributes);

  if (entries.length === 0) return null;

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4">
        {title && (
          <h3 className="text-xl font-bold mb-6">{title}</h3>
        )}

        {layout === 'table' ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <tbody className="divide-y divide-gray-200">
                {entries.map(([key, value], index) => (
                  <tr key={key} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <th className="px-6 py-4 font-medium text-gray-900 w-1/3">{key}</th>
                    <td className="px-6 py-4 text-gray-600">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {entries.map(([key, value]) => (
              <div key={key} className="flex justify-between border-b border-gray-100 pb-2">
                <span className="font-medium text-gray-900">{key}</span>
                <span className="text-gray-600">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductSpecs;
