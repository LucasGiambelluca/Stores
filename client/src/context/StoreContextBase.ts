import React, { createContext, useContext } from 'react';
import { 
  StoreState, StoreConfig, Category, Product, FAQItem, Banner, PromoCard, AIModel, MenuLink, HomepageBlock 
} from '../types';
import { StoreAction } from './storeReducer';

// ============================================
// CONTEXT TYPE
// ============================================

export interface StoreContextType {
  state: StoreState;
  dispatch: React.Dispatch<StoreAction>;
  
  // Config helpers
  updateConfig: (config: Partial<StoreConfig>) => void;
  
  // Category helpers
  addCategory: (category: Category) => Promise<Category>;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  
  // Product helpers
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  refreshProducts: () => Promise<void>;
  
  // FAQ helpers
  addFAQ: (faq: FAQItem) => void;
  updateFAQ: (faq: FAQItem) => void;
  deleteFAQ: (id: string) => void;
  
  // Banner helpers
  updateBanners: (banners: Banner[]) => void;
  updatePromoCards: (cards: PromoCard[]) => void;
  
  // Menu helpers
  updateMenuLinks: (links: MenuLink[]) => void;
  
  // Homepage blocks helpers
  updateHomepageBlocks: (blocks: HomepageBlock[]) => void;
  
  // AI Model helpers
  addAIModel: (model: AIModel) => void;
  updateAIModel: (model: AIModel) => void;
  deleteAIModel: (id: string) => void;
  
  // Utility
  resetToDefaults: () => void;
  
  // Loading state
  isLoadingProducts: boolean;
}

export const StoreContext = createContext<StoreContextType | undefined>(undefined);

// ============================================
// MAIN HOOK
// ============================================

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
