import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Heart, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from './Toast';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, isOpen, onClose }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { showCartToast } = useToast();
  
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setSelectedSize(null);
      setSelectedColor(product.colors?.[0] || null);
      setQuantity(1);
      setCurrentImageIndex(0);
    }
  }, [product]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!product || !isOpen) return null;

  const images = [product.image, ...(product.images || [])];
  const isWishlisted = isInWishlist(product.id);
  const stock = product.stock ?? 100;
  const isOutOfStock = stock <= 0;
  const hasSizes = product.sizes && product.sizes.length > 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    if (hasSizes && !selectedSize) {
      alert('Por favor selecciona un talle');
      return;
    }
    
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedSize || undefined);
    }
    showCartToast(product.name);
    onClose();
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="quick-view-backdrop"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="quick-view-modal">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="quick-view-close"
          aria-label="Cerrar"
        >
          <X size={24} />
        </button>

        <div className="quick-view-content">
          {/* Image Gallery */}
          <div className="quick-view-gallery">
            {/* Main Image */}
            <div className="quick-view-image-container">
              <img 
                src={images[currentImageIndex]} 
                alt={product.name}
                className="quick-view-main-image"
              />
              
              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="quick-view-nav prev"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="quick-view-nav next"
                    aria-label="Siguiente imagen"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              {/* Image dots */}
              {images.length > 1 && (
                <div className="quick-view-dots">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`quick-view-dot ${index === currentImageIndex ? 'active' : ''}`}
                      aria-label={`Ver imagen ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Wishlist */}
              <button 
                onClick={() => isWishlisted ? removeFromWishlist(product.id) : addToWishlist(product)}
                className="quick-view-wishlist"
              >
                <Heart 
                  size={20} 
                  fill={isWishlisted ? '#d32f2f' : 'none'} 
                  color={isWishlisted ? '#d32f2f' : 'currentColor'}
                />
              </button>
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="quick-view-thumbnails">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`quick-view-thumb ${index === currentImageIndex ? 'active' : ''}`}
                  >
                    <img src={img} alt={`${product.name} - ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="quick-view-info">
            {/* Category */}
            <p className="quick-view-category">
              {product.subcategory || product.category}
            </p>

            {/* Title */}
            <h2 className="quick-view-title">{product.name}</h2>

            {/* Price */}
            <div className="quick-view-price-container">
              <span className="quick-view-price">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="quick-view-original-price">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
              {product.discountPercent && (
                <span className="quick-view-discount">
                  -{product.discountPercent}%
                </span>
              )}
            </div>

            {/* Transfer price */}
            {product.transferPrice && (
              <p className="quick-view-transfer">
                {formatPrice(product.transferPrice)} con transferencia
              </p>
            )}

            {/* Description (truncated) */}
            {product.description && (
              <p className="quick-view-description">
                {product.description.substring(0, 150)}
                {product.description.length > 150 ? '...' : ''}
              </p>
            )}

            {/* Color selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="quick-view-option">
                <label>Color: <strong>{selectedColor}</strong></label>
                <div className="quick-view-colors">
                  {product.colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`quick-view-color-btn ${selectedColor === color ? 'active' : ''}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size selector */}
            {hasSizes && (
              <div className="quick-view-option">
                <label>Talle: <strong>{selectedSize || 'Seleccionar'}</strong></label>
                <div className="quick-view-sizes">
                  {product.sizes?.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`quick-view-size-btn ${selectedSize === size ? 'active' : ''}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="quick-view-option">
              <label>Cantidad:</label>
              <div className="quick-view-quantity">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus size={16} />
                </button>
                <span>{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                  disabled={quantity >= stock}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Stock status */}
            {isOutOfStock ? (
              <p className="quick-view-stock out">Sin stock disponible</p>
            ) : stock <= 5 ? (
              <p className="quick-view-stock low">¡Últimas {stock} unidades!</p>
            ) : null}

            {/* Add to cart */}
            <button 
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="quick-view-add-btn btn-premium"
            >
              <ShoppingCart size={20} />
              {isOutOfStock ? 'Sin Stock' : 'Agregar al Carrito'}
            </button>

            {/* View full details link */}
            <a 
              href={`/producto/${product.id}`}
              className="quick-view-details-link"
            >
              Ver todos los detalles →
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuickViewModal;
