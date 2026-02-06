import { getStoreId } from '../../utils/storeDetection';
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { StoreLink as Link } from '../StoreLink';
import { useStoreNavigate } from '../../hooks/useStoreNavigate';
import { 
  LayoutDashboard, Package, Layers, ShoppingCart, Users, Settings, 
  LogOut, Menu, X, Eye, HelpCircle, Image, BarChart3, Sparkles, Link as LinkIcon, Layout, Info,
  Truck, CreditCard, Settings2, PackageCheck, ChevronDown, ChevronRight,
  FileText, Palette, Tag
} from 'lucide-react';
import { useStoreConfig } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import SupportWidget from './SupportWidget';
import { PasswordChangeModal } from './PasswordChangeModal';
import { LicenseWidget } from './LicenseWidget';

interface MenuItem {
  icon: React.FC<any>;
  label: string;
  path: string;
}

interface MenuGroup {
  icon: React.FC<any>;
  label: string;
  items: MenuItem[];
}

type MenuEntry = MenuItem | MenuGroup;

const isGroup = (entry: MenuEntry): entry is MenuGroup => 'items' in entry;

// Shared Admin Layout
export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['logistica']); // Open by default
  const location = useLocation();
  const { config } = useStoreConfig();
  const navigate = useStoreNavigate();
  const { logout, user } = useAuth();

  const menuItems: MenuEntry[] = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    
    // Catálogo Group
    {
      icon: Package,
      label: 'Catálogo',
      items: [
        { icon: Package, label: 'Productos', path: '/admin/productos' },
        { icon: Layers, label: 'Categorías', path: '/admin/categorias' },
        { icon: Package, label: 'Stock', path: '/admin/stock' },
      ]
    },
    
    // Ventas Group
    {
      icon: ShoppingCart,
      label: 'Ventas',
      items: [
        { icon: ShoppingCart, label: 'Pedidos', path: '/admin/pedidos' },
        { icon: Users, label: 'Clientes', path: '/admin/clientes' },
        { icon: BarChart3, label: 'Reportes', path: '/admin/reportes' },
      ]
    },
    
    // Contenido Group
    {
      icon: FileText,
      label: 'Contenido',
      items: [
        { icon: Image, label: 'Banners', path: '/admin/banners' },
        { icon: Sparkles, label: 'Promos', path: '/admin/promos' },
        { icon: Layout, label: 'Page Builder', path: '/admin/page-builder' },
        { icon: Package, label: 'Product Page', path: '/admin/product-page-builder' },
        { icon: HelpCircle, label: 'FAQs', path: '/admin/faqs' },
        { icon: LinkIcon, label: 'Menú', path: '/admin/menu' },
        { icon: Info, label: 'Sobre Nosotros', path: '/admin/about' },
        { icon: FileText, label: 'Políticas', path: '/admin/politicas' },
      ]
    },
    
    // Logística Group
    {
      icon: Truck,
      label: 'Logística',
      items: [
        { icon: PackageCheck, label: 'Gestionar Envíos', path: '/admin/gestionar-envios' },
        { icon: Settings2, label: 'Configurar Envíos', path: '/admin/envios' },
      ]
    },
    
    // Marketing Group
    {
      icon: Tag,
      label: 'Marketing',
      items: [
        { icon: Tag, label: 'Cupones', path: '/admin/cupones' },
      ]
    },

    // Configuración Group
    {
      icon: Settings,
      label: 'Configuración',
      items: [
        { icon: CreditCard, label: 'Pagos', path: '/admin/pagos' },
        { icon: Palette, label: 'Apariencia', path: '/admin/configuracion' },
      ]
    },
  ];

  const isActive = (path: string) => location.pathname === path;
  
  const isGroupActive = (group: MenuGroup) => group.items.some(item => location.pathname === item.path);

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => 
      prev.includes(label) 
        ? prev.filter(g => g !== label)
        : [...prev, label]
    );
  };

  const renderMenuItem = (item: MenuItem) => {
    const active = isActive(item.path);
    return (
      <Link
        key={item.path}
        to={item.path}
        className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-1 ${
          active
            ? 'shadow-lg'
            : 'text-white/70 hover:text-white hover:bg-white/5'
        }`}
        style={active ? { 
          backgroundColor: config.colors.accent, 
          color: config.colors.primary,
          boxShadow: `0 4px 12px -2px ${config.colors.accent}40`
        } : {}}
        onClick={() => setSidebarOpen(false)}
      >
        <item.icon size={20} className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
        <span className="text-sm font-medium">{item.label}</span>
        {active && <ChevronRight size={16} className="ml-auto opacity-50" />}
      </Link>
    );
  };

  const renderMenuGroup = (group: MenuGroup) => {
    const isExpanded = expandedGroups.includes(group.label);
    const hasActiveChild = isGroupActive(group);
    
    return (
      <div key={group.label} className="mb-4">
        <button
          onClick={() => toggleGroup(group.label)}
          className={`w-full flex items-center justify-between px-4 py-2 mb-2 text-xs font-bold uppercase tracking-wider transition-colors ${
            hasActiveChild ? 'text-white' : 'text-white/50 hover:text-white/80'
          }`}
          style={hasActiveChild ? { color: config.colors.accent } : {}}
        >
          <div className="flex items-center gap-2">
            <span className="opacity-80">{group.label}</span>
          </div>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        
        <div className={`space-y-0.5 transition-all duration-300 ${isExpanded ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
          {group.items.map(item => renderMenuItem(item))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans">
      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 text-white transform transition-transform duration-300 ease-out shadow-xl
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          bg-[#1a1c23]
        `}
      >
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-white/5 bg-[#1a1c23]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg overflow-hidden">
              {config.logo ? (
                <img src={config.logo} alt={config.name} className="w-full h-full object-cover" />
              ) : (
                <Sparkles size={16} className="text-white" />
              )}
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none tracking-wide">
                {config.name.toUpperCase()}
              </h1>
            </div>
          </div>
        </div>

        {/* License Info */}
        <div className="px-4 py-3">
          <LicenseWidget />
        </div>

        {/* Navigation */}
        <nav className="p-4 overflow-y-auto h-[calc(100vh-180px)] custom-scrollbar space-y-1">
          {menuItems.map((entry) => 
            isGroup(entry) ? renderMenuGroup(entry) : renderMenuItem(entry)
          )}
        </nav>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#1a1c23] border-t border-white/5">
          <button 
            onClick={() => { logout(); window.location.href = '/admin/login'; }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 w-full group"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-[#22252b] border-b border-gray-800 sticky top-0 z-30 px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
              <span className="font-medium text-white">
                {menuItems.find(g => isGroup(g) && isGroupActive(g))?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a 
              href={getStoreId() ? `/?storeId=${getStoreId()}` : '/'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-md hover:shadow-lg border border-blue-500"
              title="Ver Tienda Pública"
            >
              <Eye size={18} />
              <span>Ver Tienda</span>
            </a>

            <div className="flex items-center gap-3 pl-6 border-l border-gray-700">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white leading-none">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-400 mt-1">Administrador</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center overflow-hidden">
                <Users size={18} className="text-gray-300" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto bg-[#f4f6f8]">
          {children}
        </main>
      </div>

      <SupportWidget />
      <PasswordChangeModal isOpen={user?.forcePasswordChange || false} />
    </div>
  );
};
