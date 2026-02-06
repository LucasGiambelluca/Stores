import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Menu, X, Instagram, MapPin, Mail, MessageCircle, Check, ExternalLink, Search, ChevronRight, Heart, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useStoreConfig, useCategories, useMenuLinks, useProducts } from '../../context/StoreContext';
import { StoreLink as Link } from '../StoreLink';
import { useStoreNavigate } from '../../hooks/useStoreNavigate';
import { useLocation } from 'react-router-dom';
import { ThemeToggle } from '../ThemeToggle';
import { AuthModal } from '../auth/AuthModal';
import { useAuth } from '../../context/AuthContext';

export interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { toggleCart, cartCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { config } = useStoreConfig();
  const { categories } = useCategories();
  const { menuLinks } = useMenuLinks();
  const { products } = useProducts();
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof products>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const navigate = useStoreNavigate();
  const location = useLocation();

  // Safe defaults for unconfigured stores
  const safeConfig = {
    whatsapp: config?.whatsapp || '',
    instagram: config?.instagram || '',
    colors: config?.colors || { primary: '#111111', secondary: '#f4f4f4', accent: '#66FF00' },
    logo: config?.logo || '',
    name: config?.name || 'Mi Tienda',
    freeShippingFrom: config?.freeShippingFrom || 100000,
    transferDiscount: config?.transferDiscount || '10%',
  };

  // Use custom menu links if defined, otherwise fall back to categories
  const hasCustomMenu = menuLinks.length > 0;
  
  // Convert categories to nav format with subcategories
  const navCategories = categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    filter: cat.slug,
    isAccent: cat.isAccent,
    subcategories: cat.subcategories || []
  }));

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const query = searchQuery.toLowerCase();
      const results = products.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
      ).slice(0, 6); // Limit to 6 results
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, products]);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close search on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const handleCategoryClick = (filter: string) => {
    // Navigate with query param for filtering
    const targetUrl = `/?category=${filter}`;
    
    if (location.pathname !== '/' || location.search !== `?category=${filter}`) {
      navigate(targetUrl);
    }
    
    // Always scroll to products section
    setTimeout(() => {
      const el = document.getElementById('productos');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    setIsMobileMenuOpen(false);
  };

  const handleSearchSelect = (productId: string | number) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(`/producto/${productId}`);
  };

  const handleAllProductsClick = () => {
    // Clear filters by navigating to root without params
    if (location.search) {
      navigate('/');
    }
    
    setTimeout(() => {
      const el = document.getElementById('productos');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    setIsMobileMenuOpen(false);
  };

  const scrollToProducts = () => {
    const productsSection = document.getElementById('productos');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* Announcement Bar - Industrial Yellow accent */}
      <div className="text-white text-center py-2.5 px-4" style={{ backgroundColor: safeConfig.colors.primary }}>
        <p className="text-xs tracking-wider">
          <span className="font-bold" style={{ color: safeConfig.colors.accent }}>ENVÍO GRATIS</span> en compras mayores a ${safeConfig.freeShippingFrom.toLocaleString('es-AR')} | 
          <span className="font-bold ml-2" style={{ color: safeConfig.colors.accent }}>{safeConfig.transferDiscount} OFF</span> con transferencia
        </p>
      </div>

      <nav className="hm-navbar bg-white sticky top-0 z-50 border-b border-gray-200">
        <div className="hm-navbar-container">
          {/* Top Bar */}
          <div className="hm-navbar-top">
            {/* Left - Mobile Menu */}
            <div className="flex items-center gap-4 lg:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="hm-icon-btn"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

            {/* Center - Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img 
                src={safeConfig.logo} 
                alt={safeConfig.name} 
                className="h-12 w-auto object-contain"
                style={{ maxHeight: '48px' }}
              />
            </Link>

            {/* Desktop Nav - Structured Menu */}
            <div className="hidden lg:flex hm-nav-links">
              {/* Inicio */}
              <Link to="/" className="hm-nav-link">Inicio</Link>
              
              {/* Productos Dropdown with Subcategories */}
              <div className="relative group">
                <button 
                  onClick={handleAllProductsClick}
                  className="hm-nav-link flex items-center gap-1"
                >
                  Productos
                  <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Mega Dropdown Menu with Subcategories */}
                <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-white rounded-lg shadow-xl border border-gray-100 py-3 min-w-[280px]">
                    <button 
                      onClick={handleAllProductsClick}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 font-medium text-[#1a1a1a]"
                    >
                      Todos los productos
                    </button>
                    <div className="border-t border-gray-100 my-2" />
                    
                    {navCategories.map((cat) => (
                      <div key={cat.id} className="relative group/cat">
                        <button 
                          onClick={() => handleCategoryClick(cat.filter)}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${cat.isAccent ? 'text-red-600' : 'text-gray-700'}`}
                        >
                          <span>{cat.name}</span>
                          {cat.subcategories.length > 0 && (
                            <ChevronRight size={16} className="text-gray-400" />
                          )}
                        </button>
                        
                        {/* Subcategories flyout */}
                        {cat.subcategories.length > 0 && (
                          <div className="absolute left-full top-0 pl-1 opacity-0 invisible group-hover/cat:opacity-100 group-hover/cat:visible transition-all duration-150">
                            <div className="bg-white rounded-lg shadow-lg border border-gray-100 py-2 min-w-[180px]">
                              {cat.subcategories.map(sub => (
                                <button
                                  key={sub.id}
                                  onClick={() => handleCategoryClick(`${cat.filter}/${sub.slug}`)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                >
                                  {sub.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Sobre Nosotros */}
              <Link to="/nosotros" className="hm-nav-link">Sobre Nosotros</Link>
              
              {/* FAQ */}
              <Link to="/preguntas-frecuentes" className="hm-nav-link">FAQ</Link>
              
              {/* Contacto (WhatsApp) */}
              <a 
                href={`https://wa.me/${safeConfig.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hm-nav-link text-green-600"
              >
                Contacto
              </a>
            </div>

            {/* Center - Search Bar (Desktop) */}
            <div className="hidden lg:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:bg-white transition-all"
                />
                
                {/* Desktop search dropdown results */}
                {isSearchOpen && searchQuery.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    {searchResults.length > 0 ? (
                      <div className="py-2">
                        {searchResults.map(product => (
                          <button
                            key={product.id}
                            onClick={() => handleSearchSelect(product.id)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                          >
                            {product.image && (
                              <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{product.name}</p>
                              <p className="text-xs text-gray-500">{product.category}</p>
                            </div>
                            <p className="font-bold text-sm" style={{ color: safeConfig.colors.accent }}>
                              ${product.price.toLocaleString('es-AR')}
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No se encontraron resultados
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right - Icons */}
            <div className="hm-nav-icons">
              {/* Mobile Search Button */}
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="hm-icon-btn lg:hidden"
                aria-label="Buscar"
              >
                <Search size={20} />
              </button>
              
              <a 
                href={`https://instagram.com/${safeConfig.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hm-icon-btn hidden sm:flex" 
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <Link 
                to="/favoritos"
                className="hm-icon-btn relative"
                aria-label="Favoritos"
              >
                <Heart size={20} />
                {wishlistItems.length > 0 && (
                  <span className="hm-cart-badge" style={{ backgroundColor: '#d32f2f' }}>{wishlistItems.length}</span>
                )}
              </Link>
              <ThemeToggle />
              
              {/* User Account */}
              <div className="relative group/user">
                <button 
                  onClick={() => !isAuthenticated && setIsAuthModalOpen(true)}
                  className="hm-icon-btn relative"
                  aria-label={isAuthenticated ? 'Mi Cuenta' : 'Iniciar Sesión'}
                >
                  <User size={20} />
                  {isAuthenticated && (
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></span>
                  )}
                </button>

                {/* User Dropdown */}
                {isAuthenticated && (
                  <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover/user:opacity-100 group-hover/user:visible transition-all duration-200 z-50">
                    <div className="bg-white rounded-lg shadow-xl border border-gray-100 py-2 min-w-[200px]">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="font-medium text-sm truncate">{user?.name || 'Usuario'}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      
                      {isAdmin && (
                        <Link 
                          to="/admin" 
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <LayoutDashboard size={16} />
                          Panel Admin
                        </Link>
                      )}
                      
                      <Link 
                        to="/mis-pedidos" 
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <ShoppingBag size={16} />
                        Mis Pedidos
                      </Link>
                      
                      <button
                        onClick={logout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={toggleCart} 
                className="hm-icon-btn relative"
                aria-label="Carrito"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="hm-cart-badge">{cartCount}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="hm-mobile-menu open">
              <div className="hm-mobile-menu-header">
                <span className="text-lg font-semibold">Menú</span>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hm-icon-btn"
                >
                  <X size={22} />
                </button>
              </div>
              
              {/* Mobile Search */}
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </div>
                {/* Mobile search results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-white rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                    {searchResults.map(product => (
                      <button
                        key={product.id}
                        onClick={() => { handleSearchSelect(product.id); setIsMobileMenuOpen(false); }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                      >
                        {product.image && (
                          <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          <p className="text-xs text-gray-500">${product.price.toLocaleString('es-AR')}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="hm-mobile-menu-links">
                {/* Inicio */}
                <Link 
                  to="/" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="hm-mobile-menu-link"
                >
                  Inicio
                </Link>
                
                {/* Productos Section with Subcategories */}
                <div className="py-2">
                  <button 
                    onClick={handleAllProductsClick}
                    className="hm-mobile-menu-link font-semibold"
                  >
                    Productos
                  </button>
                  <div className="pl-4 space-y-1 mt-1">
                    {navCategories.map((cat) => (
                      <div key={cat.id}>
                        <button 
                          onClick={() => {
                            if (cat.subcategories.length > 0) {
                              setExpandedCategory(expandedCategory === cat.id ? null : cat.id);
                            } else {
                              handleCategoryClick(cat.filter);
                              setIsMobileMenuOpen(false);
                            }
                          }}
                          className={`flex items-center justify-between w-full py-1.5 text-sm ${cat.isAccent ? 'text-red-600' : 'text-gray-600'}`}
                        >
                          <span>{cat.name}</span>
                          {cat.subcategories.length > 0 && (
                            <ChevronRight 
                              size={14} 
                              className={`transition-transform ${expandedCategory === cat.id ? 'rotate-90' : ''}`} 
                            />
                          )}
                        </button>
                        
                        {/* Mobile subcategories */}
                        {expandedCategory === cat.id && cat.subcategories.length > 0 && (
                          <div className="pl-4 space-y-1 mt-1">
                            <button
                              onClick={() => { handleCategoryClick(cat.filter); setIsMobileMenuOpen(false); }}
                              className="block py-1 text-xs text-gray-500"
                            >
                              Ver todo en {cat.name}
                            </button>
                            {cat.subcategories.map(sub => (
                              <button
                                key={sub.id}
                                onClick={() => { handleCategoryClick(`${cat.filter}/${sub.slug}`); setIsMobileMenuOpen(false); }}
                                className="block py-1 text-xs text-gray-500 hover:text-gray-900"
                              >
                                {sub.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t border-gray-200 my-2" />
                
                {/* Sobre Nosotros */}
                <Link 
                  to="/nosotros" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="hm-mobile-menu-link"
                >
                  Sobre Nosotros
                </Link>
                
                {/* FAQ */}
                <Link 
                  to="/preguntas-frecuentes" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="hm-mobile-menu-link"
                >
                  Preguntas Frecuentes
                </Link>
                
                <div className="border-t border-gray-200 my-2" />
                
                {/* Contacto */}
                <a 
                  href={`https://wa.me/${safeConfig.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="hm-mobile-menu-link text-green-600"
                >
                  Contacto (WhatsApp)
                </a>
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Search Modal - Mobile only (desktop has inline search) */}
      {isSearchOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[60] animate-fade-in lg:hidden"
            onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
          />
          <div className="fixed top-0 left-0 right-0 z-[70] bg-white shadow-xl animate-slide-down lg:hidden">
            <div className="max-w-3xl mx-auto p-4">
              <div className="relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="¿Qué estás buscando?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
                />
                <button 
                  onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="text-sm text-gray-500 mb-3">{searchResults.length} resultados</p>
                  <div className="space-y-2">
                    {searchResults.map(product => (
                      <button
                        key={product.id}
                        onClick={() => handleSearchSelect(product.id)}
                        className="w-full p-3 text-left hover:bg-gray-50 rounded-lg flex items-center gap-4"
                      >
                        {product.image && (
                          <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-lg" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.category}</p>
                        </div>
                        <p className="font-bold" style={{ color: safeConfig.colors.accent }}>
                          ${product.price.toLocaleString('es-AR')}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* No results message */}
              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="mt-4 text-center py-8 text-gray-500">
                  <Search size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No encontramos resultados para "{searchQuery}"</p>
                  <p className="text-sm mt-1">Probá con otras palabras</p>
                </div>
              )}
              
              {/* Search tips */}
              {searchQuery.length < 2 && (
                <div className="mt-4 text-center py-4 text-gray-500 text-sm">
                  Escribí al menos 2 caracteres para buscar
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialMode="login"
      />
    </>
  );
};
