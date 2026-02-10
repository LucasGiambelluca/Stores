import React, { useState } from 'react';
import { BarChart3, Users, ShoppingBag, DollarSign, TrendingUp, Package, Clock, Truck, CheckCircle } from 'lucide-react';
import { useStoreConfig } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../context/storeApi';
import { AdminLayout } from './AdminLayout';
import { LowStockAlert } from './LowStockAlert';
import { getStoreHeaders } from '@/src/utils/storeDetection';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

// Dashboard Page
export const AdminDashboard: React.FC = () => {
  const { config } = useStoreConfig();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const storeHeaders = getStoreHeaders();
        const response = await fetch(`${API_BASE}/admin/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            ...storeHeaders
          }
        });
        
        if (!response.ok) throw new Error('Error al cargar estadísticas');
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('No se pudieron cargar las estadísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Process real data for charts
  const ordersByStatus = stats?.ordersByStatus || [];
  const getStatusCount = (status: string) => 
    ordersByStatus.find((s: any) => s.status === status)?.count || 0;

  const shippedCount = getStatusCount('shipped');
  const deliveredCount = getStatusCount('delivered');
  const pendingCount = getStatusCount('pending') + getStatusCount('paid'); // 'paid' is effectively pending shipment
  const cancelledCount = getStatusCount('cancelled');
  const totalOrders = shippedCount + deliveredCount + pendingCount + cancelledCount;

  const doughnutData = {
    labels: ['Enviado', 'Entregado', 'Pendiente', 'Cancelado'],
    datasets: [
      {
        data: [shippedCount, deliveredCount, pendingCount, cancelledCount],
        backgroundColor: [
          '#3b82f6', // Blue
          '#10b981', // Green
          '#f59e0b', // Amber
          '#ef4444', // Red
        ],
        borderWidth: 0,
      },
    ],
  };

  // Process sales last 7 days
  const salesData = stats?.salesLast7Days || [];
  // We need to ensure we have 7 days even if some have 0 sales
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const lineData = {
    labels: last7Days.map(date => {
      const d = new Date(date);
      return ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d.getDay()];
    }),
    datasets: [
      {
        label: 'Ventas',
        data: last7Days.map(date => {
          const dayStat = salesData.find((s: any) => s.date === date);
          return dayStat ? Number(dayStat.revenue) : 0;
        }),
        borderColor: '#3b82f6',
        tension: 0.4,
        fill: false,
      },
      {
        label: 'Pedidos',
        data: last7Days.map(date => {
          const dayStat = salesData.find((s: any) => s.date === date);
          return dayStat ? Number(dayStat.orders) : 0;
        }),
        borderColor: '#10b981',
        tension: 0.4,
        fill: false,
      },
    ],
  };

  const statCards = [
    { 
      label: 'Ventas Totales', 
      value: stats ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(stats.month.revenue) : '$0', 
      icon: DollarSign, 
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    { 
      label: 'Pedidos', 
      value: stats ? stats.today.orders.toString() : '0', 
      icon: ShoppingBag, 
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    { 
      label: 'Tiempo Promedio', 
      value: '2 días', 
      icon: Clock, 
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    { 
      label: 'Entregados', 
      value: deliveredCount.toString(), 
      icon: CheckCircle, 
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Panel de Control</h1>
        <p className="text-gray-500">Resumen de actividad de {config.name}</p>
      </div>

      {/* Top Section: Status, Chart, Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Left: Status List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-6">Estatus de Pedidos</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-blue-600 font-medium flex items-center gap-2">
                  <Truck size={16} /> En tránsito
                </span>
                <span className="text-gray-500">{shippedCount} pedidos ({totalOrders ? Math.round(shippedCount/totalOrders*100) : 0}%)</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${totalOrders ? Math.round(shippedCount/totalOrders*100) : 0}%` }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-600 font-medium flex items-center gap-2">
                  <CheckCircle size={16} /> Entregado
                </span>
                <span className="text-gray-500">{deliveredCount} pedidos ({totalOrders ? Math.round(deliveredCount/totalOrders*100) : 0}%)</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${totalOrders ? Math.round(deliveredCount/totalOrders*100) : 0}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-amber-600 font-medium flex items-center gap-2">
                  <Clock size={16} /> Pendiente
                </span>
                <span className="text-gray-500">{pendingCount} pedidos ({totalOrders ? Math.round(pendingCount/totalOrders*100) : 0}%)</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${totalOrders ? Math.round(pendingCount/totalOrders*100) : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Donut Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center justify-center relative">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 absolute top-6 left-6">Distribución</h3>
          <div className="w-64 h-64 relative">
            <Doughnut 
              data={doughnutData} 
              options={{ 
                cutout: '70%',
                plugins: {
                  legend: { display: false }
                }
              }} 
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-gray-800">{stats?.month?.orders || 0}</span>
              <span className="text-sm text-gray-500">Pedidos</span>
            </div>
          </div>
        </div>

        {/* Right: Performance */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-6 w-full text-left">Desempeño</h3>
          
          <div className="relative w-32 h-32 flex items-center justify-center mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="60"
                stroke="#f3f4f6"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="60"
                stroke="#10b981"
                strokeWidth="8"
                fill="none"
                strokeDasharray="377"
                strokeDashoffset={377 - (377 * 0.95)}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-2xl font-bold text-gray-800">95%</span>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Tiempo de entrega promedio</p>
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Clock size={20} />
              <span className="text-xl font-bold">2 días 4 horas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <h3 className="text-lg font-bold text-gray-700 mb-4 uppercase tracking-wide">Resumen</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`p-3 rounded-full ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-700">Actividad Semanal</h3>
          <select className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 text-sm text-gray-600">
            <option>Últimos 7 días</option>
            <option>Este mes</option>
          </select>
        </div>
        <div className="h-64 w-full">
          <Line 
            data={lineData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom' }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: '#f3f4f6' }
                },
                x: {
                  grid: { display: false }
                }
              }
            }} 
          />
        </div>
      </div>

      {/* Top Products Section - Pro/Enterprise Only */}
      {(config.plan === 'pro' || config.plan === 'enterprise') ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Viewed */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-700">Productos Más Vistos</h3>
            </div>
            <div className="p-4">
              {stats?.topViewedProducts?.length > 0 ? (
                <div className="space-y-4">
                  {stats.topViewedProducts.map((product: any, index: number) => (
                    <div key={product.id} className="flex items-center gap-4">
                      <span className="text-gray-400 font-bold w-4 text-center">{index + 1}</span>
                      <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 line-clamp-1">{product.name}</p>
                        <p className="text-sm text-gray-500">${product.price}</p>
                      </div>
                      <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                        <Users size={14} />
                        <span className="font-bold text-sm">{product.views}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No hay datos de vistas aún</p>
              )}
            </div>
          </div>

          {/* Top Clicked */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-700">Productos Más Clickeados</h3>
            </div>
            <div className="p-4">
              {stats?.topClickedProducts?.length > 0 ? (
                <div className="space-y-4">
                  {stats.topClickedProducts.map((product: any, index: number) => (
                    <div key={product.id} className="flex items-center gap-4">
                      <span className="text-gray-400 font-bold w-4 text-center">{index + 1}</span>
                      <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 line-clamp-1">{product.name}</p>
                        <p className="text-sm text-gray-500">${product.price}</p>
                      </div>
                      <div className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                        <TrendingUp size={14} />
                        <span className="font-bold text-sm">{product.clicks}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No hay datos de clicks aún</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 mb-8 text-white text-center shadow-lg">
          <div className="flex justify-center mb-4">
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
              <TrendingUp size={32} className="text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-2">Desbloquea Analytics Avanzado</h3>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Descubre qué productos son los más populares y optimiza tus ventas. 
            Actualiza a un plan <strong>Pro</strong> o <strong>Enterprise</strong> para ver métricas detalladas de vistas y clicks.
          </p>
          <button 
            onClick={() => window.location.href = '/admin/configuracion'}
            className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-bold hover:bg-indigo-50 transition-colors shadow-md"
          >
            Ver Planes Disponibles
          </button>
        </div>
      )}

      {/* Recent Orders Table (Simplified) */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-700">Pedidos Recientes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase font-medium">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.recentOrders?.map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">#{order.orderNumber}</td>
                  <td className="px-6 py-4 text-gray-600">{order.customerName}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'paid' ? 'bg-green-100 text-green-700' :
                      order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(order.total)}
                  </td>
                </tr>
              ))}
              {!stats?.recentOrders?.length && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No hay pedidos recientes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
