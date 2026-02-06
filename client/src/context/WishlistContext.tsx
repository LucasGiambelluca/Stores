import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../types';
import { getStoreId } from '../utils/storeDetection';

interface WishlistContextType {
  items: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string | number) => void;
  isInWishlist: (productId: string | number) => boolean;
  clearWishlist: () => void;
  recentlyViewed: Product[];
  addToRecentlyViewed: (product: Product) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

// Use store ID in keys for isolation
const getWishlistKey = () => {
  const storeId = getStoreId() || 'default';
  return `wishlist_${storeId}`;
};

const getRecentlyViewedKey = () => {
  const storeId = getStoreId() || 'default';
  return `recently_viewed_${storeId}`;
};

const MAX_RECENTLY_VIEWED = 10;

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  // Load from sessionStorage on mount
  useEffect(() => {
    const savedWishlist = sessionStorage.getItem(getWishlistKey());
    const savedRecent = sessionStorage.getItem(getRecentlyViewedKey());
    
    if (savedWishlist) {
      try {
        setItems(JSON.parse(savedWishlist));
      } catch (e) {
        console.error('Error loading wishlist:', e);
      }
    }
    
    if (savedRecent) {
      try {
        setRecentlyViewed(JSON.parse(savedRecent));
      } catch (e) {
        console.error('Error loading recently viewed:', e);
      }
    }
  }, []);

  // Save to sessionStorage on change
  useEffect(() => {
    sessionStorage.setItem(getWishlistKey(), JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    sessionStorage.setItem(getRecentlyViewedKey(), JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  const addToWishlist = (product: Product) => {
    setItems(prev => {
      if (prev.some(p => String(p.id) === String(product.id))) {
        return prev;
      }
      return [...prev, product];
    });
  };

  const removeFromWishlist = (productId: string | number) => {
    setItems(prev => prev.filter(p => String(p.id) !== String(productId)));
  };

  const isInWishlist = (productId: string | number): boolean => {
    return items.some(p => String(p.id) === String(productId));
  };

  const clearWishlist = () => {
    setItems([]);
  };

  const addToRecentlyViewed = (product: Product) => {
    setRecentlyViewed(prev => {
      // Remove if already exists
      const filtered = prev.filter(p => String(p.id) !== String(product.id));
      // Add to front and limit
      return [product, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
    });
  };

  return (
    <WishlistContext.Provider value={{
      items,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      clearWishlist,
      recentlyViewed,
      addToRecentlyViewed,
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
