import React from 'react';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../../../context/CartContext';
import { useProducts } from '../../../context/StoreContext';
import { useStoreNavigate } from '../../../hooks/useStoreNavigate';
import { STORE_INFO } from '../../../constants';
import { SmartCartRecommendations } from '../../SmartCartRecommendations';

export const CartSidebar: React.FC = () => {
  const { isCartOpen, toggleCart, items, removeFromCart, decrementFromCart, cartTotal, addToCart } = useCart();
  const { products } = useProducts();
  const navigate = useStoreNavigate();

  const handleCheckout = () => {
    toggleCart();
    navigate('/checkout');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  };

  const transferPrice = Math.round(cartTotal * 0.85);
  const savings = cartTotal - transferPrice;
  const freeShippingRemaining = STORE_INFO.freeShippingFrom - cartTotal;

  return (
    <>
      {/* Overlay */}
      <div 
        className={`hm-cart-overlay ${isCartOpen ? 'open' : ''}`}
        onClick={toggleCart}
      />
      
      {/* Sidebar */}
      <aside className={`hm-cart-sidebar ${isCartOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="hm-cart-header">
          <h2 className="hm-cart-title">Carrito ({items.length})</h2>
          <button onClick={toggleCart} className="hm-cart-close">
            <X size={24} />
          </button>
        </div>

        {/* Free Shipping Progress */}
        {items.length > 0 && freeShippingRemaining > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-b">
            <p className="text-xs text-gray-600 mb-2">
              ¡Te faltan <span className="font-bold text-black">{formatPrice(freeShippingRemaining)}</span> para envío gratis!
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((cartTotal / STORE_INFO.freeShippingFrom) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {items.length > 0 && freeShippingRemaining <= 0 && (
          <div className="px-4 py-3 bg-green-50 border-b">
            <p className="text-sm text-green-700 font-medium text-center">
              ✓ ¡Envío gratis incluido!
            </p>
          </div>
        )}

        {/* Items */}
        <div className="hm-cart-items">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag size={48} className="text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">Tu carrito está vacío</p>
              <button 
                onClick={toggleCart} 
                className="text-sm font-medium underline underline-offset-4"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={`${item.id}-${item.size}`} className="hm-cart-item">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="hm-cart-item-image"
                />
                <div className="hm-cart-item-info">
                  <h3 className="hm-cart-item-name">{item.name}</h3>
                  <p className="hm-cart-item-details">Talle: {item.size}</p>
                  <p className="hm-cart-item-price">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-3">
                    <div className="hm-cart-item-qty">
                      <button 
                        className="hm-qty-btn"
                        onClick={() => decrementFromCart(item.id, item.size)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="hm-qty-value">{item.quantity}</span>
                      <button 
                        className="hm-qty-btn"
                        onClick={() => addToCart(item, item.size)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id, item.size)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Smart Recommendations */}
        {items.length > 0 && products.length > 0 && (
          <SmartCartRecommendations allProducts={products} maxItems={4} />
        )}

        {/* Footer */}
        {items.length > 0 && (
          <div className="hm-cart-footer">
            {/* Transfer Discount */}
            <div className="bg-green-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-green-700">
                <span className="font-bold">15% OFF</span> pagando con transferencia
              </p>
              <p className="text-lg font-bold text-green-700">
                {formatPrice(transferPrice)} <span className="text-xs font-normal">(ahorrás {formatPrice(savings)})</span>
              </p>
            </div>
            
            <div className="hm-cart-total">
              <span className="hm-cart-total-label">Total (tarjeta)</span>
              <span className="hm-cart-total-value">{formatPrice(cartTotal)}</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Envío calculado en el checkout
            </p>
            <button
              onClick={handleCheckout}
              className="hm-checkout-btn btn-premium"
            >
              Finalizar Compra
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default CartSidebar;
