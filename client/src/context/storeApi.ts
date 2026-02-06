import { Product, Category, StoreConfig } from '../types';
import { getStoreHeaders } from '../utils/storeDetection';
import { PRODUCTS } from '../constants';
import { defaultStoreState } from '../data/defaultConfig';

// ============================================
// API CONFIGURATION
// ============================================

// Use environment variable for API URL in production, fallback to proxy in dev
export const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ============================================
// FETCH HELPERS
// ============================================

/**
 * Fetch with store headers for multi-tenant support
 */
export async function fetchWithStore(url: string, options: RequestInit = {}): Promise<Response> {
  const storeHeaders = getStoreHeaders();
  const headers = {
    ...storeHeaders,
    ...options.headers,
  };
  return fetch(url, { ...options, headers });
}

// ============================================
// DATA FETCHING
// ============================================

export async function fetchInit() {
  try {
    // Add timestamp to prevent caching
    const response = await fetchWithStore(`${API_BASE}/init?t=${Date.now()}`);
    if (!response.ok) throw new Error('Failed to fetch init data');
    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch init data:', error);
    return { error: true };
  }
}


export async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await fetchWithStore(`${API_BASE}/products?t=${Date.now()}`);
    if (!response.ok) throw new Error('Error fetching products');
    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.warn('Failed to fetch products from API, using local data:', error);
    return PRODUCTS as Product[];
  }
}

export async function fetchConfig(storeParam?: string | null, storeIdParam?: string | null): Promise<StoreConfig | null> {
  try {
    let configUrl = `${API_BASE}/config`;
    const params = new URLSearchParams();
    if (storeParam) params.set('store', storeParam);
    if (storeIdParam) params.set('storeId', storeIdParam);
    params.set('t', String(Date.now()));
    if (params.toString()) configUrl += `?${params.toString()}`;
    
    const response = await fetchWithStore(configUrl);
    
    if (!response.ok) return null;
    
    const apiConfig = await response.json();
    
    return {
      ...defaultStoreState.config,
      name: apiConfig.store?.name || defaultStoreState.config.name,
      storeType: apiConfig.store?.type || defaultStoreState.config.storeType,
      plan: apiConfig.store?.plan || defaultStoreState.config.plan,
      email: apiConfig.store?.email || defaultStoreState.config.email,
      whatsapp: apiConfig.social?.whatsapp || defaultStoreState.config.whatsapp,
      instagram: apiConfig.social?.instagram ? `@${apiConfig.social.instagram}` : defaultStoreState.config.instagram,
      address: apiConfig.address?.street || defaultStoreState.config.address,
      city: apiConfig.address?.city || defaultStoreState.config.city,
      tagline: apiConfig.store?.slogan || defaultStoreState.config.tagline,
      logo: apiConfig.store?.logo || defaultStoreState.config.logo,
      freeShippingFrom: apiConfig.store?.freeShippingFrom || defaultStoreState.config.freeShippingFrom,
      transferDiscount: apiConfig.store?.transferDiscount || defaultStoreState.config.transferDiscount,
      returnDays: apiConfig.store?.returnDays || defaultStoreState.config.returnDays,
      installments: apiConfig.store?.installments || defaultStoreState.config.installments,
      paymentMethods: apiConfig.paymentMethods || defaultStoreState.config.paymentMethods,
      colors: {
        primary: apiConfig.theme?.primaryColor || defaultStoreState.config.colors.primary,
        secondary: apiConfig.theme?.secondaryColor || defaultStoreState.config.colors.secondary,
        accent: apiConfig.theme?.accentColor || defaultStoreState.config.colors.accent,
        accentHover: apiConfig.theme?.accentHoverColor || defaultStoreState.config.colors.accentHover,
        icon: apiConfig.theme?.iconColor,
        text: apiConfig.theme?.textColor,
        background: apiConfig.theme?.backgroundColor,
      },
      // Page Builder Maps
      homepageBlocks: apiConfig.homepageBlocks || defaultStoreState.config.homepageBlocks,
      aboutBlocks: apiConfig.aboutBlocks || defaultStoreState.config.aboutBlocks,
      // Return storeId for use in setStoreId
      _storeId: apiConfig.store?.id,
    } as StoreConfig & { _storeId?: string };
  } catch (error) {
    console.warn('Could not fetch API config:', error);
    return null;
  }
}

