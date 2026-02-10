import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { StoreLink as Link } from './StoreLink';
import { useStoreNavigate } from '../hooks/useStoreNavigate';
import { ArrowLeft, ShoppingCart, Heart, Truck, CreditCard, RefreshCcw, Banknote, ChevronLeft, ChevronRight, X, Ruler, HelpCircle, Sparkles } from 'lucide-react';
import { STORE_INFO } from '../constants';
import { useCart } from '../context/CartContext';
import { useProducts, useStoreConfig, useProductPageConfig } from '../context/StoreContext';
import { useWishlist } from '../context/WishlistContext';
import { API_BASE } from '../context/storeApi';
import { Navbar, Footer } from './Layout';
import { ProductCard } from './ProductComponents';
import { SizeCalculator } from './SizeCalculator';
import { ViewingIndicator, StockUrgency, StarRating, SavingsBadge } from './ProductIndicators';
import { ShippingCalculator } from './ShippingCalculator';
import { SizeGuide } from './SizeGuide';
import { ProductReviews } from './ProductReviews';
import { useToast } from './Toast';
import { StorefrontAIGenerator } from './StorefrontAIGenerator';
import { ProductBlockRenderer, DEFAULT_PRODUCT_BLOCKS } from './product-widgets/ProductBlockRenderer';

