import React, { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../context/storeApi';
import { getStoreHeaders } from '../../utils/storeDetection';
import { 
  ShoppingCart, Package, Truck, CheckCircle, XCircle, Clock,
  Eye, RefreshCw, Search, Filter, ChevronDown, Loader2, Printer, Tag, ExternalLink, FileImage, ThumbsUp, ThumbsDown, Calendar, X
} from 'lucide-react';

interface OrderItem {
  id: string;
  product_name: string;
  product_image?: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  shipping_address?: string;
  shipping_method?: string;
  shipping_cost: number;
  subtotal: number;
  total: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method?: string;
  payment_status?: string;
  notes?: string;
  created_at: string;
  items?: OrderItem[];
  tracking_number?: string;
  shipping_carrier?: string;
  payment_receipt?: string;
  receipt_verified?: number;
}

interface ShipmentInfo {
  id: string;
  trackingNumber: string;
  labelUrl: string;
  status: string;
  carrier: string;
}

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  paid: { label: 'Pagado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  processing: { label: 'Procesando', color: 'bg-blue-100 text-blue-800', icon: Package },
  shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: 'Entregado', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export const AdminOrdersPanel: React.FC = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [shipmentInfo, setShipmentInfo] = useState<ShipmentInfo | null>(null);
  const [generatingLabel, setGeneratingLabel] = useState(false);

  // Fetch orders
  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      
      const response = await fetch(`${API_BASE}/admin/orders?${params}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          ...getStoreHeaders()
        },
      });
      
      if (!response.ok) throw new Error('Error al cargar pedidos');
      
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  // Fetch order details
  const fetchOrderDetails = async (orderId: string) => {
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          ...getStoreHeaders()
        },
      });
      
      if (!response.ok) throw new Error('Error al cargar detalles');
      
      const data = await response.json();
      setSelectedOrder(data.order);
      fetchShipmentInfo(orderId); // Also fetch shipment info
    } catch (err) {
      console.error('Error fetching order details:', err);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...getStoreHeaders()
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) throw new Error('Error al actualizar');
      
      // Refresh orders
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: status as Order['status'] } : null);
      }
    } catch (err) {
      console.error('Error updating order:', err);
    }
  };

  // Generate shipping label
  const generateShippingLabel = async (orderId: string) => {
    setGeneratingLabel(true);
    try {
      const response = await fetch(`${API_BASE}/admin/shipping/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...getStoreHeaders()
        },
        body: JSON.stringify({ orderId }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Error al generar etiqueta');
        return;
      }
      
      const data = await response.json();
      setShipmentInfo(data.shipment);
      fetchOrders(); // Refresh to update status
    } catch (err) {
      console.error('Error generating label:', err);
      alert('Error al generar etiqueta');
    } finally {
      setGeneratingLabel(false);
    }
  };

  // Fetch shipment info for an order
  const fetchShipmentInfo = async (orderId: string) => {
    try {
      const response = await fetch(`${API_BASE}/admin/shipping/${orderId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          ...getStoreHeaders()
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setShipmentInfo(data.shipment);
      } else {
        setShipmentInfo(null);
      }
    } catch (err) {
      setShipmentInfo(null);
    }
  };

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);

  const formatDate = (dateStr: string) => 
    new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Filter orders by search
  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(query) ||
      order.customer_name.toLowerCase().includes(query) ||
      order.customer_email.toLowerCase().includes(query)
    );
  });

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pedidos</h1>
          <p className="text-gray-600">Gestión de pedidos de la tienda</p>
        </div>
        <button 
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw size={18} />
          Actualizar
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número, nombre o email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus-ring-accent"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border rounded-lg focus:outline-none focus-ring-accent bg-white"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="paid">Pagados</option>
              <option value="processing">Procesando</option>
              <option value="shipped">Enviados</option>
              <option value="delivered">Entregados</option>
              <option value="cancelled">Cancelados</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: 'var(--color-accent)' }} />
          <p className="text-gray-500 mt-2">Cargando pedidos...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <XCircle size={48} className="mx-auto text-red-300 mb-4" />
          <p className="text-red-600">{error}</p>
          <button onClick={fetchOrders} className="mt-4 text-blue-600 hover:underline">
            Reintentar
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-800">No hay pedidos</h3>
          <p className="text-gray-500">
            {filterStatus !== 'all' ? 'No hay pedidos con este estado' : 'Los pedidos aparecerán aquí cuando los clientes compren'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.map(order => {
                  const statusConfig = STATUS_CONFIG[order.status];
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-mono font-semibold" style={{ color: 'var(--color-accent)' }}>{order.order_number}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{order.customer_name}</p>
                        <p className="text-sm text-gray-500">{order.customer_email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold">{formatPrice(order.total)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          {React.createElement(statusConfig.icon, { size: 12 })}
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => fetchOrderDetails(order.id)}
                          className="text-blue-600 hover:text-blue-800 p-2"
                          title="Ver detalles"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Pedido {selectedOrder.order_number}</h2>
                <p className="text-sm text-gray-500">{formatDate(selectedOrder.created_at)}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-semibold mb-2">Cliente</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Nombre:</strong> {selectedOrder.customer_name}</p>
                  <p><strong>Email:</strong> {selectedOrder.customer_email}</p>
                  {selectedOrder.customer_phone && <p><strong>Teléfono:</strong> {selectedOrder.customer_phone}</p>}
                </div>
              </div>

              {/* Shipping */}
              {selectedOrder.shipping_address && (
                <div>
                  <h3 className="font-semibold mb-2">Envío</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p><strong>Dirección:</strong> {selectedOrder.shipping_address}</p>
                    <p><strong>Método:</strong> {selectedOrder.shipping_method || 'No especificado'}</p>
                    <p><strong>Costo:</strong> {selectedOrder.shipping_cost > 0 ? formatPrice(selectedOrder.shipping_cost) : 'Gratis'}</p>
                    {shipmentInfo && (
                      <div className="mt-3 pt-3 border-t">
                        <p><strong>Tracking:</strong> <span className="font-mono">{shipmentInfo.trackingNumber}</span></p>
                        <p><strong>Estado:</strong> {shipmentInfo.status}</p>
                        <div className="flex gap-2 mt-2">
                          <a
                            href={shipmentInfo.labelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                          >
                            <Printer size={14} /> Ver Etiqueta
                          </a>
                          <a
                            href={`/tracking/${shipmentInfo.trackingNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-green-600 hover:underline"
                          >
                            <ExternalLink size={14} /> Tracking Público
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                  {!shipmentInfo && ['paid', 'processing'].includes(selectedOrder.status) && (
                    <button
                      onClick={() => generateShippingLabel(selectedOrder.id)}
                      disabled={generatingLabel}
                      className="mt-3 flex items-center gap-2 px-4 py-2 font-semibold rounded-lg disabled:opacity-50 transition-colors btn-accent"
                    >
                      {generatingLabel ? (
                        <><Loader2 size={16} className="animate-spin" /> Generando...</>
                      ) : (
                        <><Tag size={16} /> Generar Etiqueta de Envío</>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Payment Receipt */}
              {selectedOrder.payment_receipt && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <FileImage size={16} /> Comprobante de Pago
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                      <a 
                        href={selectedOrder.payment_receipt} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:underline"
                      >
                        <ExternalLink size={14} /> Ver Comprobante
                      </a>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        selectedOrder.receipt_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedOrder.receipt_verified ? 'Verificado' : 'Pendiente verificación'}
                      </span>
                    </div>
                    
                    {!selectedOrder.receipt_verified && selectedOrder.status === 'pending' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={async () => {
                            if (!confirm('¿Aprobar este comprobante y marcar como pagado?')) return;
                            try {
                              const res = await fetch(`${API_BASE}/admin/orders/${selectedOrder.id}/verify-receipt`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({ approved: true }),
                              });
                              if (res.ok) {
                                fetchOrders();
                                setSelectedOrder(null);
                              }
                            } catch (err) {
                              console.error('Error verifying receipt:', err);
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                        >
                          <ThumbsUp size={14} /> Aprobar
                        </button>
                        <button
                          onClick={async () => {
                            const reason = prompt('Motivo del rechazo:');
                            if (!reason) return;
                            try {
                              const res = await fetch(`${API_BASE}/admin/orders/${selectedOrder.id}/verify-receipt`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({ approved: false, notes: reason }),
                              });
                              if (res.ok) {
                                fetchOrders();
                                setSelectedOrder(null);
                              }
                            } catch (err) {
                              console.error('Error rejecting receipt:', err);
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                        >
                          <ThumbsDown size={14} /> Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Productos</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map(item => (
                      <div key={item.id} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                        {item.product_image && (
                          <img src={item.product_image} alt={item.product_name} className="w-12 h-12 object-cover rounded" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-gray-500">
                            Talle: {item.size} {item.color && `| Color: ${item.color}`} | Cant: {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span>Subtotal</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Envío</span>
                  <span>{selectedOrder.shipping_cost > 0 ? formatPrice(selectedOrder.shipping_cost) : 'Gratis'}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Status Update */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Actualizar Estado</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                    <button
                      key={status}
                      onClick={() => updateOrderStatus(selectedOrder.id, status)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedOrder.status === status 
                          ? config.color 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
