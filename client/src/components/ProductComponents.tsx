import React, { useState } from 'react';
import { ShoppingCart, Heart, ChevronDown, Eye } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from './Toast';
import { StoreLink as Link } from './StoreLink';
import { QuickViewModal } from './QuickViewModal';

interface ProductCardProps {
  product: Product;
  index?: number; // For staggered animation
  onQuickView?: (product: Product) => void; // For quick view modal
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0, onQuickView }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { showCartToast } = useToast();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const firstColor = product.colors?.[0];
  const initialColor = typeof firstColor === 'object' ? firstColor?.name : firstColor;
  const [selectedColor, setSelectedColor] = useState<string | null>(initialColor || null);
  const [isHovered, setIsHovered] = useState(false);
  const isWishlisted = isInWishlist(product.id);

  // Stock logic
  const stock = product.stock ?? 100; // Default to 100 if not set
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 5;

  // Get hover image (second image in the array)
  const mainImage = product.image;
  const hoverImage = product.images && product.images.length > 0 ? product.images[0] : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isOutOfStock) {
      alert("Producto sin stock disponible");
      return;
    }
    
    // Only require size if product has sizes
    const hasSizes = product.sizes && product.sizes.length > 0;
    if (hasSizes && !selectedSize) {
      alert("Por favor selecciona un talle");
      return;
    }
    addToCart(product, selectedSize || undefined, selectedColor || undefined);
    showCartToast(product.name);
    setSelectedSize(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Check if product has sizes
  const hasSizes = product.sizes && product.sizes.length > 0;

  return (
    <Link 
      to={`/producto/${product.id}`} 
      className={`hm-product-card group block ${isOutOfStock ? 'opacity-75' : ''}`}
      style={{ '--card-index': index } as React.CSSProperties}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        // Track click (fire and forget)
        fetch(`/api/products/${product.id}/click`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).catch(err => console.error('Error tracking click:', err));
      }}
    >
      <div className="hm-product-image-container relative overflow-hidden">
        {/* Main image */}
        <img
          src={mainImage}
          alt={product.name}
          className={`hm-product-image ${hoverImage && isHovered ? 'opacity-0' : 'opacity-100'}`}
          loading="lazy"
        />
        
        {/* Hover image (second image) - only render if exists */}
        {hoverImage && (
          <img
            src={hoverImage}
            alt={`${product.name} - vista alternativa`}
            className={`absolute inset-0 w-full h-full object-contain p-3 transition-all duration-700 ease-out group-hover:scale-105 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
          />
        )}
        
        {/* Badges Container */}
        <div className="hm-product-badges">
          {isOutOfStock && (
            <span className="hm-product-badge bg-red-600 text-white">Sin stock</span>
          )}
          {isLowStock && !isOutOfStock && (
            <span className="hm-product-badge bg-orange-500 text-white">Últimas {stock} unid.</span>
          )}
          {product.discountPercent && !isOutOfStock && (
            <span className="hm-product-badge sale">-{product.discountPercent}%</span>
          )}
          {product.isNew && !isOutOfStock && (
            <span className="hm-product-badge new">Nuevo</span>
          )}
        </div>
        
        {/* Wishlist Button */}
        <button 
          className="hm-wishlist-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isWishlisted) {
              removeFromWishlist(product.id);
            } else {
              addToWishlist(product);
            }
          }}
          aria-label={isWishlisted ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <Heart 
            size={18} 
            fill={isWishlisted ? '#d32f2f' : 'none'} 
            color={isWishlisted ? '#d32f2f' : '#000'} 
          />
        </button>
        
        {/* Quick View Button */}
        {onQuickView && (
          <button 
            className="hm-quick-view-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(product);
            }}
            aria-label="Vista rápida"
          >
            <Eye size={18} />
          </button>
        )}
        
        {/* Quick Add Overlay - Only show if in stock */}
        {!isOutOfStock && (
          <div className="hm-quick-add" onClick={(e) => e.preventDefault()}>
            {/* Color selector */}
            {product.colors && product.colors.length > 1 && (
              <div className="flex justify-center gap-2 mb-3">
                {product.colors.map(color => {
                  const colorName = typeof color === 'string' ? color : color.name;
                  return (
                  <button
                    key={colorName}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedColor(colorName);
                    }}
                    className={`px-3 py-1 text-xs border transition-all ${
                      selectedColor === colorName 
                        ? 'border-black bg-black text-white' 
                        : 'border-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {colorName}
                  </button>
                  );
                })}
              </div>

            )}
            
            {/* Size selector - Only show if product has sizes */}
            {hasSizes && (
              <div className="hm-sizes">
                {product.sizes?.map(size => (
                  <button
                    key={size}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedSize(size);
                    }}
                    className={`hm-size-btn ${selectedSize === size ? 'selected' : ''}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={handleAddToCart}
              className="hm-add-btn"
            >
              <ShoppingCart size={16} />
              <span>Agregar</span>
            </button>
          </div>
        )}
      </div>
      
      <div className="hm-product-info">
        <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-1">
          {product.subcategory || product.category}
        </p>
        <h3 className="hm-product-name">{product.name}</h3>
        
        {/* Prices */}
        <div className="mt-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold hm-product-price">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          
          {/* Transfer price */}
          {product.transferPrice && (
            <p className="text-sm text-green-600 font-semibold mt-1">
              {formatPrice(product.transferPrice)} con transferencia
            </p>
          )}
          
          {/* Installments */}
          {product.installments && (
            <p className="text-xs text-gray-500 mt-1">
              {product.installments} cuotas sin interés
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

// Skeleton loader for products - Premium shimmer effect
export const ProductSkeleton: React.FC = () => (
  <div className="hm-product-card" style={{ opacity: 1, animation: 'none' }}>
    <div className="skeleton skeleton-image"></div>
    <div className="hm-product-info">
      <div className="skeleton skeleton-text" style={{ width: '40%' }}></div>
      <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
      <div className="skeleton skeleton-text" style={{ width: '50%' }}></div>
    </div>
  </div>
);

// Sorting options type
type SortOption = 'default' | 'price-asc' | 'price-desc' | 'newest' | 'bestseller' | 'discount';

interface ProductGridProps {
  title: string;
  products: Product[];
  id?: string;
  showFilters?: boolean;
  isLoading?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ title, products, id, showFilters = false, isLoading = false }) => {
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  
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
            {sortedProducts.map((product, index) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                index={index}
                onQuickView={setQuickViewProduct}
              />
            ))}
          </div>
          
          {sortedProducts.length === 0 && (
            <p className="text-center text-gray-500 py-12">
              No hay productos en esta categoría
            </p>
          )}
        </>
      )}
      
      {/* Quick View Modal */}
      <QuickViewModal 
        product={quickViewProduct}
        isOpen={quickViewProduct !== null}
        onClose={() => setQuickViewProduct(null)}
      />
    </section>
  );
};