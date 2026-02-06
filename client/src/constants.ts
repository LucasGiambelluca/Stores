import { Product, StoreInfo } from './types';

// Store Information
export const STORE_INFO: StoreInfo = {
  name: "X MENOS + PRENDAS",
  url: "https://xmenosmasprendas.com",
  location: "Bahía Blanca, Argentina",
  whatsapp: "+5492914474435",
  email: "xmenosmasprendasbb@gmail.com",
  instagram: "@xmenosmasprendas",
  returnDays: 15,
  freeShippingFrom: 200000,
  paymentMethods: [
    "Mercado Pago",
    "Tarjetas de Crédito",
    "Tarjetas de Débito",
    "Transferencia Bancaria",
    "Efectivo"
  ],
  installments: 6,
  transferDiscount: "15%"
};

export const HERO_SLIDES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=2000",
    title: "Nueva Temporada",
    subtitle: "Remeras y básicos con hasta 15% OFF"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=2000",
    title: "Mayorista + Minorista",
    subtitle: "Los mejores precios de Bahía Blanca"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2000",
    title: "15% OFF Transferencia",
    subtitle: "Pagá con transferencia y ahorrá más"
  }
];

// Imágenes públicas de Unsplash que funcionan
const IMG = {
  // Remeras blancas
  remera_blanca_1: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
  remera_blanca_2: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800",
  remera_blanca_3: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800",
  // Remeras negras/estampadas
  remera_negra_1: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800",
  remera_negra_2: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=800",
  remera_print_1: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800",
  remera_print_2: "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800",
  remera_oversize: "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=800",
  // Mangas cero / tank tops
  tank_1: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800",
  tank_2: "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800",
  tank_3: "https://images.unsplash.com/photo-1517635676447-3a480fbfd8f2?w=800",
  // Bermudas / shorts
  short_1: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800",
  short_2: "https://images.unsplash.com/photo-1598522325074-042db73aa4e6?w=800",
  short_cargo: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800",
  // Musculosas
  muscle_1: "https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=800",
  muscle_2: "https://images.unsplash.com/photo-1618517351616-38fb9c5210c6?w=800",
};

