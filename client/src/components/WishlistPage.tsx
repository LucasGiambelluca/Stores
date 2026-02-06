import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft, Trash2, ShoppingCart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from './Toast';
import { useStoreConfig } from '../context/StoreContext';

export const WishlistPage: React.FC = () => {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showCartToast } = useToast();
  const { config } = useStoreConfig();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleAddToCart = (product: typeof items[0]) => {
    if (product.sizes && product.sizes.length > 0) {
      addToCart(product, product.sizes[0]);
      showCartToast(product.name);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <div className="bg-[#1a1a1a] text-white py-12">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft size={20} />
            Volver al inicio
          </Link>
          <div className="flex items-center gap-3">
            <Heart size={32} fill="#d32f2f" color="#d32f2f" />
            <h1 className="text-3xl md:text-4xl font-bold">Mis Favoritos</h1>
          </div>
          <p className="text-gray-400 mt-2">
            {items.length} {items.length === 1 ? 'producto guardado' : 'productos guardados'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <Heart size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Tu lista de favoritos está vacía
            </h2>
            <p className="text-gray-600 mb-6">
              Agregá productos a tu lista haciendo click en el corazón
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a1a1a] text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Ver productos
            </Link>
          </div>
        ) : (
          <>
            {/* Clear all button */}
            <div className="flex justify-end mb-6">
              <button
                onClick={() => {
                  if (confirm('¿Eliminar todos los favoritos?')) {
                    clearWishlist();
                  }
                }}
                className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
              >
                <Trash2 size={14} />
                Limpiar lista
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {items.map(product => (
                <div key={product.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <Link to={`/producto/${product.id}`} className="block">
                    <div className="relative aspect-[3/4]">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {product.discountPercent && (
                        <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 font-medium">
                          -{product.discountPercent}%
                        </span>
                      )}
                    </div>
                  </Link>
                  
                  <div className="p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      {product.category}
                    </p>
                    <Link to={`/producto/${product.id}`}>
                      <h3 className="font-medium text-gray-900 hover:text-gray-600 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    
                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-bold text-lg">{formatPrice(product.price)}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#1a1a1a] text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        <ShoppingCart size={16} />
                        Agregar
                      </button>
                      <button
                        onClick={() => removeFromWishlist(product.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Eliminar de favoritos"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
