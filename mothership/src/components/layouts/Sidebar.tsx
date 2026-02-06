import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Key, Store, Settings, LogOut, Hexagon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export default function Sidebar() {
  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/licenses', icon: Key, label: 'Licencias' },
    { to: '/stores', icon: Store, label: 'Tiendas' },
    { to: '/settings', icon: Settings, label: 'Configuración' },
  ];
  
  const handleLogout = () => {
    localStorage.removeItem('mothership_token');
    window.location.href = '/login';
  };
  
  return (
    <motion.aside 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-72 h-screen sticky top-0 flex flex-col p-4 z-50"
    >
      {/* Glass Container */}
      <div className="flex-1 flex flex-col rounded-3xl bg-white/80 backdrop-blur-2xl border border-slate-200 shadow-2xl overflow-hidden relative">
        
        {/* Logo Section */}
        <div className="p-6 relative">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-lime-100/50 to-transparent pointer-events-none" />
          
          <div className="flex items-center gap-4 relative z-10 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lime-500 to-lime-600 flex items-center justify-center shadow-lg _0_20px_rgba(132,204,22,0.3)]">
              <Hexagon className="text-white fill-white/20" size={24} strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                Lime<span className="text-lime-600 ">Mothership</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-bold tracking-wide">COMMAND CENTER</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => cn(
                "relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group overflow-hidden",
                isActive 
                  ? "text-slate-900 shadow-md _4px_20px_-4px_rgba(0,0,0,0.3)]" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 "
              )}
            >
              {({ isActive }) => (
                <>
                  {/* Active Background with Glow */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-white border border-slate-200 rounded-xl"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  {/* Icon & Label */}
                  <Icon 
                    size={20} 
                    className={cn(
                      "relative z-10 transition-colors duration-300",
                      isActive ? "text-lime-600 " : "group-hover:text-lime-600 "
                    )} 
                  />
                  <span className="relative z-10 font-bold">{label}</span>
                  
                  {/* Active Indicator Dot */}
                  {isActive && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 w-1.5 h-1.5 rounded-full bg-lime-500 shadow-[0_0_8px_currentColor]"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        
        {/* User / Logout Section */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 ">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-slate-500 hover:text-red-600 w-full transition-all group border border-transparent hover:border-red-200 "
          >
            <LogOut size={20} className="group-hover:translate-x-[-2px] transition-transform" />
            <span className="font-bold">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </motion.aside>
  );
}