// Productos completos con múltiples imágenes
export const PRODUCTS: Product[] = [
  // === REMERAS ===
  {
    id: 1,
    name: "Remera SJ",
    price: 13640,
    originalPrice: 16047,
    discountPercent: 15,
    transferPrice: 11594,
    category: "ROPA",
    subcategory: "Remeras",
    image: IMG.remera_blanca_1,
    images: [IMG.remera_blanca_1, IMG.remera_blanca_2, IMG.remera_negra_1],
    colors: ["Negro", "Blanco"],
    sizes: ["M", "L", "XL"],
    stockStatus: "Última",
    installments: 6,
    description: "Remera SJ: la pieza clave para cualquier outfit. Diseñada para complementar y elevar tu estilo con facilidad. Su tejido suave y cómodo garantiza una sensación agradable durante todo el día.",
    isNew: true,
    isBestSeller: true
  },
  {
    id: 2,
    name: "Remera Boxy Fit",
    price: 14630,
    originalPrice: 17218,
    discountPercent: 15,
    transferPrice: 12435,
    category: "ROPA",
    subcategory: "Remeras",
    image: IMG.remera_blanca_2,
    images: [IMG.remera_blanca_2, IMG.remera_blanca_3],
    colors: ["Blanco"],
    sizes: ["M", "L", "XL"],
    stockStatus: "Última",
    installments: 6,
    description: "Remera Boxy Fit: un corte clásico con estilo moderno. Perfecta para cualquier ocasión.",
    isNew: true
  },
  {
    id: 3,
    name: "Remera La Dolce Vita 16.1",
    price: 13090,
    originalPrice: 15400,
    discountPercent: 15,
    transferPrice: 11126,
    category: "ROPA",
    subcategory: "Remeras",
    image: IMG.remera_blanca_3,
    images: [IMG.remera_blanca_3, IMG.remera_blanca_1],
    colors: ["Blanco"],
    sizes: ["S", "M", "L", "XL"],
    stockStatus: "Última",
    installments: 6,
    description: "Remera La Dolce Vita 16.1: disfrutá la buena vida con esta remera de diseño clásico.",
    isBestSeller: true
  },
  {
    id: 4,
    name: "Remera Sea y Sun",
    price: 13090,
    transferPrice: 11126,
    discountPercent: 15,
    category: "ROPA",
    subcategory: "Remeras",
    image: IMG.remera_print_1,
    images: [IMG.remera_print_1, IMG.remera_print_2],
    colors: ["Blanco", "Celeste"],
    sizes: ["M", "L", "XL"],
    stockStatus: "Última",
    installments: 6,
    description: "Remera Sea y Sun: el estilo del verano en una prenda. Perfecta para días de playa.",
    isNew: true
  },
  {
    id: 5,
    name: "Remera Over Club 1994",
    price: 15400,
    transferPrice: 13090,
    discountPercent: 15,
    category: "ROPA",
    subcategory: "Remeras",
    image: IMG.remera_oversize,
    images: [IMG.remera_oversize, IMG.remera_negra_2],
    colors: ["Negro", "Blanco"],
    sizes: ["M", "L", "XL"],
    stockStatus: "Última",
    installments: 6,
    description: "Remera Over Club 1994: estilo retro con un toque moderno."
  },
  {
    id: 6,
    name: "Remera Over",
    price: 15400,
    transferPrice: 13090,
    discountPercent: 15,
    category: "ROPA",
    subcategory: "Remeras",
    image: IMG.remera_negra_1,
    images: [IMG.remera_negra_1, IMG.remera_negra_2, IMG.remera_oversize],
    colors: ["Negro"],
    sizes: ["M", "L", "XL"],
    stockStatus: "3 en stock",
    installments: 6,
    isBestSeller: true
  },
  {
    id: 7,
    name: "Remera Tom y Jerry",
    price: 14200,
    transferPrice: 12070,
    discountPercent: 15,
    category: "ROPA",
    subcategory: "Remeras",
    image: IMG.remera_print_2,
    images: [IMG.remera_print_2, IMG.remera_print_1],
    colors: ["Blanco"],
    sizes: ["M", "L", "XL"],
    stockStatus: "Última",
    installments: 6,
    description: "Remera Tom y Jerry: nostalgia y estilo en una sola prenda."
  },
  {
    id: 8,
    name: "Remera Batik",
    price: 14200,
    transferPrice: 12070,
    discountPercent: 15,
    category: "ROPA",
    subcategory: "Remeras",
    image: IMG.remera_negra_2,
    images: [IMG.remera_negra_2, IMG.remera_print_1, IMG.remera_print_2],
    colors: ["Multicolor"],
    sizes: ["M", "L", "XL"],
    stockStatus: "Última",
    installments: 6,
    description: "Remera Batik: un diseño único con estampado artesanal.",
    isNew: true
  },
  
  // === MANGAS CERO ===
  {
    id: 9,
    name: "Manga Cero Lisa 16.1",
    price: 14190,
    originalPrice: 16694,
    discountPercent: 15,
    transferPrice: 12061,
    category: "ROPA",
    subcategory: "Mangas Cero",
    image: IMG.tank_1,
    images: [IMG.tank_1, IMG.tank_2, IMG.tank_3],
    colors: ["Blanco", "Negro"],
    sizes: ["S", "M", "L", "XL"],
    stockStatus: "2 en stock",
    installments: 6,
    description: "Manga Cero Lisa 16.1: un básico reinventado para el verano. Comodidad y estilo en un solo producto.",
    isBestSeller: true,
    isNew: true
  },
  {
    id: 10,
    name: "Manga Cero DWMYH 16.1",
    price: 14190,
    transferPrice: 12061,
    discountPercent: 15,
    category: "ROPA",
    subcategory: "Mangas Cero",
    image: IMG.tank_2,
    images: [IMG.tank_2, IMG.tank_1],
    colors: ["Negro"],
    sizes: ["M", "L", "XL"],
    stockStatus: "Última",
    installments: 6,
    description: "Manga Cero DWMYH: el complemento perfecto para el verano."
  },
  {
    id: 11,
    name: "Manga Cero London Skate",
    price: 14190,
    transferPrice: 12061,
    discountPercent: 15,
    category: "ROPA",
    subcategory: "Mangas Cero",
    image: IMG.tank_3,
    images: [IMG.tank_3, IMG.tank_1, IMG.tank_2],
    colors: ["Blanco"],
    sizes: ["M", "L", "XL"],
    stockStatus: "Última",
    installments: 6,
    description: "Manga Cero London Skate Jam: estilo urbano y fresco."
  },
  
  // === BERMUDAS ===
  {
    id: 12,
    name: "Bermuda Batik",
    price: 15000,
    transferPrice: 12750,
    discountPercent: 15,
    category: "ROPA",
    subcategory: "Bermudas",
    image: IMG.short_1,
    images: [IMG.short_1, IMG.short_2, IMG.short_cargo],
    colors: ["Multicolor"],
    sizes: ["M", "L", "XL"],
    stockStatus: "Última",
    installments: 6,
    description: "Bermuda Batik: estampado único para destacar en verano.",
    isNew: true
  },
  {
    id: 13,
    name: "Bermuda Cargo",
    price: 16500,
    transferPrice: 14025,
    discountPercent: 15,
    category: "ROPA",
    subcategory: "Bermudas",
    image: IMG.short_cargo,
    images: [IMG.short_cargo, IMG.short_1, IMG.short_2],
    colors: ["Beige", "Negro", "Verde"],
    sizes: ["M", "L", "XL", "XXL"],
    installments: 6,
    description: "Bermuda Cargo: práctica y con estilo. Ideal para el día a día.",
    isBestSeller: true
  },
  
  // === MUSCULOSAS ===
  {
    id: 14,
    name: "Musculosa Algodón Rayada",
    price: 7700,
    transferPrice: 6545,
    discountPercent: 15,
    category: "ROPA",
    subcategory: "Musculosas",
    image: IMG.muscle_1,
    images: [IMG.muscle_1, IMG.muscle_2],
    colors: ["Blanco/Negro", "Blanco/Azul"],
    sizes: ["S", "M", "L"],
    stockStatus: "Última",
    installments: 6,
    description: "Musculosa de Algodón Rayada: fresca y cómoda para el verano."
  },
  {
    id: 15,
    name: "Musculosa Deportiva",
    price: 8500,
    transferPrice: 7225,
    discountPercent: 15,
    category: "ROPA",
    subcategory: "Musculosas",
    image: IMG.muscle_2,
    images: [IMG.muscle_2, IMG.muscle_1],
    colors: ["Negro", "Gris", "Blanco"],
    sizes: ["S", "M", "L", "XL"],
    installments: 6,
    description: "Musculosa Deportiva: ideal para entrenar o para un look casual.",
    isNew: true
  }
];

// Categories with images for CategorySection
export const PRODUCT_CATEGORIES = [
  { 
    id: 'remeras', 
    name: 'Remeras', 
    image: IMG.remera_blanca_1,
    count: PRODUCTS.filter(p => p.subcategory === 'Remeras').length 
  },
  { 
    id: 'mangas-cero', 
    name: 'Mangas Cero', 
    image: IMG.tank_1,
    count: PRODUCTS.filter(p => p.subcategory === 'Mangas Cero').length 
  },
  { 
    id: 'bermudas', 
    name: 'Bermudas', 
    image: IMG.short_1,
    count: PRODUCTS.filter(p => p.subcategory === 'Bermudas').length 
  },
  { 
    id: 'musculosas', 
    name: 'Musculosas', 
    image: IMG.muscle_1,
    count: PRODUCTS.filter(p => p.subcategory === 'Musculosas').length 
  }
];

// Get unique subcategories
export const SUBCATEGORIES = [...new Set(PRODUCTS.map(p => p.subcategory).filter(Boolean))];