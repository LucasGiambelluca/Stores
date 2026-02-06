import React, { useState } from 'react';
import { useProducts } from '../context/StoreContext';
import { ChevronLeft, ChevronRight, X, Grid3X3, LayoutGrid, Maximize2, Sparkles, Ruler } from 'lucide-react';
import { Product } from '../types';
import { VirtualTryOn } from './VirtualTryOn';
import { SizeCalculator } from './SizeCalculator';
import { OrbitLoader } from './OrbitLoader';

// Fullscreen Image Modal for catalog viewing
const CatalogModal: React.FC<{
  product: Product;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentIndex: number;
  total: number;
}> = ({ product, onClose, onNext, onPrev, currentIndex, total }) => {
  const [imageIndex, setImageIndex] = useState(0);
  const images = product.images && product.images.length > 0 ? product.images : [product.image];

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowUp') setImageIndex(i => Math.max(0, i - 1));
      if (e.key === 'ArrowDown') setImageIndex(i => Math.min(images.length - 1, i + 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev, images.length]);

  // Prevent body scroll
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 text-white">
        <span className="text-lg font-medium truncate flex-1 mr-4">{product.name}</span>
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-70">{currentIndex + 1} / {total}</span>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Main Image */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <img
          src={images[imageIndex]}
          alt={product.name}
          className="max-w-full max-h-full object-contain"
        />

        {/* Product navigation arrows */}
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-white/20 hover:bg-white/40 rounded-full text-white transition-all"
        >
          <ChevronLeft size={32} />
        </button>
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-white/20 hover:bg-white/40 rounded-full text-white transition-all"
        >
          <ChevronRight size={32} />
        </button>
      </div>

      {/* Image thumbnails (if multiple) */}
      {images.length > 1 && (
        <div className="flex justify-center gap-2 p-4 bg-black/50">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setImageIndex(idx)}
              className={`w-16 h-20 overflow-hidden border-2 transition-all ${
                idx === imageIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Main Catalog Page
export const CatalogPage: React.FC = () => {
  const { products, isLoading } = useProducts();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [gridSize, setGridSize] = useState<2 | 3 | 4>(3);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');
  const [tryOnProduct, setTryOnProduct] = useState<Product | null>(null);
  const [sizeCalcProduct, setSizeCalcProduct] = useState<Product | null>(null);

  // Get unique subcategories
  const categories = [...new Set(products.map(p => p.subcategory).filter(Boolean))];

  // Filter products
  let filteredProducts = filterCategory
    ? products.filter(p => p.subcategory === filterCategory)
    : [...products];

  // Sort products
  if (sortBy === 'price-asc') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-desc') {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'name') {
    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'newest') {
    filteredProducts.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  } else if (sortBy === 'discount') {
    filteredProducts.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
  }

  const openProduct = (index: number) => setSelectedIndex(index);
  const closeModal = () => setSelectedIndex(null);
  
  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % filteredProducts.length);
    }
  };
  
  const goToPrev = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === 0 ? filteredProducts.length - 1 : selectedIndex - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <OrbitLoader size="lg" text="Cargando catálogo..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Clean Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Logo/Title */}
            <h1 className="text-2xl font-bold tracking-tight">CATÁLOGO</h1>

            {/* Controls */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-w-[140px]"
              >
                <option value="">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-w-[140px]"
              >
                <option value="">Ordenar por</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
                <option value="name">Nombre A-Z</option>
                <option value="newest">Más nuevos</option>
                <option value="discount">Mayor descuento</option>
              </select>

              {/* Grid Size Toggle */}
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setGridSize(2)}
                  className={`p-2 transition ${gridSize === 2 ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
                  title="2 columnas"
                >
                  <LayoutGrid size={20} />
                </button>
                <button
                  onClick={() => setGridSize(3)}
                  className={`p-2 transition ${gridSize === 3 ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
                  title="3 columnas"
                >
                  <Grid3X3 size={20} />
                </button>
                <button
                  onClick={() => setGridSize(4)}
                  className={`p-2 transition ${gridSize === 4 ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
                  title="4 columnas"
                >
                  <Maximize2 size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Product Grid */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-xl">No hay productos disponibles</p>
          </div>
        ) : (
          <div className={`grid gap-2 sm:gap-4 ${
            gridSize === 2 ? 'grid-cols-2' : 
            gridSize === 3 ? 'grid-cols-2 sm:grid-cols-3' : 
            'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
          }`}>
            {filteredProducts.map((product, idx) => (
              <div
                key={product.id}
                className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
              >
                {/* Image - clickable for fullscreen */}
                <button
                  onClick={() => openProduct(idx)}
                  className="w-full aspect-[3/4] bg-gray-100 overflow-hidden focus:outline-none"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </button>

                {/* Product Info & Actions */}
                <div className="p-2 sm:p-3">
                  <h3 className="font-medium text-sm sm:text-base line-clamp-2 text-gray-900">
                    {product.name}
                  </h3>
                  {product.colors && product.colors.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {product.colors.join(' • ')}
                    </p>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => setSizeCalcProduct(product)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-blue-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-600 transition"
                    >
                      <Ruler size={14} />
                      Talle
                    </button>
                    <button
                      onClick={() => setTryOnProduct(product)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:opacity-90 transition"
                    >
                      <Sparkles size={14} />
                      Probar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Product count */}
        <div className="text-center mt-8 text-sm text-gray-500">
          {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
        </div>
      </main>

      {/* Fullscreen Modal */}
      {selectedIndex !== null && filteredProducts[selectedIndex] && (
        <CatalogModal
          product={filteredProducts[selectedIndex]}
          onClose={closeModal}
          onNext={goToNext}
          onPrev={goToPrev}
          currentIndex={selectedIndex}
          total={filteredProducts.length}
        />
      )}

      {/* Virtual Try-On Modal */}
      {tryOnProduct && (
        <VirtualTryOn
          product={tryOnProduct}
          isOpen={true}
          onClose={() => setTryOnProduct(null)}
        />
      )}

      {/* Size Calculator Modal */}
      {sizeCalcProduct && (
        <SizeCalculator
          product={sizeCalcProduct}
          isOpen={true}
          onClose={() => setSizeCalcProduct(null)}
        />
      )}
    </div>
  );
};

export default CatalogPage;
