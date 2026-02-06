import { useStore } from './StoreContextBase';
import { defaultHomepageBlocks } from '../data/defaultConfig';

// ============================================
// SPECIALIZED HOOKS
// ============================================

export const useStoreConfig = () => {
  const { state, updateConfig } = useStore();
  return { config: state.config, updateConfig };
};

export const useCategories = () => {
  const { state, addCategory, updateCategory, deleteCategory } = useStore();
  const categories = state.categories || [];
  return { 
    categories: categories.filter(c => c.isActive).sort((a, b) => a.order - b.order),
    allCategories: categories,
    addCategory, 
    updateCategory, 
    deleteCategory 
  };
};

export const useProducts = () => {
  const { state, addProduct, updateProduct, deleteProduct, refreshProducts, isLoadingProducts } = useStore();
  return { 
    products: state.products,
    isLoading: isLoadingProducts,
    addProduct, 
    updateProduct, 
    deleteProduct,
    refreshProducts
  };
};

export const useFAQs = () => {
  const { state, addFAQ, updateFAQ, deleteFAQ } = useStore();
  const faqs = state.faqs || [];
  return { 
    faqs: faqs.filter(f => f.isActive).sort((a, b) => a.order - b.order),
    allFAQs: faqs,
    addFAQ, 
    updateFAQ, 
    deleteFAQ 
  };
};

export const useBanners = () => {
  const { state, updateBanners } = useStore();
  const banners = state.banners || [];
  return { 
    banners: banners.filter(b => b.isActive).sort((a, b) => a.order - b.order),
    allBanners: banners,
    updateBanners 
  };
};

export const usePromoCards = () => {
  const { state, updatePromoCards } = useStore();
  const promoCards = state.promoCards || [];
  return { 
    promoCards: promoCards.filter(p => p.isActive).sort((a, b) => a.order - b.order),
    allPromoCards: promoCards,
    updatePromoCards 
  };
};

export const useMenuLinks = () => {
  const { state, updateMenuLinks } = useStore();
  return { 
    menuLinks: (state.menuLinks || []).filter(m => m.isActive).sort((a, b) => a.order - b.order),
    allMenuLinks: state.menuLinks || [],
    updateMenuLinks 
  };
};

export const useHomepageBlocks = () => {
  const { state, updateHomepageBlocks } = useStore();
  // Only fallback to defaults if homepageBlocks is undefined (never loaded)
  // If it's an empty array, the user intentionally deleted all blocks
  const blocks = state.homepageBlocks !== undefined ? state.homepageBlocks : defaultHomepageBlocks;
  
  return { 
    blocks: blocks.filter((b: any) => b.isActive).sort((a: any, b: any) => a.order - b.order),
    allBlocks: blocks,
    updateHomepageBlocks 
  };
};

// ============================================
// PRODUCT PAGE BUILDER HOOK
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_PRODUCT_BLOCKS } from '../data/defaultProductBlocks';
import { getStoreHeaders } from '../utils/storeDetection';

// Get API URL from environment or fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

import { 
  ProductWidgetType, 
  ProductPageBlock, 
  PlanLevel,
  WIDGET_PLAN_REQUIREMENTS,
  LayoutConfig,
  ProductPageConfig
} from '../types';

// ... (existing imports)

/**
 * Hook for fetching and managing product page builder configuration.
 * Includes caching and plan-based access checking.
 */
export const useProductPageConfig = () => {
  const { state } = useStore();
  const [config, setConfig] = useState<ProductPageConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get store plan from config
  const storePlan: PlanLevel = (state.config.plan as PlanLevel) || 'free';

  // Fetch config from API
  const fetchConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/product-page-config?t=${Date.now()}`, {
        headers: {
          ...getStoreHeaders(),
          'Authorization': `Bearer ${sessionStorage.getItem('token') || ''}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product page config');
      }

      const data = await response.json();
      setConfig(data);
    } catch (err) {
      console.warn('[useProductPageConfig] Error:', err);
      // Use defaults on error
      setConfig({
        id: null,
        storeId: sessionStorage.getItem('tiendita_store_id') || '',
        blocks: DEFAULT_PRODUCT_BLOCKS,
        globalStyles: {},
        isEnabled: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Check if a widget is available in the current plan
  const canUseWidget = useCallback((widgetType: string): boolean => {
    const PLAN_HIERARCHY: Record<PlanLevel, number> = {
      free: 0,
      starter: 1,
      pro: 2,
      enterprise: 3,
    };
    
    const requiredPlan = WIDGET_PLAN_REQUIREMENTS[widgetType as keyof typeof WIDGET_PLAN_REQUIREMENTS] || 'free';
    return PLAN_HIERARCHY[storePlan] >= PLAN_HIERARCHY[requiredPlan];
  }, [storePlan]);

  // Get active blocks sorted by order - always enabled if blocks exist
  const activeBlocks = config?.blocks
    ? config.blocks
        .filter(b => b.isActive)
        .sort((a, b) => a.order - b.order)
    : null;

  // Whether custom layout is enabled and configured
  const isCustomLayoutEnabled = activeBlocks && activeBlocks.length > 0;

  return {
    config,
    isLoading,
    error,
    storePlan,
    canUseWidget,
    activeBlocks,
    isCustomLayoutEnabled,
    refetch: fetchConfig,
  };
};

