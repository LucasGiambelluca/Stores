/**
 * RelatedProducts Widget
 * 
 * Displays products from the same category or manually selected.
 * Requires Starter plan or higher.
 * 
 * @plan starter - Available from Starter plan
 */

import React from 'react';
import { Product } from '../../types';
import { ProductCard } from '../ProductComponents';

interface RelatedProductsProps {
  product: Product;
  products: Product[];
  title?: string;
  limit?: number;
  layout?: 'grid' | 'carousel';
  columns?: 2 | 3 | 4;
}

export const RelatedProducts: React.FC<RelatedProductsProps> = ({
  product,
  products,
  title = 'También te puede gustar',
  limit = 4,
  layout = 'grid',
  columns = 4,
}) => {
  // Filter related products (same subcategory, different product)
  const relatedProducts = products.filter(p =>
    p.subcategory === product.subcategory && p.id !== product.id
  ).slice(0, limit);

  // Fallback to same category if no subcategory matches
  const finalProducts = relatedProducts.length > 0
    ? relatedProducts
    : products.filter(p =>
        p.category === product.category && p.id !== product.id
      ).slice(0, limit);

  if (finalProducts.length === 0) {
    return null;
  }

  const getGridClass = () => {
    switch (columns) {
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-2 md:grid-cols-3';
      case 4: return 'grid-cols-2 md:grid-cols-4';
      default: return 'grid-cols-2 md:grid-cols-4';
    }
  };

  if (layout === 'carousel') {
    return (
      <div className="related-products-widget mt-16">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4">
          {finalProducts.map(p => (
            <div key={p.id} className="flex-shrink-0 w-[280px] snap-start">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="related-products-widget mt-16">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      <div className={`grid ${getGridClass()} gap-4`}>
        {finalProducts.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
