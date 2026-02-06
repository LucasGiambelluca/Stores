/**
 * ProductInfo Widget
 * 
 * Displays product title, category, ratings, and badges.
 * Extracted from ProductDetail.tsx for use with the Product Page Builder.
 * 
 * @plan free - Available to all plans
 */

import React from 'react';
import { Product } from '../../types';
import { ViewingIndicator, StockUrgency, StarRating } from '../ProductIndicators';

interface ProductInfoProps {
  product: Product;
  showCategory?: boolean;
  showRating?: boolean;
  showViewingCount?: boolean;
  showStockUrgency?: boolean;
  showBadges?: boolean;
}

export const ProductInfo: React.FC<ProductInfoProps> = ({
  product,
  showCategory = true,
  showRating = true,
  showViewingCount = true,
  showStockUrgency = true,
  showBadges = true,
}) => {
  const isLowStock = product.stockStatus === 'Última' || product.stockStatus?.includes('en stock');

  return (
    <div className="product-info-widget">
      {/* Category */}
      {showCategory && (
        <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">
          {product.subcategory || product.category}
        </p>
      )}

      {/* Title */}
      <h1 className="text-3xl lg:text-4xl font-bold mb-3">{product.name}</h1>

      {/* Badges */}
      {showBadges && (
        <div className="flex flex-wrap gap-2 mb-3">
          {product.discountPercent && (
            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1">
              -{product.discountPercent}%
            </span>
          )}
          {product.isNew && (
            <span className="bg-black text-white text-xs font-bold px-3 py-1">
              NUEVO
            </span>
          )}
          {product.isBestSeller && (
            <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1">
              MÁS VENDIDO
            </span>
          )}
          {product.isOnSale && (
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1">
              OFERTA
            </span>
          )}
        </div>
      )}

      {/* Ratings & Viewing */}
      {(showRating || showViewingCount) && (
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {showRating && <StarRating rating={4.5} count={23} />}
          {showViewingCount && <ViewingIndicator productId={String(product.id)} />}
        </div>
      )}

      {/* Stock Urgency */}
      {showStockUrgency && product.stock && product.stock <= 10 && (
        <div className="mb-4">
          <StockUrgency stock={product.stock} />
        </div>
      )}

      {/* Low stock badge (alternative display) */}
      {showStockUrgency && isLowStock && !product.stock && (
        <div className="mb-4">
          <span className="inline-block bg-orange-100 text-orange-700 text-sm font-medium px-3 py-1 rounded-full">
            ⚡ {product.stockStatus}
          </span>
        </div>
      )}
    </div>
  );
};

export default ProductInfo;
