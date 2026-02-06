/**
 * ProductBuyBox Widget
 * 
 * The core conversion component: price display, size/color selection, 
 * quantity picker, and add to cart functionality.
 * Extracted from ProductDetail.tsx for use with the Product Page Builder.
 * 
 * @plan free - Available to all plans
 */

import React, { useState } from 'react';
import { useStoreNavigate } from '../../hooks/useStoreNavigate';
import { ShoppingCart, Heart, Banknote, CreditCard, Ruler, Sparkles } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useStoreConfig } from '../../context/StoreContext';
import { useToast } from '../Toast';
import { SavingsBadge } from '../ProductIndicators';
import { STORE_INFO } from '../../constants';

interface ProductBuyBoxProps {
  product: Product;
  buttonStyle?: 'solid' | 'outline' | 'ghost';
  showWishlistButton?: boolean;
  showWhatsAppButton?: boolean;
  showBuyNowButton?: boolean;
  showTryOnButton?: boolean;
  sticky?: boolean;
  accentColor?: string;
  onSizeGuideClick?: () => void;
  onTryOnClick?: () => void;
  selectedBundle?: any;
  onSelectBundle?: (bundle: any) => void;
}

export const ProductBuyBox: React.FC<ProductBuyBoxProps> = ({
  product,
  buttonStyle = 'solid',
  showWishlistButton = true,
  showWhatsAppButton = true,
  showBuyNowButton = true,
  showTryOnButton = true,
  sticky = false,
  accentColor,
  onSizeGuideClick,
  onTryOnClick,
  selectedBundle,
  onSelectBundle,
}) => {
  const navigate = useStoreNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { config } = useStoreConfig();
  const { showCartToast } = useToast();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(
    Array.isArray(product.colors) && product.colors.length > 0
      ? (typeof product.colors[0] === 'string' ? product.colors[0] : product.colors[0].name)
      : null
  );
  const [quantity, setQuantity] = useState(1);
  const [showSizeError, setShowSizeError] = useState(false);

  // Sync quantity with selected bundle
  React.useEffect(() => {
    if (selectedBundle) {
      setQuantity(selectedBundle.quantity);
    }
  }, [selectedBundle]);

  const handleQuantityChange = (newQuantity: number) => {
    const q = Math.max(1, newQuantity);
    setQuantity(q);
    // Deselect bundle if quantity changes manually
    if (selectedBundle && q !== selectedBundle.quantity) {
      onSelectBundle?.(null);
    }
  };

  const isWishlisted = isInWishlist(String(product.id));

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleAddToCart = () => {
    const hasSizes = product.sizes && product.sizes.length > 0;
    if (hasSizes && !selectedSize) {
      setShowSizeError(true);
      return;
    }
    setShowSizeError(false);
    for (let i = 0; i < quantity; i++) {
      addToCart(product as any, selectedSize || undefined, selectedColor || undefined);
    }
    showCartToast(product.name);
  };

  const handleBuyNow = () => {
    const hasSizes = product.sizes && product.sizes.length > 0;
    if (hasSizes && !selectedSize) {
      setShowSizeError(true);
      return;
    }
    setShowSizeError(false);
    for (let i = 0; i < quantity; i++) {
      addToCart(product as any, selectedSize || undefined, selectedColor || undefined);
    }
    navigate('/checkout');
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Hola! Me interesa el producto: ${product.name}\n` +
      `Precio: ${formatPrice(product.price)}\n` +
      `Talle: ${selectedSize || 'Por definir'}\n` +
      `Color: ${selectedColor || 'Por definir'}\n` +
      `Link: ${window.location.href}`
    );
    window.open(`https://wa.me/${STORE_INFO.whatsapp.replace('+', '')}?text=${message}`, '_blank');
  };

  const handleWishlistToggle = () => {
    if (isWishlisted) {
      removeFromWishlist(String(product.id));
    } else {
      addToWishlist(product as any);
    }
  };

  // Button style variants
  const getButtonClass = (variant: 'primary' | 'secondary' | 'accent') => {
    const base = 'w-full py-4 px-6 font-semibold flex items-center justify-center gap-2 transition-all';
    
    if (variant === 'primary') {
      if (buttonStyle === 'outline') return `${base} border-2 border-black text-black hover:bg-black hover:text-white`;
      if (buttonStyle === 'ghost') return `${base} bg-transparent text-black hover:bg-gray-100`;
      return `${base} bg-black text-white hover:bg-gray-800`; // solid
    }
    
    if (variant === 'accent') {
      return `${base} bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700`;
    }
    
    return `${base} bg-green-500 text-white hover:bg-green-600`; // whatsapp
  };

  const containerClass = sticky
    ? 'sticky top-4 bg-white p-4 rounded-xl shadow-lg border border-gray-100'
    : '';

  // Calculate display price (with bundle discount)
  const displayPrice = selectedBundle 
    ? product.price * (1 - selectedBundle.discount / 100)
    : product.price;

  return (
    <div className={`product-buy-box-widget ${containerClass}`}>
      {/* Prices */}
      <div className="mb-6">
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-3xl font-bold">{formatPrice(displayPrice)}</span>
          {(product.originalPrice || selectedBundle) && (
            <>
              <span className="text-lg text-gray-400 line-through">
                {formatPrice(product.originalPrice || product.price)}
              </span>
              {selectedBundle ? (
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                  -{selectedBundle.discount}% PACK
                </span>
              ) : (
                <SavingsBadge originalPrice={product.originalPrice} currentPrice={product.price} />
              )}
            </>
          )}
        </div>

        {product.transferPrice && !selectedBundle && (
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
              {product.installments} cuotas sin interés de {formatPrice(Math.round(displayPrice / product.installments))}
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
            {product.colors.map((color, index) => {
              const colorName = typeof color === 'string' ? color : color.name;
              return (
                <button
                  key={index}
                  onClick={() => setSelectedColor(colorName)}
                  className={`px-4 py-2 border text-sm transition-all ${
                    selectedColor === colorName
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 hover:border-black'
                  }`}
                >
                  {colorName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selection */}
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
          {onSizeGuideClick && (
            <button
              onClick={onSizeGuideClick}
              className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              <Ruler size={16} />
              ¿No sabés tu talle? Calculalo
            </button>
          )}
        </div>
      )}

      {/* Quantity */}
      <div className="mb-6">
        <p className="text-sm font-semibold mb-3">Cantidad</p>
        <div className="flex items-center border border-gray-300 w-fit">
          <button
            onClick={() => handleQuantityChange(quantity - 1)}
            className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            -
          </button>
          <span className="w-12 h-12 flex items-center justify-center font-medium">
            {quantity}
          </span>
          <button
            onClick={() => handleQuantityChange(quantity + 1)}
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
          className={`flex-1 ${getButtonClass('primary')}`}
        >
          <ShoppingCart size={20} />
          Agregar al Carrito
        </button>
        {showWishlistButton && (
          <button
            onClick={handleWishlistToggle}
            className={`w-14 h-14 border flex items-center justify-center transition-all ${
              isWishlisted
                ? 'bg-red-50 border-red-500 text-red-500'
                : 'border-gray-300 hover:border-black'
            }`}
          >
            <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      {/* Virtual Try-On Button - Only for Retail stores with AI enabled */}
      {showTryOnButton && config.storeType === 'retail' && config.aiTryOnEnabled && onTryOnClick && (
        <button
          onClick={onTryOnClick}
          className="w-full py-4 rounded-xl font-bold border-2 border-purple-500 text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-2 group mb-4"
        >
          <Sparkles size={20} className="group-hover:animate-pulse" />
          Probar en mí (IA)
        </button>
      )}

      {/* Buy Now Button */}
      {showBuyNowButton && (
        <button
          onClick={handleBuyNow}
          className={`${getButtonClass('accent')} mb-4`}
        >
          ⚡ Comprar Ahora
        </button>
      )}

      {/* WhatsApp Button */}
      {showWhatsAppButton && (
        <button
          onClick={handleWhatsApp}
          className={getButtonClass('secondary')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Consultar por WhatsApp
        </button>
      )}
    </div>
  );
};

export default ProductBuyBox;
