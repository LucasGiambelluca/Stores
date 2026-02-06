import { useStoreStats } from '../hooks/useStores';
import { Store, Key, Rocket, BarChart3, Users, ShoppingBag, ArrowUpRight } from 'lucide-react';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import { GlassCard } from '../components/ui/GlassCard';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { data: statsData, isLoading } = useStoreStats();
  const stats = statsData?.data;
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-slate-900 mb-2 tracking-tight">
            Dashboard
            <span className="text-lime-600 ">.</span>
          </h1>
          <p className="text-slate-600 text-lg font-medium">Vista general del sistema de licencias</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm text-slate-500 font-mono font-medium">{new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </motion.div>
      
      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          icon={Store}
          label="Tiendas Totales"
          value={stats?.stores.total || 0}
          color="blue"
          description={`${stats?.stores.active || 0} activas actualmente`}
          trend="+12%"
        />
        <StatsCard
          icon={Key}
          label="Licencias"
          value={stats?.licenses.total || 0}
          color="green"
          description={`${stats?.licenses.active || 0} activadas`}
          trend="+5%"
        />
        <StatsCard
          icon={Users}
          label="Clientes Totales"
          value={stats?.activity.totalCustomers || 0}
          color="violet"
          description="Usuarios registrados"
          trend="+24%"
        />
        <StatsCard
          icon={ShoppingBag}
          label="Órdenes Totales"
          value={stats?.activity.totalOrders || 0}
          color="orange"
          description="Transacciones globales"
          trend="+8%"
        />
      </motion.div>

      {/* Charts Section */}
      {stats?.history && (
        <motion.div variants={itemVariants}>
          <DashboardCharts 
            ordersHistory={stats.history.orders} 
            storesHistory={stats.history.stores} 
          />
        </motion.div>
      )}
      
      {/* Welcome Card */}
      <motion.div variants={itemVariants}>
        <GlassCard className="p-8 border-slate-200 bg-white shadow-xl">
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-slate-900 mb-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-lime-100 border border-lime-200 ">
                  <Rocket size={24} className="text-lime-600 " />
                </div>
                Bienvenido a LimeMothership
              </h2>
              <p className="text-lg text-slate-600 mb-8 max-w-2xl leading-relaxed font-medium">
                Panel de control centralizado para gestionar todas tus tiendas LimeStore. 
                Genera licencias, monitorea tiendas activas y controla todo desde un solo lugar.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
                <div className="group p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-lime-300 transition-all duration-300 cursor-default shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center group-hover:scale-110 transition-transform border border-slate-200 ">
                      <Key size={16} className="text-slate-600 group-hover:text-lime-600 " />
                    </div>
                    <h3 className="font-bold text-slate-900 ">Gestión de Licencias</h3>
                  </div>
                  <p className="text-sm text-slate-500 group-hover:text-slate-700 font-medium">
                    Genera seriales únicos, activa tiendas y controla el acceso.
                  </p>
                </div>
                
                <div className="group p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-lime-300 transition-all duration-300 cursor-default shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center group-hover:scale-110 transition-transform border border-slate-200 ">
                      <BarChart3 size={16} className="text-slate-600 group-hover:text-lime-600 " />
                    </div>
                    <h3 className="font-bold text-slate-900 ">Monitoreo Real</h3>
                  </div>
                  <p className="text-sm text-slate-500 group-hover:text-slate-700 font-medium">
                    Visualiza estadísticas, check-ins y estado de tiendas.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Decorative background element */}
            <div className="absolute right-0 top-0 w-64 h-64 bg-lime-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

interface StatsCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'violet' | 'orange';
  description: string;
  trend?: string;
}

function StatsCard({ icon: Icon, label, value, color, description, trend }: StatsCardProps) {
  const colors = {
    blue: "text-blue-600 bg-blue-50 border-blue-200 shadow-blue-500/10",
    green: "text-lime-600 bg-lime-50 border-lime-200 shadow-lime-500/10",
    violet: "text-violet-600 bg-violet-50 border-violet-200 shadow-violet-500/10",
    orange: "text-orange-600 bg-orange-50 border-orange-200 shadow-orange-500/10",
  };
  
  return (
    <GlassCard className="p-6 group hover:border-slate-300 bg-white shadow-lg border-slate-200 ">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl border ${colors[color]} transition-transform group-hover:scale-110 duration-300`}>
          <Icon size={24} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs font-bold text-lime-700 bg-lime-100 px-2 py-1 rounded-full border border-lime-200 ">
            <ArrowUpRight size={12} />
            {trend}
          </div>
        )}
      </div>
      
      <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-4xl font-display font-bold text-slate-900 mb-2 tracking-tight">{value}</p>
      </div>
      <p className="text-xs text-slate-500 font-medium group-hover:text-slate-700 transition-colors">{description}</p>
    </GlassCard>
  );
}
