// Service Worker for PWA - Offline support and caching
const CACHE_NAME = 'tiendita-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/manifest.json',
  '/logo-1474077935-1764604935-4c0177d9d0c8bc432cd6d792be4f1d171764604935-640-0.webp',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip API calls
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  
  // IMPORTANT: Skip JavaScript files to prevent caching Vite chunks
  // Vite chunks have hash-busting in their names, caching them causes
  // mixed-build issues that corrupt React
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.mjs')) {
    return;
  }
  
  // Skip TypeScript files (in dev mode)
  if (url.pathname.endsWith('.ts') || url.pathname.endsWith('.tsx')) {
    return;
  }
  
  // Skip source maps
  if (url.pathname.endsWith('.map')) {
    return;
  }

  // Only cache static assets (images, fonts, CSS, HTML)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        // Only cache successful responses for same-origin static assets
        if (networkResponse && networkResponse.ok && request.url.startsWith(self.location.origin)) {
          // Only cache specific file types (images, fonts, CSS)
          const contentType = networkResponse.headers.get('content-type') || '';
          const shouldCache = 
            contentType.includes('image/') ||
            contentType.includes('font/') ||
            contentType.includes('text/css') ||
            url.pathname.endsWith('.webp') ||
            url.pathname.endsWith('.png') ||
            url.pathname.endsWith('.jpg') ||
            url.pathname.endsWith('.svg') ||
            url.pathname.endsWith('.woff') ||
            url.pathname.endsWith('.woff2');
          
          if (shouldCache) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
        }
        return networkResponse;
      });
    })
  );
});

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'X Menos + Prendas';
  const options = {
    body: data.body || 'Novedades disponibles',
    icon: '/logo-1474077935-1764604935-4c0177d9d0c8bc432cd6d792be4f1d171764604935-640-0.webp',
    badge: '/logo-1474077935-1764604935-4c0177d9d0c8bc432cd6d792be4f1d171764604935-640-0.webp',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
