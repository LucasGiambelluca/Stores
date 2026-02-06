import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useProducts } from '../../context/StoreContext';
import { Link } from 'react-router-dom';

export const LowStockAlert: React.FC = () => {
  const { products } = useProducts();
  
  // Filter products with low stock (e.g., < 5)
  const lowStockProducts = products
    .filter(p => (p.stock ?? 0) < 5)
    .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
    .slice(0, 5); // Show top 5 most critical

  if (lowStockProducts.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
      <div className="p-4 border-b border-orange-100 bg-orange-50/50 flex justify-between items-center">
        <div className="flex items-center gap-2 text-orange-700">
          <AlertTriangle size={20} />
          <h3 className="font-semibold">Alerta de Stock Bajo</h3>
        </div>
        <Link to="/admin/products" className="text-xs font-medium text-orange-600 hover:text-orange-800 flex items-center gap-1">
          Ver todos <ArrowRight size={14} />
        </Link>
      </div>
      <div className="divide-y divide-orange-50">
        {lowStockProducts.map(product => (
          <div key={product.id} className="p-3 flex items-center justify-between hover:bg-orange-50/30 transition-colors">
            <div className="flex items-center gap-3">
              <img src={product.image} alt={product.name} className="w-10 h-10 rounded-md object-cover bg-gray-100" />
              <div>
                <p className="text-sm font-medium text-gray-800 line-clamp-1">{product.name}</p>
                <p className="text-xs text-gray-500">ID: {product.id.toString().slice(-6)}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {product.stock} u.
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
