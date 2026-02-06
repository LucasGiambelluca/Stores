// ============================================
// TIPOS CENTRALIZADOS - X Menos + Prendas
// ============================================

// Configuración de la Tienda
export interface StoreConfig {
  name: string;
  storeType: 'retail' | 'gastronomy' | 'service';
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  logo: string;
  tagline: string;
  email: string;
  whatsapp: string;
  instagram: string;
  address: string;
  city: string;
  freeShippingFrom: number;
  transferDiscount: string;
  installments: number;
  returnDays: number;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    accentHover: string;
    text?: string;      // Color de texto principal
    icon?: string;      // Color de iconos
    background?: string; // Color de fondo
  };
  paymentMethods: string[];
  // About page content
  aboutTitle?: string;
  aboutContent?: string;
  aboutImage?: string;
  // Fonts configuration
  fonts?: {
    heading: string;  // Font for titles/headings
    body: string;     // Font for body text
  };
  // Floating buttons configuration
  showWhatsAppButton?: boolean;
  showDarkModeToggle?: boolean;
  
  // Marketing & Analytics
  facebookPixelId?: string;
  
  // AI Features
  aiTryOnEnabled?: boolean;  // True if store has HuggingFace API key configured
  
  // Page Builder blocks
  homepageBlocks?: HomepageBlock[];
  aboutBlocks?: HomepageBlock[];
}

// Subcategorías
export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

// Categorías
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  order: number;
  isActive: boolean;
  isAccent?: boolean;
  productCount?: number;
  subcategories?: Subcategory[];
}

// Productos
export interface Product {
  id: string | number;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  transferPrice?: number;
  category: string;
  subcategory: string;
  image: string;
  images?: string[];
  sizes: string[];
  colors?: string[] | ProductColor[];
  stock?: number;
  variantsStock?: Record<string, number>; // Stock per color variant e.g. {"Red": 5, "Blue": 2}
  stockStatus?: string;
  installments?: number;
  isBestSeller?: boolean;
  isNew?: boolean;
  isOnSale?: boolean;
  order?: number;
  url?: string;
  attributes?: Record<string, string>; // For ProductSpecs widget
}

export interface ProductColor {
  name: string;
  hex: string;
}

// FAQs
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'compras' | 'pagos' | 'envios' | 'general';
  icon?: string;
  order: number;
  isActive: boolean;
}

// Banners/Sliders
export interface Banner {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  order: number;
  isActive: boolean;
}

// Promo Section
export interface PromoCard {
  id: string;
  type: 'large' | 'small';
  title: string;
  subtitle?: string;
  badge?: string;
  image: string;
  buttonText?: string;
  buttonLink?: string;
  order: number;
  isActive: boolean;
}

// Menu Links for Navigation
export interface MenuLink {
  id: string;
  label: string;
  url: string;
  type: 'internal' | 'external' | 'category';
  categorySlug?: string;
  order: number;
  isActive: boolean;
  openInNewTab?: boolean;
}

// AI Models for Virtual Try-On
export interface AIModel {
  id: string;
  name: string;
  image: string;
  type: 'female' | 'male';
  bodyType?: string;
  order: number;
  isActive: boolean;
}

// ============================================
// HOMEPAGE PAGE BUILDER
// ============================================

export type BlockType = 
  | 'hero-slider' 
  | 'banner' 
  | 'promo-cards' 
  | 'product-grid' 
  | 'categories' 
  | 'features'
  | 'text-block'
  | 'image-banner'
  | 'countdown'
  | 'bestsellers'
  | 'social-feed'
  | 'popup'
  | 'newsletter'
  | 'video-hero'
  | 'premium_hero'
  | 'map'                // Google Maps embed (Pro/Enterprise)
  // Layout blocks - flexible containers
  | 'two-column'        // 50/50 split
  | 'three-column'      // 33/33/33 split
  | 'asymmetric-left'   // 33/66 split (left smaller)
  | 'asymmetric-right'; // 66/33 split (right smaller)

// ============================================
// PRODUCT PAGE BUILDER
// ============================================

export type ProductWidgetType = 
  // Core widgets (all plans)
  | 'product-gallery'        // Galería de imágenes
  | 'product-info'           // Nombre, precio, badges
  | 'product-buy-box'        // Selector + botón de compra
  | 'product-description'    // Descripción del producto
  // Standard widgets (Starter+)
  | 'product-reviews'        // Reviews de clientes
  | 'related-products'       // Productos relacionados
  | 'product-specs'          // Especificaciones técnicas
  // Premium widgets (Pro+)
  | 'product-banner'         // Banner promocional
  | 'product-countdown'      // Temporizador de oferta
  | 'product-size-guide'     // Guía de talles
  // Enterprise widgets
  | 'product-video'          // Video embed
  | 'product-custom-html'    // HTML/JS personalizado
  | 'product-3d-viewer'      // Visor 3D
  | 'product-bundles'        // Packs de descuento (x2, x3)
  | 'product-cross-sell';    // Productos complementarios

export type PlanLevel = 'free' | 'starter' | 'pro' | 'enterprise';

export interface ProductPageBlock {
  id: string;
  type: ProductWidgetType;
  order: number;
  isActive: boolean;
  requiredPlan: PlanLevel;
  config: Record<string, any>;
}

