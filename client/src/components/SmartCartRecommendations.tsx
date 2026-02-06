import React, { useMemo } from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useToast } from './Toast';
import { Plus, Sparkles } from 'lucide-react';

interface SmartCartRecommendationsProps {
  allProducts: Product[];
  maxItems?: number;
}

export const SmartCartRecommendations: React.FC<SmartCartRecommendationsProps> = ({
  allProducts,
  maxItems = 4,
}) => {
  const { items, addToCart } = useCart();
  const { showCartToast } = useToast();

  // Get recommended products based on cart contents
  const recommendations = useMemo(() => {
    if (items.length === 0 || allProducts.length === 0) return [];

    // Get categories of items in cart
    const cartCategories = new Set(items.map(item => item.category));
    const cartSubcategories = new Set(items.map(item => item.subcategory).filter(Boolean));
    const cartProductIds = new Set(items.map(item => item.id));

    // Score products for recommendation
    const scoredProducts = allProducts
      .filter(product => !cartProductIds.has(product.id)) // Exclude already in cart
      .filter(product => product.stock !== undefined ? product.stock > 0 : true) // In stock
      .map(product => {
        let score = 0;

        // Same category = higher score
        if (cartCategories.has(product.category)) score += 2;
        
        // Same subcategory = even higher
        if (product.subcategory && cartSubcategories.has(product.subcategory)) score += 3;
        
        // On sale = bonus
        if (product.isOnSale || product.discountPercent) score += 1;
        
        // New arrivals = slight bonus
        if (product.isNew) score += 0.5;
        
        // Best sellers = bonus
        if (product.isBestSeller) score += 1;

        // Lower price items as impulse buys
        const avgCartPrice = items.reduce((sum, i) => sum + i.price, 0) / items.length;
        if (product.price < avgCartPrice * 0.5) score += 1;

        // Random factor for variety
        score += Math.random() * 0.5;

        return { product, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, maxItems)
      .map(item => item.product);

    return scoredProducts;
  }, [items, allProducts, maxItems]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleQuickAdd = (product: Product) => {
    addToCart(product);
    showCartToast(product.name);
  };

  if (recommendations.length === 0) return null;

  return (
    <div className="smart-recommendations">
      <div className="smart-recommendations-header">
        <Sparkles size={16} className="smart-recommendations-icon" />
        <span>Completá tu compra</span>
      </div>
      
      <div className="smart-recommendations-grid">
        {recommendations.map(product => (
          <div key={product.id} className="smart-rec-card">
            <img 
              src={product.image} 
              alt={product.name}
              className="smart-rec-image"
              loading="lazy"
            />
            <div className="smart-rec-info">
              <p className="smart-rec-name">{product.name}</p>
              <p className="smart-rec-price">{formatPrice(product.price)}</p>
            </div>
            <button 
              onClick={() => handleQuickAdd(product)}
              className="smart-rec-add-btn"
              aria-label={`Agregar ${product.name} al carrito`}
            >
              <Plus size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmartCartRecommendations;