export async function fetchCategories(storeParam?: string | null, storeIdParam?: string | null): Promise<Category[]> {
  try {
    let catUrl = `${API_BASE}/categories`;
    const params = new URLSearchParams();
    if (storeParam) params.set('store', storeParam);
    if (storeIdParam) params.set('storeId', storeIdParam);
    params.set('t', String(Date.now()));
    if (params.toString()) catUrl += `?${params.toString()}`;
    
    const catResponse = await fetchWithStore(catUrl);
    if (catResponse.ok) {
      const catData = await catResponse.json();
      return catData.categories || [];
    }
    return [];
  } catch (error) {
    console.warn('Could not fetch API categories:', error);
    return [];
  }
}

export async function fetchBanners(): Promise<any[]> {
  try {
    const response = await fetchWithStore(`${API_BASE}/banners?t=${Date.now()}`);
    if (response.ok) {
      const data = await response.json();
      // Transform from DB format to client format
      return (data.banners || []).map((b: any) => ({
        id: b.id,
        image: b.image,
        title: b.title || '',
        subtitle: b.subtitle || '',
        buttonText: b.buttonText || '',
        buttonLink: b.buttonLink || '',
        order: b.orderNum ?? 0,
        isActive: b.isActive ?? true,
      }));
    }
    return [];
  } catch (error) {
    console.warn('Could not fetch API banners:', error);
    return [];
  }
}

// ============================================
// CRUD OPERATIONS
// ============================================

export async function createCategoryApi(category: Category): Promise<Category> {
  const token = sessionStorage.getItem('token');
  
  const response = await fetchWithStore(`${API_BASE}/admin/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      order: category.order,
      isActive: category.isActive,
      isAccent: category.isAccent,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al crear categoría');
  }
  
  const data = await response.json();
  return { ...category, id: data.category?.id || category.id };
}

export async function createProductApi(product: Product): Promise<Product> {
  const token = sessionStorage.getItem('token');
  
  if (!token) {
    throw new Error('Debés iniciar sesión como administrador para agregar productos');
  }
  
  const response = await fetchWithStore(`${API_BASE}/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      transferPrice: product.transferPrice,
      categoryId: product.category,
      image: product.image,
      images: product.images,
      sizes: product.sizes,
      colors: product.colors,
      stock: product.stock,
      isBestSeller: product.isBestSeller,
      isNew: product.isNew,
      isOnSale: product.isOnSale,
      variantsStock: product.variantsStock,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error al crear producto (${response.status})`);
  }
  
  const data = await response.json();
  return { ...product, id: data.product?.id || product.id };
}

export async function updateProductApi(product: Product): Promise<void> {
  const token = sessionStorage.getItem('token');
  
  const response = await fetchWithStore(`${API_BASE}/admin/products/${product.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      transferPrice: product.transferPrice,
      categoryId: product.category,
      image: product.image,
      images: product.images,
      sizes: product.sizes,
      colors: product.colors,
      stock: product.stock,
      isBestSeller: product.isBestSeller,
      isNew: product.isNew,
      isOnSale: product.isOnSale,
      variantsStock: product.variantsStock,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update product');
  }
}

export async function deleteProductApi(id: string): Promise<void> {
  const token = sessionStorage.getItem('token');
  
  const response = await fetchWithStore(`${API_BASE}/admin/products/${id}`, {
    method: 'DELETE',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete product');
  }
}

export async function saveStoreConfig(config: any): Promise<void> {
  const token = sessionStorage.getItem('token');
  
  if (!token) throw new Error('Authentication required for saving config');
  
  const response = await fetchWithStore(`${API_BASE}/admin/config`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(config),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to save configuration');
  }
}
