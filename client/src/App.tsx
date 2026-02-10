import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { StoreLink as Link } from './components/StoreLink';
import { CartProvider } from './context/CartContext';
import { StoreProvider, useProducts, useHomepageBlocks } from './context/StoreContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { CouponProvider } from './context/CouponContext';
import { StoreConfigProvider } from './context/StoreConfigContext';
import { ToastProvider } from './components/Toast';
import { Navbar, Footer } from './components/Layout';
import { HeroSlider, FeaturesSection, CategorySection, PromoSection } from './components/HeroSlider';
import { ProductGrid } from './components/ProductComponents';
import { BlockRenderer } from './components/blocks/BlockRenderer';
import { ProductDetail } from './components/ProductDetail';
import { API_BASE } from './context/storeApi';
import { CartSidebar } from './components/CartSidebar';
import { CheckoutForm } from './components/CheckoutForm';
import { WhatsAppButton } from './components/WhatsAppButton';
import { ThemeToggle } from './components/ThemeToggle';
import { FAQPage } from './components/FAQPage';
import { AdminLoginPage } from './components/auth/AuthModal';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PoliticasDevolucion } from './components/PoliticasDevolucion';
import { TerminosCondiciones } from './components/TerminosCondiciones';
import { CatalogPage } from './components/CatalogPage';
import { AboutPage } from './components/AboutPage';
import { WishlistPage } from './components/WishlistPage';
import OrderTracking from './components/OrderTracking';
import { UserOrders } from './components/UserOrders';
import ActivationModal from './components/activation/ActivationModal';
import { useActivation } from './hooks/useActivation';
import { StorefrontSkeleton } from './components/StorefrontSkeleton';

// ============================================
// LAZY LOADED ADMIN COMPONENTS (~40% bundle reduction)
// Only loaded when user navigates to admin routes
// ============================================
const AdminDashboard = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminDashboard })));
const AdminProducts = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminProducts })));
const AdminOrders = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminOrders })));
const AdminCustomers = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminCustomers })));
const AdminSettings = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminSettings })));
const AdminReports = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminReports })));
const AdminCategories = lazy(() => import('./components/admin/CategoriesEditor').then(m => ({ default: m.AdminCategories })));
const AdminFAQs = lazy(() => import('./components/admin/FAQEditor').then(m => ({ default: m.AdminFAQs })));
const AdminBanners = lazy(() => import('./components/admin/BannersEditor').then(m => ({ default: m.AdminBanners })));
const AdminAIModels = lazy(() => import('./components/admin/AdminAIModels').then(m => ({ default: m.AdminAIModels })));
const AdminMenuEditor = lazy(() => import('./components/admin/AdminMenuEditor').then(m => ({ default: m.AdminMenuEditor })));
const AdminPromoCards = lazy(() => import('./components/admin/AdminPromoCards').then(m => ({ default: m.AdminPromoCards })));
const PageBuilder = lazy(() => import('./components/admin/PageBuilder').then(m => ({ default: m.PageBuilder })));
const ProductPageBuilder = lazy(() => import('./components/admin/ProductPageBuilder').then(m => ({ default: m.ProductPageBuilder })));
const AdminAboutEditor = lazy(() => import('./components/admin/AdminAboutEditor').then(m => ({ default: m.AdminAboutEditor })));
const AdminShipping = lazy(() => import('./components/admin/AdminShipping').then(m => ({ default: m.AdminShipping })));
const AdminShipmentManager = lazy(() => import('./components/admin/AdminShipmentManager').then(m => ({ default: m.AdminShipmentManager })));
const AdminPayments = lazy(() => import('./components/admin/AdminPayments').then(m => ({ default: m.AdminPayments })));
const AdminStockManager = lazy(() => import('./components/admin/AdminStockManager').then(m => ({ default: m.default })));
const AdminPoliciesEditor = lazy(() => import('./components/admin/AdminPoliciesEditor').then(m => ({ default: m.AdminPoliciesEditor })));
const AdminCoupons = lazy(() => import('./components/admin/AdminCoupons').then(m => ({ default: m.AdminCoupons })));

