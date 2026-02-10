import React, { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { 
  BarChart3, DollarSign, ShoppingBag, TrendingUp,
  Calendar, Loader2, XCircle, Package, Download, FileSpreadsheet, FileText
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE } from '../../context/storeApi';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SalesStats {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  cancelled_orders: number;
}

interface SalesByDate {
  date: string;
  orders: number;
  revenue: number;
}

interface OrdersByStatus {
  status: string;
  count: number;
  revenue: number;
}

interface TopProduct {
  product_name: string;
  total_sold: number;
  revenue: number;
}

interface ReportData {
  stats: SalesStats;
  salesByDate: SalesByDate[];
  ordersByStatus: OrdersByStatus[];
  topProducts: TopProduct[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  processing: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#FCD34D',
  paid: '#34D399',
  processing: '#60A5FA',
  shipped: '#A78BFA',
  delivered: '#6EE7B7',
  cancelled: '#F87171',
};

export const AdminReportsPanel: React.FC = () => {
  const { token } = useAuth();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year' | 'all'>('month');

  // Fetch report data
  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      const now = new Date();
      let startDate: string | undefined;
      
      if (dateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString().split('T')[0];
      } else if (dateRange === 'month') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        startDate = monthAgo.toISOString().split('T')[0];
      } else if (dateRange === 'year') {
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        startDate = yearAgo.toISOString().split('T')[0];
      }
      
      if (startDate) params.append('startDate', startDate);
      
      const response = await fetch(`${API_BASE}/admin/reports/sales?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Error al cargar reportes');
      
      const data = await response.json();
      setReportData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [dateRange]);

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);

  // ============================================
  // EXPORT FUNCTIONS
  // ============================================
  
  const exportToExcel = () => {
    if (!reportData) return;

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Stats sheet
    const statsData = [
      ['Métrica', 'Valor'],
      ['Ingresos Totales', formatPrice(reportData.stats.total_revenue)],
      ['Total Pedidos', reportData.stats.total_orders],
      ['Ticket Promedio', formatPrice(reportData.stats.avg_order_value)],
      ['Pedidos Cancelados', reportData.stats.cancelled_orders],
    ];
    const statsWs = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, statsWs, 'Resumen');

    // Sales by date sheet
    const salesData = [
      ['Fecha', 'Pedidos', 'Ingresos'],
      ...reportData.salesByDate.map(d => [d.date, d.orders, d.revenue])
    ];
    const salesWs = XLSX.utils.aoa_to_sheet(salesData);
    XLSX.utils.book_append_sheet(wb, salesWs, 'Ventas por Día');

    // Orders by status sheet
    const statusData = [
      ['Estado', 'Cantidad', 'Ingresos'],
      ...reportData.ordersByStatus.map(s => [STATUS_LABELS[s.status] || s.status, s.count, s.revenue])
    ];
    const statusWs = XLSX.utils.aoa_to_sheet(statusData);
    XLSX.utils.book_append_sheet(wb, statusWs, 'Por Estado');

    // Top products sheet
    const productsData = [
      ['Producto', 'Unidades Vendidas', 'Ingresos'],
      ...reportData.topProducts.map(p => [p.product_name, p.total_sold, p.revenue])
    ];
    const productsWs = XLSX.utils.aoa_to_sheet(productsData);
    XLSX.utils.book_append_sheet(wb, productsWs, 'Top Productos');

    // Download
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `reporte-ventas-${date}.xlsx`);
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('es-AR');

    // Title
    doc.setFontSize(20);
    doc.setTextColor(26, 26, 26);
    doc.text('Reporte de Ventas', 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado: ${date}`, 14, 30);

    // Stats
    doc.setFontSize(14);
    doc.setTextColor(26, 26, 26);
    doc.text('Resumen General', 14, 45);
    
    autoTable(doc, {
      startY: 50,
      head: [['Métrica', 'Valor']],
      body: [
        ['Ingresos Totales', formatPrice(reportData.stats.total_revenue)],
        ['Total Pedidos', reportData.stats.total_orders.toString()],
        ['Ticket Promedio', formatPrice(reportData.stats.avg_order_value)],
        ['Cancelados', reportData.stats.cancelled_orders.toString()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [229, 184, 0] },
    });

    // Orders by status
    const statusY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Pedidos por Estado', 14, statusY);
    
    autoTable(doc, {
      startY: statusY + 5,
      head: [['Estado', 'Cantidad', 'Ingresos']],
      body: reportData.ordersByStatus.map(s => [
        STATUS_LABELS[s.status] || s.status,
        s.count.toString(),
        formatPrice(s.revenue)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [229, 184, 0] },
    });

    // Top products
    const productsY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Top 10 Productos', 14, productsY);
    
    autoTable(doc, {
      startY: productsY + 5,
      head: [['Producto', 'Vendidos', 'Ingresos']],
      body: reportData.topProducts.slice(0, 10).map(p => [
        p.product_name,
        p.total_sold.toString(),
        formatPrice(p.revenue)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [229, 184, 0] },
    });

    // Download
    const fileName = `reporte-ventas-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  // ============================================
  // CHART DATA
  // ============================================

  const salesChartData = reportData ? {
    labels: reportData.salesByDate.slice(0, 14).reverse().map(d => d.date),
    datasets: [
      {
        label: 'Ingresos',
        data: reportData.salesByDate.slice(0, 14).reverse().map(d => d.revenue),
        backgroundColor: 'rgba(229, 184, 0, 0.5)',
        borderColor: 'rgb(229, 184, 0)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  } : null;

  const ordersChartData = reportData ? {
    labels: reportData.salesByDate.slice(0, 14).reverse().map(d => d.date),
    datasets: [
      {
        label: 'Pedidos',
        data: reportData.salesByDate.slice(0, 14).reverse().map(d => d.orders),
        backgroundColor: 'rgba(96, 165, 250, 0.8)',
        borderColor: 'rgb(96, 165, 250)',
        borderWidth: 1,
      },
    ],
  } : null;

  const statusChartData = reportData ? {
    labels: reportData.ordersByStatus.map(s => STATUS_LABELS[s.status] || s.status),
    datasets: [
      {
        data: reportData.ordersByStatus.map(s => s.count),
        backgroundColor: reportData.ordersByStatus.map(s => STATUS_COLORS[s.status] || '#9CA3AF'),
        borderWidth: 0,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' as const },
    },
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <XCircle size={48} className="mx-auto text-red-300 mb-4" />
          <p className="text-red-600">{error}</p>
          <button onClick={fetchReport} className="mt-4 text-blue-600 hover:underline">
            Reintentar
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reportes de Ventas</h1>
          <p className="text-gray-600">Análisis y estadísticas del negocio</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Date Range Selector */}
          {(['week', 'month', 'year', 'all'] as const).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === range 
                  ? 'bg-accent text-primary' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range === 'week' && '7 días'}
              {range === 'month' && '30 días'}
              {range === 'year' && '1 año'}
              {range === 'all' && 'Todo'}
            </button>
          ))}
          
          {/* Export Buttons */}
          <div className="flex gap-2 ml-2">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="Exportar a Excel"
            >
              <FileSpreadsheet size={18} />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              title="Exportar a PDF"
            >
              <FileText size={18} />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>
      </div>

      {reportData && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-500 p-3 rounded-lg">
                  <DollarSign size={24} className="text-white" />
                </div>
                <TrendingUp size={20} className="text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{formatPrice(reportData.stats.total_revenue)}</p>
              <p className="text-sm text-gray-500">Ingresos Totales</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-500 p-3 rounded-lg">
                  <ShoppingBag size={24} className="text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800">{reportData.stats.total_orders}</p>
              <p className="text-sm text-gray-500">Total Pedidos</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-500 p-3 rounded-lg">
                  <BarChart3 size={24} className="text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800">{formatPrice(reportData.stats.avg_order_value)}</p>
              <p className="text-sm text-gray-500">Ticket Promedio</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-red-500 p-3 rounded-lg">
                  <XCircle size={24} className="text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800">{reportData.stats.cancelled_orders}</p>
              <p className="text-sm text-gray-500">Cancelados</p>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Ingresos por Día</h2>
              <div style={{ height: '300px' }}>
                {salesChartData && <Line data={salesChartData} options={chartOptions} />}
              </div>
            </div>

            {/* Orders Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Pedidos por Día</h2>
              <div style={{ height: '300px' }}>
                {ordersChartData && <Bar data={ordersChartData} options={chartOptions} />}
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Status Doughnut */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Distribución por Estado</h2>
              <div style={{ height: '300px' }}>
                {statusChartData && statusChartData.datasets[0].data.some(d => d > 0) ? (
                  <Doughnut data={statusChartData} options={doughnutOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Sin datos para mostrar
                  </div>
                )}
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Top 10 Productos</h2>
              {reportData.topProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Sin datos</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {reportData.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}>
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{product.product_name}</p>
                          <p className="text-xs text-gray-500">{product.total_sold} vendidos</p>
                        </div>
                      </div>
                      <span className="font-semibold text-green-600">{formatPrice(product.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sales Table */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Detalle de Ventas por Día</h2>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700"
              >
                <Download size={16} />
                Descargar datos
              </button>
            </div>
            {reportData.salesByDate.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Sin datos para el período seleccionado</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedidos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reportData.salesByDate.slice(0, 15).map((day, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{day.date}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            <ShoppingBag size={14} /> {day.orders}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-green-600">{formatPrice(day.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
};
