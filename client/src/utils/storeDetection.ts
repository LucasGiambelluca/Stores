/**
 * Store Detection Utility
 * 
 * Detects which store to load based on:
 * 1. Query param: ?storeId=UUID or ?store=domain (development)
 * 2. Subdomain: domain.example.com (production)
 * 3. SessionStorage cache (isolated per tab for multi-store support)
 */

const STORE_DOMAIN_KEY = 'tiendita_store_domain';
const STORE_ID_KEY = 'tiendita_store_id';

/**
 * Get store ID from URL (UUID format)
 */
export function getStoreId(): string | null {
  // 1. Check query param first (development - from Mothership links)
  const urlParams = new URLSearchParams(window.location.search);
  const storeIdParam = urlParams.get('storeId');
  if (storeIdParam) {
    // Cache it for subsequent requests
    sessionStorage.setItem(STORE_ID_KEY, storeIdParam);
    return storeIdParam;
  }
  
  // 2. Check localStorage cache
  const cached = sessionStorage.getItem(STORE_ID_KEY);
  if (cached) {
    return cached;
  }
  
  return null;
}

/**
 * Get store domain from current URL
 */
export function getStoreDomain(): string | null {
  // 1. Check query param first (development)
  const urlParams = new URLSearchParams(window.location.search);
  const storeParam = urlParams.get('store');
  if (storeParam) {
    // Cache it for subsequent requests
    sessionStorage.setItem(STORE_DOMAIN_KEY, storeParam);
    return storeParam;
  }
  
  // 2. Check subdomain (production)
  const hostname = window.location.hostname;
  if (!hostname.includes('localhost') && !hostname.match(/^\d+\.\d+\.\d+\.\d+/)) {
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      const subdomain = parts[0];
      sessionStorage.setItem(STORE_DOMAIN_KEY, subdomain);
      return subdomain;
    }
  }
  
  // 3. Check localStorage cache
  const cached = sessionStorage.getItem(STORE_DOMAIN_KEY);
  if (cached) {
    return cached;
  }
  
  return null;
}

/**
 * Clear cached store info
 */
export function clearStoreDomain(): void {
  sessionStorage.removeItem(STORE_DOMAIN_KEY);
  sessionStorage.removeItem(STORE_ID_KEY);
}

/**
 * Set store domain manually
 */
export function setStoreDomain(domain: string): void {
  sessionStorage.setItem(STORE_DOMAIN_KEY, domain);
}

/**
 * Set store ID manually
 */
export function setStoreId(id: string): void {
  sessionStorage.setItem(STORE_ID_KEY, id);
}

/**
 * Get headers for API requests including store identification
 */
export function getStoreHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  
  // Priority: storeId > storeDomain
  const storeId = getStoreId();
  if (storeId) {
    headers['X-Store-Id'] = storeId;
  }
  
  const storeDomain = getStoreDomain();
  if (storeDomain) {
    headers['X-Store-Domain'] = storeDomain;
  }
  
  return headers;
}

/**
 * Build API URL with store query param (for development)
 */
export function buildApiUrl(path: string): string {
  const storeId = getStoreId();
  const storeDomain = getStoreDomain();
  const baseUrl = path.startsWith('/') ? path : `/${path}`;
  
  // In development, append store identifier as query param
  if (window.location.hostname === 'localhost') {
    const separator = baseUrl.includes('?') ? '&' : '?';
    
    // Priority: storeId > storeDomain
    if (storeId) {
      return `${baseUrl}${separator}storeId=${storeId}`;
    }
    if (storeDomain) {
      return `${baseUrl}${separator}store=${storeDomain}`;
    }
  }
  
  return baseUrl;
}


/**
 * Append storeId query param to a path
 */
export function appendStoreId(path: string): string {
  const storeId = getStoreId();
  if (!storeId) return path;
  
  // Don't append if already present
  if (path.includes('storeId=')) return path;
  
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}storeId=${storeId}`;
}
