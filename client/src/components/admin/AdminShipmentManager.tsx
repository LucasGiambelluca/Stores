import React, { useState, useEffect } from 'react';
import { 
  Package, Truck, CheckCircle, Clock, MapPin, Printer, 
  RefreshCw, Search, Filter, Download, Mail, ExternalLink,
  Loader2, AlertCircle, ChevronDown, ChevronUp, Eye
} from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { ManualLabelEditor } from './ManualLabelEditor';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Status badge colors
const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  pending_label: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente de etiqueta' },
  ready_dispatch: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Listo para despachar' },
  in_transit: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'En tránsito' },
  delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Entregado' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' },
};

interface Shipment {
  orderId: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
  items: number;
  total: number;
  orderDate: string;
  shippingStatus: string;
  trackingNumber?: string;
  carrier?: string;
  labelUrl?: string;
}

export const AdminShipmentManager: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending_label' | 'ready_dispatch' | 'in_transit' | 'delivered'>('pending_label');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [showManualLabel, setShowManualLabel] = useState(false);
  const [selectedForLabel, setSelectedForLabel] = useState<Shipment | null>(null);
  const [shippingConfig, setShippingConfig] = useState<{ provider: string; origin: any } | null>(null);

  // Load shipping config to check if manual labels are needed
  useEffect(() => {
    loadShippingConfig();
  }, []);

  const loadShippingConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/shipping-config`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setShippingConfig(data);
      }
    } catch (err) {
      console.error('Error loading shipping config:', err);
    }
  };

  // Load shipments
  useEffect(() => {
    loadShipments();
  }, [activeTab]);

  const loadShipments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/admin/orders?shippingStatus=${activeTab}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Map orders to shipment format
        const mapped = (data.orders || []).map((order: any) => ({
          orderId: order.id,
          orderNumber: order.orderNumber || `#${order.id}`,
          customer: {
            name: `${order.firstName || ''} ${order.lastName || ''}`.trim() || 'Cliente',
            email: order.email || '',
            phone: order.phone || '',
          },
          address: {
            street: order.address || '',
            city: order.city || '',
            province: order.province || '',
            postalCode: order.postalCode || '',
          },
          items: order.itemCount || 0,
          total: order.total || 0,
          orderDate: order.createdAt,
          shippingStatus: order.shippingStatus || 'pending_label',
          trackingNumber: order.trackingNumber,
          carrier: order.carrier,
          labelUrl: order.labelUrl,
        }));
        setShipments(mapped);
      }
    } catch (err) {
      console.error('Error loading shipments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter shipments by search
  const filteredShipments = shipments.filter(s => 
    s.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Actions
  const generateLabel = async (orderId: string) => {
    // Check if we should use manual labels
    const useManualLabel = !shippingConfig?.provider || 
                           shippingConfig.provider === 'manual' || 
                           shippingConfig.provider === 'none';
    
    if (useManualLabel) {
      // Open manual label editor
      const shipment = shipments.find(s => s.orderId === orderId);
      if (shipment) {
        setSelectedForLabel(shipment);
        setShowManualLabel(true);
      }
      return;
    }
    
    // Use integrated carrier
    setProcessingAction(orderId);
    try {
      const response = await fetch(`${API_URL}/admin/orders/${orderId}/generate-label`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        await loadShipments();
      }
    } catch (err) {
      console.error('Error generating label:', err);
    } finally {
      setProcessingAction(null);
    }
  };

  // Handle saving manual label
  const handleManualLabelSave = async (trackingNumber: string) => {
    if (!selectedForLabel) return;
    
    try {
      // Update order with tracking number and mark as ready for dispatch
      await fetch(`${API_URL}/admin/orders/${selectedForLabel.orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          shippingStatus: 'ready_dispatch',
          trackingNumber,
          carrier: 'manual'
        }),
      });
      await loadShipments();
    } catch (err) {
      console.error('Error updating order:', err);
    }
  };

  const markAsDispatched = async (orderId: string) => {
    setProcessingAction(orderId);
    try {
      const response = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shippingStatus: 'in_transit' }),
      });
      if (response.ok) {
        await loadShipments();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setProcessingAction(null);
    }
  };

  const markAsDelivered = async (orderId: string) => {
    setProcessingAction(orderId);
    try {
      const response = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shippingStatus: 'delivered' }),
      });
      if (response.ok) {
        await loadShipments();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setProcessingAction(null);
    }
  };

  const sendTrackingEmail = async (orderId: string) => {
    setProcessingAction(orderId);
    try {
      await fetch(`${API_URL}/admin/orders/${orderId}/send-tracking`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Error sending email:', err);
    } finally {
      setProcessingAction(null);
    }
  };

  // Bulk actions
  const generateBulkLabels = async () => {
    for (const orderId of selectedShipments) {
      await generateLabel(orderId);
    }
    setSelectedShipments([]);
  };

  const toggleSelectAll = () => {
    if (selectedShipments.length === filteredShipments.length) {
      setSelectedShipments([]);
    } else {
      setSelectedShipments(filteredShipments.map(s => s.orderId));
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const tabs = [
    { id: 'pending_label' as const, label: 'Pendientes de etiqueta', icon: Clock },
    { id: 'ready_dispatch' as const, label: 'Listos para despachar', icon: Package },
    { id: 'in_transit' as const, label: 'En tránsito', icon: Truck },
    { id: 'delivered' as const, label: 'Entregados', icon: CheckCircle },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestionar Envíos</h1>
        <p className="text-gray-600">Administrá todos los envíos pendientes desde un solo lugar</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const count = tab.id === activeTab ? filteredShipments.length : '—';
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 rounded-xl transition-all ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <IconComponent size={24} className={activeTab === tab.id ? 'text-white' : 'text-gray-400'} />
              <p className="text-2xl font-bold mt-2">{count}</p>
              <p className={`text-sm ${activeTab === tab.id ? 'text-white/80' : 'text-gray-500'}`}>{tab.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search and Actions Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número de orden, cliente o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={loadShipments}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Actualizar
          </button>
          {activeTab === 'pending_label' && selectedShipments.length > 0 && (
            <button 
              onClick={generateBulkLabels}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Printer size={18} />
              Generar {selectedShipments.length} etiquetas
            </button>
          )}
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filteredShipments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No hay envíos en este estado</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {activeTab === 'pending_label' && (
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedShipments.length === filteredShipments.length && filteredShipments.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4"
                    />
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedido</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dirección</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredShipments.map((shipment) => (
                <React.Fragment key={shipment.orderId}>
                  <tr className="hover:bg-gray-50">
                    {activeTab === 'pending_label' && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedShipments.includes(shipment.orderId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedShipments([...selectedShipments, shipment.orderId]);
                            } else {
                              setSelectedShipments(selectedShipments.filter(id => id !== shipment.orderId));
                            }
                          }}
                          className="w-4 h-4"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <p className="font-medium">{shipment.orderNumber}</p>
                      <p className="text-xs text-gray-500">{shipment.items} items</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{shipment.customer.name}</p>
                      <p className="text-xs text-gray-500">{shipment.customer.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{shipment.address.street}</p>
                      <p className="text-xs text-gray-500">
                        {shipment.address.city}, {shipment.address.province} ({shipment.address.postalCode})
                      </p>
                    </td>
                    <td className="px-4 py-3 font-medium">{formatPrice(shipment.total)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(shipment.orderDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* Actions based on status */}
                        {activeTab === 'pending_label' && (
                          <button
                            onClick={() => generateLabel(shipment.orderId)}
                            disabled={processingAction === shipment.orderId}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Generar etiqueta"
                          >
                            {processingAction === shipment.orderId 
                              ? <Loader2 size={18} className="animate-spin" />
                              : <Printer size={18} />}
                          </button>
                        )}
                        
                        {activeTab === 'ready_dispatch' && (
                          <>
                            {shipment.labelUrl && (
                              <a
                                href={shipment.labelUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                title="Imprimir etiqueta"
                              >
                                <Printer size={18} />
                              </a>
                            )}
                            <button
                              onClick={() => markAsDispatched(shipment.orderId)}
                              disabled={processingAction === shipment.orderId}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Marcar como despachado"
                            >
                              {processingAction === shipment.orderId 
                                ? <Loader2 size={18} className="animate-spin" />
                                : <Truck size={18} />}
                            </button>
                          </>
                        )}
                        
                        {activeTab === 'in_transit' && (
                          <>
                            {shipment.trackingNumber && (
                              <button
                                onClick={() => window.open(`https://www.google.com/search?q=${shipment.trackingNumber}`, '_blank')}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                                title="Ver tracking"
                              >
                                <MapPin size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => sendTrackingEmail(shipment.orderId)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Enviar tracking por email"
                            >
                              <Mail size={18} />
                            </button>
                            <button
                              onClick={() => markAsDelivered(shipment.orderId)}
                              disabled={processingAction === shipment.orderId}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Marcar como entregado"
                            >
                              {processingAction === shipment.orderId 
                                ? <Loader2 size={18} className="animate-spin" />
                                : <CheckCircle size={18} />}
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => setExpandedOrder(expandedOrder === shipment.orderId ? null : shipment.orderId)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                          title="Ver detalles"
                        >
                          {expandedOrder === shipment.orderId ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Details */}
                  {expandedOrder === shipment.orderId && (
                    <tr>
                      <td colSpan={activeTab === 'pending_label' ? 7 : 6} className="bg-gray-50 px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 mb-1">Teléfono</p>
                            <p className="font-medium">{shipment.customer.phone || '—'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Carrier</p>
                            <p className="font-medium">{shipment.carrier || 'Sin asignar'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Tracking</p>
                            <p className="font-medium font-mono">{shipment.trackingNumber || '—'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Estado</p>
                            <span className={`px-2 py-1 rounded-full text-xs ${statusColors[shipment.shippingStatus]?.bg} ${statusColors[shipment.shippingStatus]?.text}`}>
                              {statusColors[shipment.shippingStatus]?.label || shipment.shippingStatus}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Manual Label Editor Modal */}
      {selectedForLabel && (
        <ManualLabelEditor
          isOpen={showManualLabel}
          onClose={() => {
            setShowManualLabel(false);
            setSelectedForLabel(null);
          }}
          onSave={handleManualLabelSave}
          shipment={selectedForLabel}
          senderConfig={shippingConfig?.origin}
        />
      )}
    </AdminLayout>
  );
};

export default AdminShipmentManager;
