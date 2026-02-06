import { StoreConfig, Category, FAQItem, Banner, PromoCard, MenuLink, HomepageBlock, StoreState } from '../types';

// ============================================
// CONFIGURACIÓN POR DEFECTO - TIENDA TEMPLATE
// Estos son valores genéricos que se deben personalizar
// ============================================

export const defaultStoreConfig: StoreConfig = {
  name: 'LimeStoreNew',
  storeType: 'retail',
  plan: 'free',
  logo: '',
  tagline: 'Tu tienda online',
  
  // Contacto
  email: '',
  whatsapp: '',
  instagram: '',
  address: '',
  city: '',
  
  // Promociones
  freeShippingFrom: 100000,
  transferDiscount: '10%',
  installments: 3,
  returnDays: 30,
  
  // Colores de marca - LimeStore palette
  colors: {
    primary: '#111111',      // Onyx Black
    secondary: '#f4f4f4',    // Silver Mist
    accent: '#66FF00',       // Cyber Lime
    accentHover: '#52CC00',
    text: '#111111',
    icon: '#66FF00',
    background: '#ffffff',
  },
  
  // Métodos de pago
  paymentMethods: [
    'Mercado Pago',
    'Tarjetas de crédito',
    'Tarjetas de débito',
    'Transferencia bancaria'
  ],
  
  // Fuentes
  fonts: {
    heading: 'Montserrat',
    body: 'Montserrat',
  }
};

export const defaultCategories: Category[] = [];

export const defaultFAQs: FAQItem[] = [
  {
    id: 'faq-1',
    question: '¿Cómo hago una compra?',
    answer: `<ol>
      <li>Explorá los productos y seleccioná lo que te gusta.</li>
      <li>Elegí el talle y hacé clic en <strong>Agregar al carrito</strong>.</li>
      <li>Completá tus datos y elegí el método de envío.</li>
      <li>Seleccioná el medio de pago y confirmá tu compra.</li>
    </ol>`,
    category: 'compras',
    order: 1,
    isActive: true
  },
  {
    id: 'faq-2',
    question: '¿Cuáles son los métodos de pago?',
    answer: `<p>Aceptamos Mercado Pago, tarjetas de crédito/débito y transferencia bancaria.</p>`,
    category: 'pagos',
    order: 2,
    isActive: true
  },
  {
    id: 'faq-3',
    question: '¿Cómo funcionan los envíos?',
    answer: `<p>Enviamos a todo el país. El tiempo de entrega varía según la localidad.</p>`,
    category: 'envios',
    order: 3,
    isActive: true
  }
];

export const defaultBanners: Banner[] = [
  {
    id: 'banner-1',
    image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920',
    title: 'Bienvenidos',
    subtitle: 'Configurá tu tienda desde el panel de administración',
    buttonText: 'Ver productos',
    buttonLink: '#productos',
    order: 1,
    isActive: true
  }
];

export const defaultPromoCards: PromoCard[] = [];

// Default menu links (empty = use categories as menu)
export const defaultMenuLinks: MenuLink[] = [];

// Default homepage blocks
export const defaultHomepageBlocks: HomepageBlock[] = [
  {
    id: 'block-hero',
    type: 'hero-slider',
    order: 1,
    isActive: true,
    title: 'Hero Slider',
    config: { useBanners: true }
  },
  {
    id: 'block-features',
    type: 'features',
    order: 2,
    isActive: true,
    title: 'Features Bar',
    config: {
      items: [
        { icon: 'Truck', title: 'Envíos', subtitle: 'A todo el país' },
        { icon: 'CreditCard', title: 'Cuotas', subtitle: 'Sin interés' },
        { icon: 'Shield', title: 'Compra segura', subtitle: 'Protección al comprador' },
        { icon: 'RefreshCcw', title: 'Devoluciones', subtitle: '30 días' },
      ]
    }
  },
  {
    id: 'block-products',
    type: 'product-grid',
    order: 3,
    isActive: true,
    title: 'Productos',
    config: { title: 'Nuestros Productos', filter: 'all', showFilters: true }
  }
];

// Estado inicial completo
export const defaultStoreState: StoreState = {
  config: defaultStoreConfig,
  categories: defaultCategories,
  products: [],
  faqs: defaultFAQs,
  banners: defaultBanners,
  promoCards: defaultPromoCards,
  menuLinks: defaultMenuLinks,
  aiModels: [],
  homepageBlocks: defaultHomepageBlocks,
  isLoading: false
};

// ============================================
// UTILIDADES DE PERSISTENCIA (sessionStorage - isolated per tab)
// ============================================

const STORAGE_KEY = 'tienda_store_data';

export const saveToStorage = (state: Partial<StoreState>): void => {
  try {
    const existing = loadFromStorage();
    const merged = { ...existing, ...state };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (error) {
    console.error('Error saving to sessionStorage:', error);
  }
};

export const loadFromStorage = (): StoreState | null => {
  try {
    const data = sessionStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading from sessionStorage:', error);
    return null;
  }
};

export const clearStorage = (): void => {
  sessionStorage.removeItem(STORAGE_KEY);
};
