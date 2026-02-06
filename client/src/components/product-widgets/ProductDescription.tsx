/**
 * ProductDescription Widget
 * 
 * Displays product description and specifications.
 * Extracted from ProductDetail.tsx for use with the Product Page Builder.
 * 
 * @plan free - Available to all plans
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Product } from '../../types';

interface ProductDescriptionProps {
  product: Product;
  showTitle?: boolean;
  expandable?: boolean;
  maxLines?: number;
}

export const ProductDescription: React.FC<ProductDescriptionProps> = ({
  product,
  showTitle = true,
  expandable = false,
  maxLines = 4,
}) => {
  const [isExpanded, setIsExpanded] = useState(!expandable);

  if (!product.description) {
    return null;
  }

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  return (
    <div className="product-description-widget">
      {showTitle && (
        <h3 className="font-semibold mb-3 text-lg">Descripción</h3>
      )}
      
      <div
        className={`text-gray-600 leading-relaxed ${
          !isExpanded ? `line-clamp-${maxLines}` : ''
        }`}
        style={!isExpanded ? { 
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        } : undefined}
      >
        {product.description.split('\n').map((paragraph, index) => (
          <p key={index} className={index > 0 ? 'mt-3' : ''}>
            {paragraph}
          </p>
        ))}
      </div>
      
      {expandable && product.description.length > 200 && (
        <button
          onClick={toggleExpanded}
          className="mt-3 flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp size={16} />
              Ver menos
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              Ver más
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default ProductDescription;
