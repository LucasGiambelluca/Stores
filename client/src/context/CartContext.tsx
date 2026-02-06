import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CartItem, Product } from '../types';
import { useAuth } from './AuthContext';
import { getStoreHeaders } from '../utils/storeDetection';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, size?: string, color?: string) => void;
  removeFromCart: (productId: string | number, size?: string, color?: string) => void;
  decrementFromCart: (productId: string | number, size?: string, color?: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  isCartOpen: boolean;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children?: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user } = useAuth();
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Generate or retrieve session ID for anonymous users
  const getSessionId = () => {
    let sessionId = localStorage.getItem('cart_session_id');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cart_session_id', sessionId);
    }
    return sessionId;
  };

  const cartTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Auto-save cart to backend
  useEffect(() => {
    // Debounce save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (items.length === 0) return;

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const sessionId = getSessionId();
        const storeHeaders = getStoreHeaders();
        
        await fetch('/api/cart/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...storeHeaders
          },
          body: JSON.stringify({
            items,
            total: cartTotal,
            email: user?.email || null,
            sessionId
          })
        });
      } catch (error) {
        console.error('Failed to save cart:', error);
      }
    }, 2000); // Save after 2 seconds of inactivity

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [items, user, cartTotal]);

  const addToCart = (product: Product, size?: string, color?: string) => {
    // Check stock if needed (optional)
    // const stock = product.stock ?? 100;
    
    const sizeKey = size || 'default';
    const colorKey = color || 'default';
    const availableStock = product.stock ?? 0;

    setItems(current => {
      // Find existing item with same ID, Size, AND Color
      const existing = current.find(item => 
        String(item.id) === String(product.id) && 
        item.size === sizeKey && 
        (item.color || 'default') === colorKey
      );
      
      if (existing) {
        if (existing.quantity >= availableStock) {
          alert(`No hay más stock disponible de ${product.name}`);
          return current;
        }
        return current.map(item =>
          (String(item.id) === String(product.id) && item.size === sizeKey && (item.color || 'default') === colorKey)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      if (availableStock < 1) {
        alert('Producto sin stock');
        return current;
      }
      
      return [...current, { ...product, id: String(product.id), quantity: 1, size: sizeKey, color: color }];
    });
    setIsCartOpen(true);
  };

  const decrementFromCart = (productId: string | number, size?: string, color?: string) => {
    const sizeKey = size || 'default';
    const colorKey = color || 'default';
    
    setItems(current => {
      const existing = current.find(item => 
        String(item.id) === String(productId) && 
        item.size === sizeKey &&
        (item.color || 'default') === colorKey
      );
      
      if (existing && existing.quantity > 1) {
        return current.map(item =>
          (String(item.id) === String(productId) && item.size === sizeKey && (item.color || 'default') === colorKey)
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      // Remove if quantity becomes 0
      return current.filter(item => !(
        String(item.id) === String(productId) && 
        item.size === sizeKey &&
        (item.color || 'default') === colorKey
      ));
    });
  };

  const removeFromCart = (productId: string | number, size?: string, color?: string) => {
    const sizeKey = size || 'default';
    const colorKey = color || 'default';
    
    setItems(current => current.filter(item => !(
      String(item.id) === String(productId) && 
      item.size === sizeKey &&
      (item.color || 'default') === colorKey
    )));
  };

  const clearCart = () => setItems([]);
  const toggleCart = () => setIsCartOpen(prev => !prev);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, decrementFromCart, clearCart, toggleCart, isCartOpen, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};