export interface ProductPageStyles {
  accentColor?: string;
  buttonStyle?: 'solid' | 'outline' | 'ghost';
  galleryLayout?: 'grid' | 'carousel' | 'stack';
  showBreadcrumbs?: boolean;
  stickyBuyBox?: boolean;
  imageRatio?: '1:1' | '3:4' | '4:3' | '16:9';
}

// Layout configuration for Product Page Builder grid
export type GridLayoutType = 'classic' | 'full-width' | 'gallery-left' | 'gallery-right';

export interface LayoutConfig {
  gridType: GridLayoutType;
  leftColumn: string[];   // Block IDs for left column
  rightColumn: string[];  // Block IDs for right column
  fullWidth: string[];    // Block IDs for full-width section (below grid)
}

// Widget plan requirements mapping
export const WIDGET_PLAN_REQUIREMENTS: Record<ProductWidgetType, PlanLevel> = {
  'product-gallery': 'free',
  'product-info': 'free',
  'product-buy-box': 'free',
  'product-description': 'free',
  'product-reviews': 'starter',
  'related-products': 'starter',
  'product-specs': 'starter',
  'product-banner': 'pro',
  'product-countdown': 'pro',
  'product-size-guide': 'pro',
  'product-bundles': 'pro',
  'product-cross-sell': 'pro',
  'product-video': 'enterprise',
  'product-custom-html': 'enterprise',
  'product-3d-viewer': 'enterprise',
};

export interface HeroSliderConfig {
  useBanners: boolean; // Use existing banners
}

export interface BannerConfig {
  image: string;
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  overlayColor?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface ProductGridConfig {
  title: string;
  filter?: 'all' | 'bestsellers' | 'new' | 'sale';
  limit?: number;
  showFilters?: boolean;
}

export interface TextBlockConfig {
  content: string; // HTML content
  backgroundColor?: string;
  textColor?: string;
  padding?: string;
}

export interface ImageBannerConfig {
  image: string;
  link?: string;
  alt?: string;
  height?: string;
}

export interface CountdownConfig {
  endDate: string;
  title: string;
  subtitle?: string;
  backgroundColor?: string;
}

export interface FeaturesConfig {
  items: {
    icon: string;
    title: string;
    subtitle?: string;
  }[];
}

// NEW: Popup configuration for promotions and newsletter
export interface PopupConfig {
  // Content
  image?: string;
  title: string;
  subtitle?: string;
  description?: string;
  
  // Type
  popupType: 'promo' | 'newsletter' | 'announcement' | 'custom';
  
  // Call to Action
  buttonText?: string;
  buttonLink?: string;
  showEmailInput?: boolean;
  emailPlaceholder?: string;
  submitButtonText?: string;
  successMessage?: string;
  
  // Appearance
  size?: 'small' | 'medium' | 'large';
  position?: 'center' | 'bottom-right' | 'bottom-left';
  overlayColor?: string;
  backgroundColor?: string;
  
  // Trigger settings
  trigger: 'immediate' | 'delay' | 'exit-intent' | 'scroll';
  delaySeconds?: number;
  scrollPercent?: number;
  
  // Display rules
  showOnce?: boolean; // Once per session
  showOncePerDay?: boolean; // Once per day (cookie)
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
  
  // Pages where popup should appear (empty = all pages)
  targetPages?: string[];
}

export interface HomepageBlock {
  id: string;
  type: BlockType;
  order: number;
  isActive: boolean;
  title?: string; // Display name in admin
  config: Record<string, any>;
}

// Estado global de la tienda
export interface StoreState {
  config: StoreConfig;
  categories: Category[];
  products: Product[];
  faqs: FAQItem[];
  banners: Banner[];
  promoCards: PromoCard[];
  menuLinks: MenuLink[];
  aiModels: AIModel[];
  homepageBlocks: HomepageBlock[];
  isLoading: boolean;
}

// Acciones del Context
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
  | { type: 'SET_AI_MODELS'; payload: AIModel[] }
  | { type: 'SET_HOMEPAGE_BLOCKS'; payload: HomepageBlock[] }
  | { type: 'ADD_AI_MODEL'; payload: AIModel }
  | { type: 'UPDATE_AI_MODEL'; payload: AIModel }
  | { type: 'DELETE_AI_MODEL'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_ALL'; payload: StoreState };

// ============================================
// TIPOS HEREDADOS (compatibilidad)
// ============================================

// Cart Item - extends Product con info de carrito
export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size: string;
  color?: string;
}

// Shipping Details
export interface ShippingDetails {
  fullName: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  paymentMethod: 'mercadopago' | 'transfer' | 'credit_card' | 'debit_card';
}

// Store Info (legacy - use StoreConfig instead)
export interface StoreInfo {
  name: string;
  url: string;
  location: string;
  whatsapp: string;
  email: string;
  instagram: string;
  returnDays: number;
  freeShippingFrom: number;
  paymentMethods: string[];
  installments: number;
  transferDiscount: string;
}


export interface ProductPageConfig {
  id: string | null;
  storeId: string;
  blocks: ProductPageBlock[];
  globalStyles: {
    accentColor?: string;
    buttonStyle?: 'solid' | 'outline' | 'ghost';
    galleryLayout?: 'grid' | 'carousel' | 'stack';
    showBreadcrumbs?: boolean;
    stickyBuyBox?: boolean;
    imageRatio?: '1:1' | '3:4' | '4:3' | '16:9';
  };
  layoutConfig?: LayoutConfig;
  isEnabled: boolean;
}