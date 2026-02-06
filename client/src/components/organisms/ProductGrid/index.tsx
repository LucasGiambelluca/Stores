import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Product } from '../../../types';
import { ProductCard, ProductSkeleton } from '../../ProductComponents';

// Sorting options type
type SortOption = 'default' | 'price-asc' | 'price-desc' | 'newest' | 'bestseller' | 'discount';

export interface ProductGridProps {
  title: string;
  products: Product[];
  id?: string;
  showFilters?: boolean;
  isLoading?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ 
  title, 
  products, 
  id, 
  showFilters = false, 
  isLoading = false 
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  
  // Normalize subcategory for comparison
  const normalizeSubcat = (sub: string | undefined) => sub?.toLowerCase().replace(/\s+/g, '-') || '';
  
  // Filter products
  const filteredProducts = filter === 'all' 
    ? products 
    : products.filter(p => normalizeSubcat(p.subcategory) === filter);

  // Sort products
  const sortProducts = (prods: Product[]): Product[] => {
    const sorted = [...prods];
    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'newest':
        return sorted.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
      case 'bestseller':
        return sorted.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
      case 'discount':
        return sorted.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
      default:
        return sorted;
    }
  };

  const sortedProducts = sortProducts(filteredProducts);
  const subcategories = Array.from(new Set(products.map(p => p.subcategory).filter(Boolean))) as string[];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'default', label: 'Ordenar por' },
    { value: 'price-asc', label: 'Precio: Menor a Mayor' },
    { value: 'price-desc', label: 'Precio: Mayor a Menor' },
    { value: 'newest', label: 'Más Nuevos' },
    { value: 'bestseller', label: 'Más Vendidos' },
    { value: 'discount', label: 'Mayor Descuento' },
  ];

  return (
    <section id={id} className="hm-products-section">
      <div className="hm-section-header flex-wrap gap-4">
        <h2 className="hm-section-title">{title}</h2>
        
        <div className="flex items-center gap-4 flex-wrap">
          {/* Category filters */}
          {showFilters && subcategories.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm border transition-all ${
                  filter === 'all' ? 'bg-black text-white border-black' : 'border-gray-300 hover:border-black'
                }`}
              >
                Todos ({products.length})
              </button>
              {subcategories.map(sub => (
                <button 
                  key={sub}
                  onClick={() => setFilter(normalizeSubcat(sub))}
                  className={`px-4 py-2 text-sm border transition-all ${
                    filter === normalizeSubcat(sub) ? 'bg-black text-white border-black' : 'border-gray-300 hover:border-black'
                  }`}
                >
                  {sub} ({products.filter(p => p.subcategory === sub).length})
                </button>
              ))}
            </div>
          )}

          {/* Sort dropdown */}
          {showFilters && (
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 bg-white hover:border-black transition-all"
              >
                {sortOptions.find(opt => opt.value === sortBy)?.label}
                <ChevronDown size={16} className={`transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showSortDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowSortDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg z-20 rounded-lg overflow-hidden">
                    {sortOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                          sortBy === option.value ? 'bg-gray-100 font-medium' : ''
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Loading skeletons */}
      {isLoading ? (
        <div className="hm-product-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="hm-product-grid">
            {sortedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          {sortedProducts.length === 0 && (
            <p className="text-center text-gray-500 py-12">
              No hay productos en esta categoría
            </p>
          )}
        </>
      )}
    </section>
  );
};

export default ProductGrid;