// Loading Spinner with LimeStore branding (matches index.html)
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#111111' }}>
    <img 
      src="/limestore-logo.png" 
      alt="Loading" 
      className="w-16 h-16"
      style={{ animation: 'pulse-spin 2s ease-in-out infinite' }}
    />
    <p className="mt-6 text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>
      Cargando...
    </p>
    <style>{`
      @keyframes pulse-spin {
        0% { transform: rotate(0deg) scale(1); opacity: 1; }
        50% { transform: rotate(180deg) scale(1.05); opacity: 0.8; }
        100% { transform: rotate(360deg) scale(1); opacity: 1; }
      }
    `}</style>
  </div>
);

// Scroll to top on route change
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  
  return null;
};

// Home Page Component - Uses dynamic blocks from Page Builder
const HomePage: React.FC = () => {
  const { blocks } = useHomepageBlocks();
  
  console.log('HomePage rendering, blocks:', blocks);

  useEffect(() => {
    if (window.location.hash.includes('productos')) {
      setTimeout(() => {
        const el = document.getElementById('productos');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
      <Navbar onMenuClick={() => {}} />
      
      <main className="flex-grow">
        {blocks && blocks.length > 0 ? (
          blocks.map((block) => (
            <BlockRenderer key={block.id} block={block} />
          ))
        ) : (
          // Empty state when no blocks are configured
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="text-6xl mb-4">🏪</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Tu tienda está lista!</h2>
            <p className="text-gray-600 mb-6 max-w-md">
              Empezá a agregar productos y personalizar tu tienda desde el panel de administración.
            </p>
            <Link
              to="/admin/productos"
              className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              ➕ Agregar productos
            </Link>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

// 404 Page Component
const NotFoundPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-[#1a1a1a] mb-4">404</h1>
      <p className="text-gray-600 mb-6">Página no encontrada</p>
      <Link 
        to="/" 
        className="inline-block bg-[#E5B800] text-[#1a1a1a] px-6 py-3 rounded font-semibold hover:bg-[#D4A900]"
      >
        Volver al inicio
      </Link>
    </div>
  </div>
);

// Setup Wizard (lazy loaded) - Using the full-featured multi-step wizard
import { SetupWizard } from './components/setup/SetupWizard';
// import { SetupWizard } from './components/setup/TestWizard';
// const SetupWizard = lazy(() => import('./components/setup/SetupWizard'));
const LockedScreen = lazy(() => import('./components/LockedScreen').then(m => ({ default: m.default })));

// App Content - Uses preloaded init data for instant load
const AppContent: React.FC = () => {
  const [isConfigured, setIsConfigured] = React.useState<boolean | null>(null);
  const [isLocked, setIsLocked] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showActivationModal, setShowActivationModal] = React.useState(false);
  const [licenseActivated, setLicenseActivated] = React.useState(false);
  const [storeNotFound, setStoreNotFound] = React.useState(false);

  React.useEffect(() => {
    const init = async () => {
      try {
        // Use preloaded data if available (from index.html script)
        let initData = (window as any).__PRELOADED_INIT__;
        
        // Fallback: fetch if preload didn't complete
        if (!initData) {
          const urlParams = new URLSearchParams(window.location.search);
          let storeId = urlParams.get('storeId');
          const store = urlParams.get('store');

          // Recover from session if not in URL
          if (!storeId && !store) {
            storeId = sessionStorage.getItem('tiendita_store_id');
            console.log('[App] Recovered storeId from session:', storeId);
          }
          
          // DIRECT PRODUCT LINK DETECTION
          // If no storeId and we're on a product page, fetch the product first to get its storeId
          if (!storeId && !store) {
            const productMatch = window.location.pathname.match(/^\/producto\/([a-f0-9-]+)$/i);
            if (productMatch) {
              const productId = productMatch[1];
              console.log('[App] Direct product link detected, fetching storeId from product:', productId);
              
              try {
                const productResponse = await fetch(`${API_BASE}/products/${productId}`);
                if (productResponse.ok) {
                  const productData = await productResponse.json();
                  if (productData.storeId) {
                    storeId = productData.storeId;
                    sessionStorage.setItem('tiendita_store_id', storeId);
                    console.log('[App] Got storeId from product:', storeId);
                  }
                }
              } catch (e) {
                console.warn('[App] Failed to fetch product for storeId detection:', e);
              }
            }
          }
          
          let initUrl = '/api/init';
          if (storeId) initUrl += `?storeId=${storeId}`;
          else if (store) initUrl += `?store=${store}`;
          
          console.log('[App] Fetching init data from:', initUrl);
          const response = await fetch(initUrl);
          
          // Handle 404 - Store not found
          if (response.status === 404) {
            const errorData = await response.json();
            console.error('[App] Store not found:', errorData);
            setStoreNotFound(true);
            setIsLoading(false);
            return;
          }
          
          if (!response.ok) {
            throw new Error(`Init failed with status ${response.status}`);
          }
          
          initData = await response.json();
          console.log('[App] Init data received:', initData);
        }
        
        // All data comes from single source now
        setIsConfigured(initData.isConfigured === true);
        setLicenseActivated(initData.license?.activated === true);
        
        // Check for suspended/locked status
        if (initData.storeStatus === 'suspended' || 
            initData.license?.status === 'suspended' ||
            initData.license?.status === 'expired') {
          setIsLocked(true);
        }
        
        // Show activation modal if license not activated
        if (initData.isConfigured && !initData.license?.activated) {
          setShowActivationModal(true);
        }
        
        console.log('[App] Init complete:', initData.store?.name);
      } catch (error) {
        console.error('Init failed:', error);
        setIsConfigured(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Small delay to ensure preload has time to complete
    const timer = setTimeout(init, 50);
    return () => clearTimeout(timer);
  }, []);

  // Show loading while checking - use premium skeleton
  if (isLoading) {
    return <StorefrontSkeleton />;
  }

  // Show Locked Screen if suspended
  if (isLocked) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <LockedScreen />
      </Suspense>
    );
  }

  // Show Store Not Found page for deleted/non-existent stores
  if (storeNotFound) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#111',
        color: '#fff',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <h1 style={{ fontSize: '4rem', margin: '0' }}>404</h1>
        <h2 style={{ fontSize: '1.5rem', marginTop: '0.5rem', color: '#999' }}>Tienda no encontrada</h2>
        <p style={{ color: '#666', maxWidth: '400px', marginTop: '1rem' }}>
          La tienda que buscas no existe o ha sido eliminada.
        </p>
      </div>
    );
  }

  // Show wizard if not configured (Bypass for Reset Password page)
  const isResetPassword = window.location.pathname === '/reset-password';

  if (!isConfigured && !isResetPassword) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <SetupWizard onComplete={() => window.location.reload()} />
      </Suspense>
    );
  }

  // Show normal store
  return (
    <>
      <ActivationModal 
        isOpen={showActivationModal}
        onSuccess={() => {
          setShowActivationModal(false);
          window.location.reload();
        }}
        onClose={() => {
          // Allow closing the modal (can be made mandatory by removing this)
          setShowActivationModal(false);
        }}
      />
      <Router>
      <ScrollToTop />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/productos" element={<HomePage />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
          <Route path="/checkout" element={<CheckoutForm />} />
          <Route path="/checkout/success" element={<CheckoutForm />} />
          <Route path="/checkout/failure" element={<CheckoutForm />} />
          <Route path="/checkout/pending" element={<CheckoutForm />} />
          <Route path="/preguntas-frecuentes" element={<FAQPage />} />
          <Route path="/favoritos" element={<WishlistPage />} />
          <Route path="/catalogo" element={<CatalogPage />} />
          <Route path="/nosotros" element={<AboutPage />} />
          <Route path="/seguimiento" element={<OrderTracking />} />
          <Route path="/mis-pedidos" element={<UserOrders />} />
          <Route path="/politicas" element={<PoliticasDevolucion />} />
          <Route path="/terminos" element={<TerminosCondiciones />} />
          
          {/* Auth Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Protected Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/productos" element={<ProtectedRoute requireAdmin><AdminProducts /></ProtectedRoute>} />
          <Route path="/admin/categorias" element={<ProtectedRoute requireAdmin><AdminCategories /></ProtectedRoute>} />
          <Route path="/admin/pedidos" element={<ProtectedRoute requireAdmin><AdminOrders /></ProtectedRoute>} />
          <Route path="/admin/clientes" element={<ProtectedRoute requireAdmin><AdminCustomers /></ProtectedRoute>} />
          <Route path="/admin/faqs" element={<ProtectedRoute requireAdmin><AdminFAQs /></ProtectedRoute>} />
          <Route path="/admin/banners" element={<ProtectedRoute requireAdmin><AdminBanners /></ProtectedRoute>} />
          <Route path="/admin/modelos-ia" element={<ProtectedRoute requireAdmin><AdminAIModels /></ProtectedRoute>} />
          <Route path="/admin/menu" element={<ProtectedRoute requireAdmin><AdminMenuEditor /></ProtectedRoute>} />
          <Route path="/admin/promos" element={<ProtectedRoute requireAdmin><AdminPromoCards /></ProtectedRoute>} />
          <Route path="/admin/page-builder" element={<ProtectedRoute requireAdmin><PageBuilder /></ProtectedRoute>} />
          <Route path="/admin/product-page-builder" element={<ProtectedRoute requireAdmin><ProductPageBuilder /></ProtectedRoute>} />
          <Route path="/admin/about" element={<ProtectedRoute requireAdmin><AdminAboutEditor /></ProtectedRoute>} />
          <Route path="/admin/politicas" element={<ProtectedRoute requireAdmin><AdminPoliciesEditor /></ProtectedRoute>} />
          <Route path="/admin/cupones" element={<ProtectedRoute requireAdmin><AdminCoupons /></ProtectedRoute>} />
          <Route path="/admin/reportes" element={<ProtectedRoute requireAdmin><AdminReports /></ProtectedRoute>} />
          <Route path="/admin/configuracion" element={<ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>} />
          <Route path="/admin/envios" element={<ProtectedRoute requireAdmin><AdminShipping /></ProtectedRoute>} />
          <Route path="/admin/gestionar-envios" element={<ProtectedRoute requireAdmin><AdminShipmentManager /></ProtectedRoute>} />
          <Route path="/admin/stock" element={<ProtectedRoute requireAdmin><AdminStockManager /></ProtectedRoute>} />
          <Route path="/admin/pagos" element={<ProtectedRoute requireAdmin><AdminPayments /></ProtectedRoute>} />
          
          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <CartSidebar />
      <MetaPixel />
      <CookieConsent />
      <WhatsAppButton />
      </Router>
    </>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <StoreConfigProvider>
      <ToastProvider>
        <AuthProvider>
        <StoreProvider>
          <CartProvider>
            <WishlistProvider>
              <CouponProvider>
                <AppContent />
              </CouponProvider>
            </WishlistProvider>
          </CartProvider>
        </StoreProvider>
      </AuthProvider>
      </ToastProvider>
    </StoreConfigProvider>
  );
};

// Analytics & Compliance
import { MetaPixel } from './components/analytics/MetaPixel';
import { CookieConsent } from './components/shared/CookieConsent';

export default App;