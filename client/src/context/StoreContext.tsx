import React, { useReducer, useEffect, ReactNode, useCallback } from 'react';
import { 
  StoreState, StoreConfig, Category, Product, FAQItem, Banner, PromoCard, AIModel, MenuLink, HomepageBlock 
} from '../types';
import { defaultStoreState, loadFromStorage } from '../data/defaultConfig';
import { setStoreId } from '../utils/storeDetection';

// Import base context
import { StoreContext, StoreContextType } from './StoreContextBase';

// Import modular pieces
import { storeReducer, StoreAction } from './storeReducer';
import { 
  fetchInit,
  fetchProducts, 
  createCategoryApi,
  createProductApi,
  updateProductApi,
  deleteProductApi,
} from './storeApi';

// ============================================
// PROVIDER
// ============================================

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialState: StoreState = {
    ...defaultStoreState,
    products: []
  };
  
  const [state, dispatch] = useReducer(storeReducer, initialState);
  const [isLoadingProducts, setIsLoadingProducts] = React.useState(true);
  
  // Helper to convert init API response to StoreConfig format
  const parseInitToStoreConfig = (data: any): Partial<StoreConfig> => ({
    name: data.store?.name,
    storeType: data.store?.type,
    plan: data.store?.plan,
    email: data.store?.email,
    whatsapp: data.social?.whatsapp,
    instagram: data.social?.instagram ? `@${data.social.instagram}` : undefined,
    address: data.address?.street,
    city: data.address?.city,
    tagline: data.store?.slogan,
    logo: data.store?.logo,
    
    // Page Builder
    homepageBlocks: data.homepageBlocks,
    aboutBlocks: data.aboutBlocks,
    
    freeShippingFrom: data.store?.freeShippingFrom,
    transferDiscount: data.store?.transferDiscount,
    returnDays: data.store?.returnDays,
    installments: data.store?.installments,
    colors: {
      primary: data.theme?.primaryColor || defaultStoreState.config.colors.primary,
      secondary: data.theme?.secondaryColor || defaultStoreState.config.colors.secondary,
      accent: data.theme?.accentColor || defaultStoreState.config.colors.accent,
      accentHover: data.theme?.accentHoverColor || defaultStoreState.config.colors.accentHover,
      icon: data.theme?.iconColor,
      text: data.theme?.textColor,
      background: data.theme?.backgroundColor,
    },
    
    // AI Features
    aiTryOnEnabled: data.features?.aiTryOnEnabled,
  });
  
  // Load products from API (for refresh only)
  const refreshProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const products = await fetchProducts();
      dispatch({ type: 'SET_PRODUCTS', payload: products });
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);
  
  // Initialize data from preloaded init or API
  useEffect(() => {
    const init = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const storeIdParam = urlParams.get('storeId');
        
        if (storeIdParam) {
          setStoreId(storeIdParam);
        }

        // Use preloaded init data if available (from index.html)
        let initData = (window as any).__PRELOADED_INIT__;
        
        // Fallback: fetch if preload didn't complete
        if (!initData) {
          try {
            initData = await fetchInit();
          } catch (fetchError) {
            console.warn('[StoreContext] Init fetch failed:', fetchError);
          }
        }
        
        // Load saved session data (FAQs, etc.)
        const saved = loadFromStorage();

        // Check if initData is valid (not an error response)
        if (initData && !initData.error) {
          // Set storeId from init data if available
          if (initData.storeId && !storeIdParam) {
            setStoreId(initData.storeId);
          }
          
          // Use all preloaded data directly - no additional API calls needed!
          dispatch({ 
            type: 'LOAD_ALL', 
            payload: { 
              ...saved,
              config: { ...defaultStoreState.config, ...parseInitToStoreConfig(initData) },
              categories: initData.categories || [],
              banners: initData.banners || [],
              products: initData.products || [],
              homepageBlocks: (initData.homepageBlocks && initData.homepageBlocks.length > 0) 
                ? initData.homepageBlocks 
                : (saved?.homepageBlocks || defaultStoreState.homepageBlocks || [])
            } 
          });
        } else {
          // Fallback: use saved data or defaults (new/unconfigured store)
          console.log('[StoreContext] Using defaults for new store');
          dispatch({ 
            type: 'LOAD_ALL', 
            payload: saved || defaultStoreState
          });
        }
      } catch (error) {
        console.error('[StoreContext] Init error:', error);
        // Use defaults on any error
        dispatch({ 
          type: 'LOAD_ALL', 
          payload: defaultStoreState
        });
      } finally {
        setIsLoadingProducts(false);
      }
    };
    
    // Small delay to ensure preload has time to complete
    const timer = setTimeout(init, 50);
    return () => clearTimeout(timer);
  }, []);
  
  
  // Apply colors as CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    const colors = state.config.colors;
    
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-accent-hover', colors.accentHover);
    
    if (colors.text) root.style.setProperty('--color-text', colors.text);
    if (colors.icon) root.style.setProperty('--color-icon', colors.icon);
    if (colors.background) root.style.setProperty('--color-background', colors.background);
  }, [state.config.colors]);
  
  // Update document title and favicon
  useEffect(() => {
    document.title = state.config.name || 'Tienda';
    
    if (state.config.logo) {
      const existingFavicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (existingFavicon) {
        existingFavicon.href = state.config.logo;
      } else {
        const newFavicon = document.createElement('link');
        newFavicon.rel = 'icon';
        newFavicon.type = 'image/x-icon';
        newFavicon.href = state.config.logo;
        document.head.appendChild(newFavicon);
      }
      
      const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
      if (appleTouchIcon) {
        appleTouchIcon.href = state.config.logo;
      }
    }
  }, [state.config.name, state.config.logo]);
  
  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  
  const updateConfig = (config: Partial<StoreConfig>) => {
    dispatch({ type: 'SET_CONFIG', payload: { ...state.config, ...config } });
  };
  
  const addCategory = async (category: Category) => {
    try {
      const finalCategory = await createCategoryApi(category);
      dispatch({ type: 'ADD_CATEGORY', payload: finalCategory });
      return finalCategory;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  };
  
  const updateCategory = (category: Category) => {
    dispatch({ type: 'UPDATE_CATEGORY', payload: category });
  };
  
  const deleteCategory = (id: string) => {
    dispatch({ type: 'DELETE_CATEGORY', payload: id });
  };
  
  const addProduct = async (product: Product) => {
    const createdProduct = await createProductApi(product);
    dispatch({ type: 'ADD_PRODUCT', payload: createdProduct });
  };
  
  const updateProduct = async (product: Product) => {
    try {
      await updateProductApi(product);
      dispatch({ type: 'UPDATE_PRODUCT', payload: product });
    } catch (error) {
      console.error('Error updating product:', error);
      dispatch({ type: 'UPDATE_PRODUCT', payload: product });
    }
  };
  
  const deleteProduct = async (id: string) => {
    try {
      await deleteProductApi(id);
      dispatch({ type: 'DELETE_PRODUCT', payload: id });
    } catch (error) {
      console.error('Error deleting product:', error);
      dispatch({ type: 'DELETE_PRODUCT', payload: id });
    }
  };
  
  const addFAQ = (faq: FAQItem) => dispatch({ type: 'ADD_FAQ', payload: faq });
  const updateFAQ = (faq: FAQItem) => dispatch({ type: 'UPDATE_FAQ', payload: faq });
  const deleteFAQ = (id: string) => dispatch({ type: 'DELETE_FAQ', payload: id });
  
  const updateBanners = (banners: Banner[]) => dispatch({ type: 'SET_BANNERS', payload: banners });
  const updatePromoCards = (cards: PromoCard[]) => dispatch({ type: 'SET_PROMO_CARDS', payload: cards });
  const updateMenuLinks = (links: MenuLink[]) => dispatch({ type: 'SET_MENU_LINKS', payload: links });
  const updateHomepageBlocks = (blocks: HomepageBlock[]) => dispatch({ type: 'SET_HOMEPAGE_BLOCKS', payload: blocks });
  
  const addAIModel = (model: AIModel) => dispatch({ type: 'ADD_AI_MODEL', payload: model });
  const updateAIModel = (model: AIModel) => dispatch({ type: 'UPDATE_AI_MODEL', payload: model });
  const deleteAIModel = (id: string) => dispatch({ type: 'DELETE_AI_MODEL', payload: id });
  
  const resetToDefaults = async () => {
    sessionStorage.removeItem('tienda_store_data');
    dispatch({ type: 'LOAD_ALL', payload: { ...defaultStoreState, products: [] } });
    await refreshProducts();
  };
  
  const value: StoreContextType = {
    state,
    dispatch,
    updateConfig,
    addCategory,
    updateCategory,
    deleteCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    refreshProducts,
    addFAQ,
    updateFAQ,
    deleteFAQ,
    updateBanners,
    updatePromoCards,
    updateMenuLinks,
    updateHomepageBlocks,
    addAIModel,
    updateAIModel,
    deleteAIModel,
    resetToDefaults,
    isLoadingProducts
  };
  
  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};

// Re-export base context and hook
export { StoreContext, useStore } from './StoreContextBase';

// Re-export specialized hooks for convenience
export { 
  useStoreConfig,
  useCategories,
  useProducts,
  useFAQs,
  useBanners,
  usePromoCards,
  useMenuLinks,
  useHomepageBlocks,
  useProductPageConfig,
} from './storeHooks';
