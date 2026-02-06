import React, { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, Search, Mail, Phone, ShoppingBag, DollarSign, 
  Eye, XCircle, Loader2, UserCheck, UserX, ChevronDown
} from 'lucide-react';

interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  created_at: string;
  order_count: number;
  total_spent: number;
}

interface GuestCustomer {
  email: string;
  name: string;
  phone?: string;
  order_count: number;
  total_spent: number;
  last_order: string;
}

interface CustomerDetails extends Customer {
  orders: {
    id: string;
    order_number: string;
    total: number;
    status: string;
    created_at: string;
  }[];
  addresses: {
    id: string;
    street: string;
    city: string;
    postal_code: string;
  }[];
}

export const AdminCustomersPanel: React.FC = () => {
  const { token } = useAuth();
  const [tab, setTab] = useState<'registered' | 'guests'>('registered');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [guests, setGuests] = useState<GuestCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch customers
  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`/api/admin/customers?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Error al cargar clientes');
      
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch guest customers
  const fetchGuests = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/admin/customers/guests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Error al cargar invitados');
      
      const data = await response.json();
      setGuests(data.guests || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'registered') {
      fetchCustomers();
    } else {
      fetchGuests();
    }
  }, [tab, searchQuery]);

  // Fetch customer details
  const fetchCustomerDetails = async (customerId: string) => {
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Error al cargar detalles');
      
      const data = await response.json();
      setSelectedCustomer(data.customer);
    } catch (err) {
      console.error('Error fetching customer details:', err);
    }
  };

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);

  const formatDate = (dateStr: string) => 
    new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
        <p className="text-gray-600">Gestión de clientes de la tienda</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTab('registered')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            tab === 'registered' 
              ? 'bg-accent text-primary' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <UserCheck size={18} />
          Registrados
        </button>
        <button
          onClick={() => setTab('guests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            tab === 'guests' 
              ? 'bg-accent text-primary' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <UserX size={18} />
          Invitados
        </button>
      </div>

      {/* Search */}
      {tab === 'registered' && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por email, nombre o teléfono..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus-ring-accent"
            />
          </div>
        </div>
      )}

      {/* Loading/Error */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: 'var(--color-accent)' }} />
          <p className="text-gray-500 mt-2">Cargando clientes...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <XCircle size={48} className="mx-auto text-red-300 mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <>
          {/* Registered Customers Table */}
          {tab === 'registered' && (
            customers.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800">No hay clientes registrados</h3>
                <p className="text-gray-500">Los clientes aparecerán aquí cuando se registren</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedidos</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Gastado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registro</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {customers.map(customer => (
                        <tr key={customer.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{customer.name || 'Sin nombre'}</p>
                            <p className="text-sm text-gray-500">{customer.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            {customer.phone && (
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Phone size={14} /> {customer.phone}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              <ShoppingBag size={14} /> {customer.order_count}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-green-600">{formatPrice(customer.total_spent)}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDate(customer.created_at)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => fetchCustomerDetails(customer.id)}
                              className="text-blue-600 hover:text-blue-800 p-2"
                              title="Ver detalles"
                            >
                              <Eye size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

          {/* Guest Customers Table */}
          {tab === 'guests' && (
            guests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800">No hay clientes invitados</h3>
                <p className="text-gray-500">Los clientes que compran sin registrarse aparecerán aquí</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedidos</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Gastado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último Pedido</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {guests.map((guest, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{guest.name}</p>
                            <p className="text-sm text-gray-500">{guest.email}</p>
                            {guest.phone && (
                              <p className="text-xs text-gray-400">{guest.phone}</p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              <ShoppingBag size={14} /> {guest.order_count}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-green-600">{formatPrice(guest.total_spent)}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDate(guest.last_order)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{selectedCustomer.name || 'Cliente'}</h2>
                <p className="text-sm text-gray-500">{selectedCustomer.email}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600">Total Pedidos</p>
                  <p className="text-2xl font-bold text-blue-800">{selectedCustomer.order_count}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">Total Gastado</p>
                  <p className="text-2xl font-bold text-green-800">{formatPrice(selectedCustomer.total_spent)}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="font-semibold mb-2">Información de Contacto</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    {selectedCustomer.email}
                  </p>
                  {selectedCustomer.phone && (
                    <p className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-400" />
                      {selectedCustomer.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Orders */}
              {selectedCustomer.orders?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Historial de Pedidos</h3>
                  <div className="space-y-2">
                    {selectedCustomer.orders.map(order => (
                      <div key={order.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div>
                          <p className="font-mono font-medium" style={{ color: 'var(--color-accent)' }}>{order.order_number}</p>
                          <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatPrice(order.total)}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
