import { StoreState, StoreConfig, Category, Product, FAQItem, Banner, PromoCard, MenuLink, HomepageBlock, AIModel } from '../types';
import { defaultStoreState, saveToStorage } from '../data/defaultConfig';

// ============================================
// ACTION TYPES
// ============================================

export type StoreAction =
  | { type: 'SET_CONFIG'; payload: StoreConfig }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'SET_FAQS'; payload: FAQItem[] }
  | { type: 'ADD_FAQ'; payload: FAQItem }
  | { type: 'UPDATE_FAQ'; payload: FAQItem }
  | { type: 'DELETE_FAQ'; payload: string }
  | { type: 'SET_BANNERS'; payload: Banner[] }
  | { type: 'SET_PROMO_CARDS'; payload: PromoCard[] }
  | { type: 'SET_MENU_LINKS'; payload: MenuLink[] }
  | { type: 'SET_HOMEPAGE_BLOCKS'; payload: HomepageBlock[] }
  | { type: 'SET_AI_MODELS'; payload: AIModel[] }
  | { type: 'ADD_AI_MODEL'; payload: AIModel }
  | { type: 'UPDATE_AI_MODEL'; payload: AIModel }
  | { type: 'DELETE_AI_MODEL'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_ALL'; payload: Partial<StoreState> };

// ============================================
// REDUCER
// ============================================

export function storeReducer(state: StoreState, action: StoreAction): StoreState {
  let newState: StoreState;
  
  switch (action.type) {
    case 'SET_CONFIG':
      newState = { ...state, config: action.payload };
      break;
      
    case 'SET_CATEGORIES':
      newState = { ...state, categories: action.payload };
      break;
      
    case 'ADD_CATEGORY':
      newState = { ...state, categories: [...state.categories, action.payload] };
      break;
      
    case 'UPDATE_CATEGORY':
      newState = {
        ...state,
        categories: state.categories.map(c => 
          c.id === action.payload.id ? action.payload : c
        )
      };
      break;
      
    case 'DELETE_CATEGORY':
      newState = {
        ...state,
        categories: state.categories.filter(c => c.id !== action.payload)
      };
      break;
      
    case 'SET_PRODUCTS':
      newState = { ...state, products: action.payload };
      break;
      
    case 'ADD_PRODUCT':
      newState = { ...state, products: [...state.products, action.payload] };
      break;
      
    case 'UPDATE_PRODUCT':
      newState = {
        ...state,
        products: state.products.map(p => 
          p.id === action.payload.id ? action.payload : p
        )
      };
      break;
      
    case 'DELETE_PRODUCT':
      newState = {
        ...state,
        products: state.products.filter(p => p.id !== action.payload)
      };
      break;
      
    case 'SET_FAQS':
      newState = { ...state, faqs: action.payload };
      break;
      
    case 'ADD_FAQ':
      newState = { ...state, faqs: [...state.faqs, action.payload] };
      break;
      
    case 'UPDATE_FAQ':
      newState = {
        ...state,
        faqs: state.faqs.map(f => 
          f.id === action.payload.id ? action.payload : f
        )
      };
      break;
      
    case 'DELETE_FAQ':
      newState = {
        ...state,
        faqs: state.faqs.filter(f => f.id !== action.payload)
      };
      break;
      
    case 'SET_BANNERS':
      newState = { ...state, banners: action.payload };
      break;
      
    case 'SET_PROMO_CARDS':
      newState = { ...state, promoCards: action.payload };
      break;
      
    case 'SET_MENU_LINKS':
      newState = { ...state, menuLinks: action.payload };
      break;
      
    case 'SET_HOMEPAGE_BLOCKS':
      newState = { ...state, homepageBlocks: action.payload };
      break;
    
    case 'SET_AI_MODELS':
      newState = { ...state, aiModels: action.payload };
      break;
      
    case 'ADD_AI_MODEL':
      newState = { ...state, aiModels: [...(state.aiModels || []), action.payload] };
      break;
      
    case 'UPDATE_AI_MODEL':
      newState = {
        ...state,
        aiModels: (state.aiModels || []).map(m => 
          m.id === action.payload.id ? action.payload : m
        )
      };
      break;
      
    case 'DELETE_AI_MODEL':
      newState = {
        ...state,
        aiModels: (state.aiModels || []).filter(m => m.id !== action.payload)
      };
      break;
      
    case 'SET_LOADING':
      newState = { ...state, isLoading: action.payload };
      break;
      
    case 'LOAD_ALL':
      // Merge with defaults to ensure arrays are never null/undefined
      newState = {
        ...defaultStoreState,
        ...action.payload,
        categories: action.payload?.categories || defaultStoreState.categories || [],
        products: action.payload?.products || [],
        faqs: action.payload?.faqs || defaultStoreState.faqs || [],
        banners: action.payload?.banners || defaultStoreState.banners || [],
        promoCards: action.payload?.promoCards || defaultStoreState.promoCards || [],
        menuLinks: action.payload?.menuLinks || defaultStoreState.menuLinks || [],
        homepageBlocks: action.payload?.homepageBlocks || defaultStoreState.homepageBlocks || [],
        aiModels: action.payload?.aiModels || [],
      };
      break;
      
    default:
      return state;
  }
  
  // Guardar en sessionStorage automáticamente (except products - those come from API)
  const toSave = { ...newState, products: [] }; // Don't save products locally
  saveToStorage(toSave);
  return newState;
}
