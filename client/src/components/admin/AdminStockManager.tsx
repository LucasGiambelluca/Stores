import React, { useState, useEffect } from 'react';
import { Package, Search, AlertTriangle, Edit2, Save, X, RefreshCw } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { getStoreHeaders } from '../../utils/storeDetection';

interface ProductStock {
  id: string;
  name: string;
  image: string | null;
  stock: number;
  price: number;
  category?: string;
}

export const AdminStockManager: React.FC = () => {
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const LOW_STOCK_THRESHOLD = 5;

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products?limit=500', {
        headers: getStoreHeaders()
      });
      const data = await response.json();
      setProducts(data.products.map((p: any) => ({
        id: p.id,
        name: p.name,
        image: p.image,
        stock: p.stock ?? 0,
        price: p.price,
        category: p.category,
      })));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSaveStock = async (productId: string) => {
    setSaving(true);
    try {
      const token = sessionStorage.getItem('token'); // Fixed: was 'auth_token'
      
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...getStoreHeaders()
        },
        body: JSON.stringify({
          stock: editStock,
        }),
      });

      if (response.ok) {
        setProducts(products.map(p => 
          p.id === productId ? { ...p, stock: editStock } : p
        ));
        setEditingId(null);
      } else {
        alert('Error al guardar stock');
      }
    } catch (error) {
      console.error('Error saving stock:', error);
      alert('Error al guardar stock');
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (product: ProductStock) => {
    setEditingId(product.id);
    setEditStock(product.stock);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditStock(0);
  };

  // Filter products
  let filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filter === 'low') {
    filteredProducts = filteredProducts.filter(p => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD);
  } else if (filter === 'out') {
    filteredProducts = filteredProducts.filter(p => p.stock <= 0);
  }

  // Stats
  const stats = {
    total: products.length,
    lowStock: products.filter(p => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length,
    outOfStock: products.filter(p => p.stock <= 0).length,
  };

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Stock</h1>
        <p className="text-gray-600">Control de inventario de productos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-500">Total productos</p>
            </div>
          </div>
        </div>
        <div 
          className={`bg-white rounded-xl shadow-sm p-4 cursor-pointer transition-all ${filter === 'low' ? 'ring-2 ring-yellow-400' : ''}`}
          onClick={() => setFilter(filter === 'low' ? 'all' : 'low')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
              <p className="text-sm text-gray-500">Stock bajo (&le;5)</p>
            </div>
          </div>
        </div>
        <div 
          className={`bg-white rounded-xl shadow-sm p-4 cursor-pointer transition-all ${filter === 'out' ? 'ring-2 ring-red-400' : ''}`}
          onClick={() => setFilter(filter === 'out' ? 'all' : 'out')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
              <p className="text-sm text-gray-500">Sin stock</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Filter buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('low')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'low' 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Stock bajo
            </button>
            <button
              onClick={() => setFilter('out')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'out' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Sin stock
            </button>
          </div>
          
          <button
            onClick={fetchProducts}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Products table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Cargando productos...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No se encontraron productos
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {product.category || '-'}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === product.id ? (
                      <input
                        type="number"
                        min="0"
                        value={editStock}
                        onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <span className={`font-semibold ${
                        product.stock <= 0 
                          ? 'text-red-600' 
                          : product.stock <= LOW_STOCK_THRESHOLD 
                            ? 'text-yellow-600' 
                            : 'text-green-600'
                      }`}>
                        {product.stock}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {product.stock <= 0 ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                        Sin stock
                      </span>
                    ) : product.stock <= LOW_STOCK_THRESHOLD ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                        Stock bajo
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                        En stock
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingId === product.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSaveStock(product.id)}
                          disabled={saving}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Save className="w-5 h-5" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(product)}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminStockManager;