// Image Carousel Component with Lightbox
const ImageCarousel: React.FC<{ images: string[]; productName: string }> = ({ images, productName }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  const allImages = images.length > 0 ? images : [images[0]];
  
  const goToPrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1);
  };
  
  const goToNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1);
  };

  const openLightbox = () => setIsLightboxOpen(true);
  const closeLightbox = () => setIsLightboxOpen(false);

  // Handle keyboard navigation in lightbox
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  // Prevent body scroll when lightbox is open
  React.useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isLightboxOpen]);
  
  return (
    <>
      {/* Main Carousel */}
      <div className="relative">
        {/* Main image - clickable */}
        <div 
          className="aspect-[3/4] bg-white overflow-hidden cursor-zoom-in"
          onClick={openLightbox}
        >
          <img
            src={allImages[currentIndex]}
            alt={`${productName} - Imagen ${currentIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
        
        {/* Navigation arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
        
        {/* Thumbnails */}
        {allImages.length > 1 && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {allImages.map((img, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-20 h-24 bg-white overflow-hidden border-2 transition-all ${
                  index === currentIndex ? 'border-black' : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img
                  src={img}
                  alt={`${productName} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
        
        {/* Image counter */}
        {allImages.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
            {currentIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ animation: 'fade-in 0.2s ease-out forwards' }}
        >
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/90"
            onClick={closeLightbox}
          />
          
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 z-10 text-white/80 hover:text-white transition-colors"
          >
            <X size={32} />
          </button>
          
          {/* Image counter */}
          <div className="absolute top-6 left-6 text-white/80 text-sm">
            {currentIndex + 1} / {allImages.length}
          </div>
          
          {/* Navigation arrows */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 transition-all z-10"
              >
                <ChevronLeft size={48} />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 transition-all z-10"
              >
                <ChevronRight size={48} />
              </button>
            </>
          )}
          
          {/* Main lightbox image */}
          <div 
            className="relative z-10 max-w-[90vw] max-h-[85vh] flex items-center justify-center"
            style={{ animation: 'slide-up 0.3s ease-out forwards' }}
          >
            <img
              src={allImages[currentIndex]}
              alt={`${productName} - Imagen ${currentIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain shadow-2xl"
              style={{ transition: 'opacity 0.3s ease' }}
            />
          </div>
          
          {/* Thumbnail strip at bottom */}
          {allImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {allImages.map((img, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                  className={`w-16 h-20 overflow-hidden border-2 transition-all ${
                    index === currentIndex 
                      ? 'border-white opacity-100' 
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useStoreNavigate();
  const { addToCart } = useCart();
  const { products } = useProducts();
  const { config } = useStoreConfig();
  const { isInWishlist, addToWishlist, removeFromWishlist, addToRecentlyViewed, recentlyViewed } = useWishlist();
  const { showCartToast } = useToast();
  
  // Product Page Builder configuration (dynamic layout)
  const { config: productPageConfig, isCustomLayoutEnabled: apiIsEnabled, activeBlocks: apiBlocks, storePlan: apiStorePlan, refetch } = useProductPageConfig();
  
  // Preview mode logic
  const location = useLocation();
  const isPreview = new URLSearchParams(location.search).get('preview') === 'true';
  const [previewConfig, setPreviewConfig] = useState<any>(null);
  
  useEffect(() => {
    if (isPreview) {
      const saved = sessionStorage.getItem('product_page_preview');
      if (saved) {
        try {
          setPreviewConfig(JSON.parse(saved));
        } catch (e) {
          console.error('Error parsing preview config', e);
        }
      }
    }
  }, [isPreview]);
  
  // Use preview config if available, otherwise use API config
  const isCustomLayoutEnabled = (isPreview && previewConfig) ? previewConfig.isEnabled : apiIsEnabled;
  
  const activeBlocks = (isPreview && previewConfig) 
    ? previewConfig.blocks
        .filter((b: any) => b.isActive)
        .sort((a: any, b: any) => a.order - b.order)
    : apiBlocks;
    
  // In preview, we assume Pro features are available for testing
  const storePlan = isPreview ? 'pro' : apiStorePlan;
  
  // State for API-loaded product (for direct links)
  const [apiProduct, setApiProduct] = React.useState<any>(null);
  const [isLoadingProduct, setIsLoadingProduct] = React.useState(false);
  
  // Support both string UUIDs (from API) and numeric IDs (from constants)
  const contextProduct = products.find(p => String(p.id) === id);
  
  // Use context product if available, otherwise use API-loaded product
  const product = contextProduct || apiProduct;
  
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const firstColor = product?.colors?.[0];
  const initialColor = typeof firstColor === 'object' ? firstColor?.name : firstColor;
  const [selectedColor, setSelectedColor] = useState<string | null>(initialColor || null);
  const [quantity, setQuantity] = useState(1);
  const [showSizeError, setShowSizeError] = useState(false);
  const [showSizeCalc, setShowSizeCalc] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showTryOn, setShowTryOn] = useState(false);
  
  // New state for bundles and cross-sells
  const [selectedBundle, setSelectedBundle] = useState<any>(null);
  const [selectedCrossSells, setSelectedCrossSells] = useState<string[]>([]);

  const isWishlisted = product ? isInWishlist(product.id) : false;

  // Handler for bundle selection
  const handleSelectBundle = (bundle: any) => {
    setSelectedBundle(bundle);
    if (bundle) {
      setQuantity(bundle.quantity);
    } else {
      setQuantity(1);
    }
  };

  // Handler for cross-sell toggle
  const handleToggleCrossSell = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedCrossSells(prev => [...prev, id]);
    } else {
      setSelectedCrossSells(prev => prev.filter(item => item !== id));
    }
  };

  // Load product from API if not in context (direct link support)
  useEffect(() => {
    if (!contextProduct && id && !apiProduct && !isLoadingProduct) {
      setIsLoadingProduct(true);
      
      // Fetch product directly by ID (without storeId - API will return it)
      fetch(`${API_BASE}/products/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.product) {
            setApiProduct(data.product);
            
            // Auto-detect and save storeId for subsequent requests
            if (data.storeId) {
              console.log('[ProductDetail] Auto-detected storeId from API:', data.storeId);
              sessionStorage.setItem('tiendita_store_id', data.storeId);
              // Retry fetching page config now that we have storeId
              refetch();
            }
          }
        })
        .catch(err => {
          console.error('[ProductDetail] Error fetching product:', err);
        })
        .finally(() => {
          setIsLoadingProduct(false);
        });
    }
  }, [id, contextProduct, apiProduct, isLoadingProduct, refetch]);

  // Track recently viewed and analytics view
  useEffect(() => {
    if (product) {
      addToRecentlyViewed(product);
      
      // Track view in analytics (fire and forget)
      // We don't await this as it shouldn't block the UI
      fetch(`${API_BASE}/products/${product.id}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }).catch(err => console.error('Error tracking view:', err));
    }
  }, [product?.id]);

  if (isLoadingProduct) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2>
        <Link to="/" className="text-blue-600 hover:underline">Volver al inicio</Link>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleAddToCart = () => {
    // Only require size if product has sizes
    const hasSizes = product.sizes && product.sizes.length > 0;
    if (hasSizes && !selectedSize) {
      setShowSizeError(true);
      return;
    }
    setShowSizeError(false);
    
    // Add main product (quantity handled by bundle or selector)
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedSize || undefined, selectedColor || undefined);
    }

    // Add cross-sells
    if (selectedCrossSells.length > 0) {
      selectedCrossSells.forEach(id => {
        const crossSellProduct = products.find(p => p.id === id) || {
          id,
          name: 'Producto Complementario',
          price: 0,
          image: '',
          category: 'Accesorios'
        } as any;
        
        if (crossSellProduct) {
          addToCart(crossSellProduct);
        }
      });
    }

    // Show toast notification
    showCartToast(product.name);
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Hola! Me interesa el producto: ${product.name}\n` +
      `Precio: ${formatPrice(product.price)}\n` +
      `Talle: ${selectedSize || 'Por definir'}\n` +
      `Color: ${selectedColor || 'Por definir'}\n` +
      `Link: ${product.url || window.location.href}`
    );
    window.open(`https://wa.me/${STORE_INFO.whatsapp.replace('+', '')}?text=${message}`, '_blank');
  };

  const isLowStock = product.stockStatus === 'Última' || product.stockStatus?.includes('en stock');

  // Get images array (prioritize main image + gallery)
  const galleryImages = product.images || [];
  const mainImage = product.image;
  
  const productImages = mainImage 
    ? [mainImage, ...galleryImages.filter(img => img !== mainImage)]
    : (galleryImages.length > 0 ? galleryImages : []);

  // Related products (same subcategory, different product)
  const relatedProducts = products.filter(p => 
    p.subcategory === product.subcategory && p.id !== product.id
  ).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#F8F8FA] flex flex-col">
      <Navbar onMenuClick={() => {}} />
      
      <main className="flex-1">
        {/* Breadcrumbs */}
        <div className="max-w-6xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-black">Inicio</Link>
            <span>/</span>
            <span className="hover:text-black cursor-pointer">{product.subcategory}</span>
            <span>/</span>
            <span className="text-black">{product.name}</span>
        </nav>
        </div>

        {/* Product Content */}
        {/* Product Content */}
        {isCustomLayoutEnabled && activeBlocks ? (
          <div className="max-w-6xl mx-auto px-4 pb-16">
            {/* Dynamic Grid Layout */}
            {(() => {
              // Get layout config from preview or API config
              const layoutConfig = (isPreview && previewConfig) 
                ? previewConfig.layoutConfig 
                : productPageConfig?.layoutConfig;

              // Default layout if no config exists
              const effectiveLayout = layoutConfig || {
                gridType: 'classic',
                leftColumn: ['product-gallery'],
                rightColumn: ['product-info', 'product-buy-box', 'product-description', 'product-countdown', 'product-banner', 'product-size-guide'],
                fullWidth: ['related-products', 'product-reviews', 'product-specs']
              };

              // Helper to check if block belongs to a column
              const isInColumn = (blockType: string, column: string[]) => column.includes(blockType);

              // Grid classes based on type
              const gridClasses = {
                'classic': 'grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 lg:gap-16', // 50/50 but visually balanced
                'full-width': 'grid-cols-1',
                'gallery-left': 'grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16',
                'gallery-right': 'grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16',
              }[effectiveLayout.gridType as string] || 'grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16';

              return (
                <>
                  <div className={`grid ${gridClasses}`}>
                    {/* Left Column */}
                    {effectiveLayout.gridType !== 'full-width' && (
                      <div className={`flex flex-col gap-8 ${effectiveLayout.gridType === 'gallery-right' ? 'order-2' : 'order-1'}`}>
                        {activeBlocks
                          .filter(b => isInColumn(b.type, effectiveLayout.leftColumn))
                          .map(block => (
                            <ProductBlockRenderer 
                              key={block.id} 
                              block={block} 
                              product={product}
                              products={products}
                              storePlan={storePlan}
                              onSizeGuideClick={() => setShowSizeGuide(true)}
                              onTryOnClick={() => setShowTryOn(true)}
                              selectedBundle={selectedBundle}
                              onSelectBundle={handleSelectBundle}
                              selectedCrossSells={selectedCrossSells}
                              onToggleCrossSell={handleToggleCrossSell}
                            />
                          ))}
                      </div>
                    )}
                    
                    {/* Right Column - Sticky */}
                    {effectiveLayout.gridType !== 'full-width' && (
                      <div className={`${effectiveLayout.gridType === 'gallery-right' ? 'order-1' : 'order-2'}`}>
                        <div className="flex flex-col gap-8 sticky top-4">
                          {activeBlocks
                            .filter(b => isInColumn(b.type, effectiveLayout.rightColumn))
                            .map(block => (
                              <ProductBlockRenderer 
                                key={block.id} 
                                block={block} 
                                product={product}
                                products={products}
                                storePlan={storePlan}
                                onSizeGuideClick={() => setShowSizeGuide(true)}
                                onTryOnClick={() => setShowTryOn(true)}
                                selectedBundle={selectedBundle}
                                onSelectBundle={handleSelectBundle}
                                selectedCrossSells={selectedCrossSells}
                                onToggleCrossSell={handleToggleCrossSell}
                              />
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Full Width Column (for full-width grid type) */}
                    {effectiveLayout.gridType === 'full-width' && (
                      <div className="flex flex-col gap-6">
                        {activeBlocks
                          .filter(b => 
                            isInColumn(b.type, effectiveLayout.leftColumn) || 
                            isInColumn(b.type, effectiveLayout.rightColumn)
                          )
                          .map(block => (
                            <ProductBlockRenderer 
                              key={block.id} 
                              block={block} 
                              product={product}
                              products={products}
                              storePlan={storePlan}
                              onSizeGuideClick={() => setShowSizeGuide(true)}
                              onTryOnClick={() => setShowTryOn(true)}
                              selectedBundle={selectedBundle}
                              onSelectBundle={handleSelectBundle}
                              selectedCrossSells={selectedCrossSells}
                              onToggleCrossSell={handleToggleCrossSell}
                            />
                          ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Bottom Full Width Section */}
                  <div className="mt-16 flex flex-col gap-10">
                    {activeBlocks
                      .filter(b => isInColumn(b.type, effectiveLayout.fullWidth))
                      .map(block => (
                        <div key={block.id}>
                          <ProductBlockRenderer 
                            block={block} 
                            product={product}
                            products={products}
                            storePlan={storePlan}
                            onSizeGuideClick={() => setShowSizeGuide(true)}
                            onTryOnClick={() => setShowTryOn(true)}
                            selectedBundle={selectedBundle}
                            onSelectBundle={handleSelectBundle}
                            selectedCrossSells={selectedCrossSells}
                            onToggleCrossSell={handleToggleCrossSell}
                          />
                        </div>
                      ))}
                  </div>
                </>
              );
            })()}
          </div>
        ) : (
          <div className="max-w-6xl mx-auto px-4 pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
              
              {/* Image Column with Carousel */}
              <div className="relative">
                <button 
                  onClick={() => navigate(-1)}
                  className="absolute top-4 left-4 z-10 bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition-colors lg:hidden"
                >
                  <ArrowLeft size={20} />
                </button>
                
                {/* Badges */}
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
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
                  {isLowStock && (
                    <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1">
                      {product.stockStatus}
                    </span>
                  )}
                </div>
                
                {/* Image Carousel */}
                <ImageCarousel images={productImages} productName={product.name} />
              </div>

              {/* Info Column */}
              <div className="lg:py-8">
                {/* Category */}
                <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">
                  {product.subcategory}
                </p>
                
                {/* Title */}
                <h1 className="text-3xl lg:text-4xl font-bold mb-3">{product.name}</h1>
                
                {/* Ratings & Viewing */}
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <StarRating rating={product.rating ?? 4.5} count={product.reviewCount ?? 0} />
                  <ViewingIndicator productId={product.id} />
                </div>

                {/* Stock Urgency */}
                {product.stock && product.stock <= 10 && (
                  <div className="mb-4">
                    <StockUrgency stock={product.stock} />
                  </div>
                )}
                
                {/* Prices */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
                    {product.originalPrice && (
                      <>
                        <span className="text-lg text-gray-400 line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                        <SavingsBadge originalPrice={product.originalPrice} currentPrice={product.price} />
                      </>
                    )}
                  </div>
                  
                  {product.transferPrice && (
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <Banknote size={18} />
                      <span className="font-semibold">{formatPrice(product.transferPrice)}</span>
                      <span className="text-sm">con transferencia (15% OFF)</span>
                    </div>
                  )}
                  
                  {product.installments && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <CreditCard size={18} />
                      <span className="text-sm">
                        {product.installments} cuotas sin interés de {formatPrice(Math.round(product.price / product.installments))}
                      </span>
                    </div>
                  )}
                </div>

                {/* Color Selection */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-semibold mb-3">
                      Color: <span className="font-normal text-gray-600">{selectedColor}</span>
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {product.colors.map(color => {
                        const colorName = typeof color === 'string' ? color : color.name;
                        const colorHex = typeof color === 'object' ? color.hex : null;
                        
                        return (
                        <button
                          key={colorName}
                          onClick={() => setSelectedColor(colorName)}
                          className={`px-4 py-2 border text-sm transition-all flex items-center gap-2 ${
                            selectedColor === colorName 
                              ? 'border-black bg-black text-white' 
                              : 'border-gray-300 hover:border-black'
                          }`}
                        >
                          {colorHex && (
                            <span 
                              className="w-3 h-3 rounded-full border border-gray-200" 
                              style={{ backgroundColor: colorHex }}
                            ></span>
                          )}
                          {colorName}
                        </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Size Selection - Only show if product has sizes */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-semibold mb-3">
                      Talle: <span className="font-normal text-gray-600">{selectedSize || 'Seleccionar'}</span>
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {product.sizes.map(size => (
                        <button
                          key={size}
                          onClick={() => {
                            setSelectedSize(size);
                            setShowSizeError(false);
                          }}
                          className={`w-12 h-12 border text-sm font-medium transition-all ${
                            selectedSize === size 
                              ? 'border-black bg-black text-white' 
                              : 'border-gray-200 hover:border-black'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    {showSizeError && (
                      <p className="text-red-500 text-sm mt-2">Por favor selecciona un talle</p>
                    )}
                    <button
                      onClick={() => setShowSizeCalc(true)}
                      className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Ruler size={16} />
                      ¿No sabés tu talle? Calculalo
                    </button>
                  </div>
                )}

                {/* Quantity */}
                <div className="mb-6">
                  <p className="text-sm font-semibold mb-3">Cantidad</p>
                  <div className="flex items-center border border-gray-300 w-fit">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-12 h-12 flex items-center justify-center font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(q => q + 1)}
                      className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-black text-white py-4 px-6 font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                  >
                    <ShoppingCart size={20} />
                    Agregar al Carrito
                  </button>
                  <button
                    onClick={() => isWishlisted ? removeFromWishlist(product.id) : addToWishlist(product)}
                    className={`w-14 h-14 border flex items-center justify-center transition-all ${
                      isWishlisted 
                        ? 'bg-red-50 border-red-500 text-red-500' 
                        : 'border-gray-300 hover:border-black'
                    }`}
                  >
                    <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Virtual Try-On Button - Only for Retail stores with AI enabled */}
                {config.storeType === 'retail' && config.aiTryOnEnabled && (
                  <button 
                    onClick={() => setShowTryOn(true)}
                    className="w-full py-4 rounded-xl font-bold border-2 border-purple-500 text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-2 group mb-4"
                  >
                    <Sparkles size={20} className="group-hover:animate-pulse" />
                    Probar en mí (IA)
                  </button>
                )}

                {/* Buy Now Button */}
                <button
                  onClick={() => {
                    // Check if size is required and selected
                    const hasSizes = product.sizes && product.sizes.length > 0;
                    if (hasSizes && !selectedSize) {
                      setShowSizeError(true);
                      return;
                    }
                    setShowSizeError(false);
                    // Add to cart
                    for (let i = 0; i < quantity; i++) {
                      addToCart(product, selectedSize || undefined, selectedColor || undefined);
                    }
                    // Navigate to checkout
                    navigate('/checkout');
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-6 font-semibold flex items-center justify-center gap-2 hover:from-orange-600 hover:to-orange-700 transition-all mb-4"
                >
                  ⚡ Comprar Ahora
                </button>

                {/* WhatsApp Button */}
                <button
                  onClick={handleWhatsApp}
                  className="w-full bg-green-500 text-white py-3 px-6 font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors mb-8"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Consultar por WhatsApp
                </button>

                {/* Benefits */}
                <div className="grid grid-cols-3 gap-4 py-6 border-t border-b border-gray-200">
                  <div className="text-center">
                    <Truck size={24} className="mx-auto mb-2 text-gray-600" />
                    <p className="text-xs font-medium">Envío Gratis</p>
                    <p className="text-xs text-gray-500">+${(STORE_INFO.freeShippingFrom/1000).toFixed(0)}k</p>
                  </div>
                  <div className="text-center">
                    <CreditCard size={24} className="mx-auto mb-2 text-gray-600" />
                    <p className="text-xs font-medium">{STORE_INFO.installments} Cuotas</p>
                    <p className="text-xs text-gray-500">Sin interés</p>
                  </div>
                  <div className="text-center">
                    <RefreshCcw size={24} className="mx-auto mb-2 text-gray-600" />
                    <p className="text-xs font-medium">Devolución</p>
                    <p className="text-xs text-gray-500">{STORE_INFO.returnDays} días</p>
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Descripción</h3>
                    <p className="text-gray-600 leading-relaxed">{product.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <div className="mt-16">
                <h2 className="text-2xl font-bold mb-6">También te puede gustar</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {relatedProducts.map(p => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
            )}

            {/* Customer Reviews Section */}
            <div className="mt-8">
              <ProductReviews productId={String(product.id)} productName={product.name} />
            </div>
          </div>
        )}
      </main>
      
      <Footer />

      {/* Size Calculator Modal */}
      {showSizeCalc && (
        <SizeCalculator
          product={product}
          isOpen={true}
          onClose={() => setShowSizeCalc(false)}
          onSelectSize={(size) => {
            setSelectedSize(size);
            setShowSizeError(false);
          }}
        />
      )}

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <SizeGuide
          isOpen={true}
          onClose={() => setShowSizeGuide(false)}
        />
      )}

      {/* Virtual Try-On Modal */}
      {showTryOn && (
        <StorefrontAIGenerator
          garmentImageUrl={product.image}
          onClose={() => setShowTryOn(false)}
        />
      )}
    </div>
  );
};
