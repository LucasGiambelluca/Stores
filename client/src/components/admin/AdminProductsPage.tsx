import React, { useState } from 'react';
import { Plus, Edit, Trash2, Sparkles } from 'lucide-react';
import { useProducts, useCategories, useStoreConfig } from '../../context/StoreContext';
import { Product } from '../../types';
import { AdminLayout } from './AdminLayout';
import { ImageUpload } from './ImageUpload';
import { AIModelGenerator } from './AIModelGenerator';
import { UpgradeModal } from './UpgradeModal';

// Products Admin Page
export const AdminProducts: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { categories, addCategory } = useCategories();
  const { config } = useStoreConfig();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Filters & Bulk Actions
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<'newest' | 'oldest'>('newest');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditData, setBulkEditData] = useState<{
    price?: number;
    category?: string;
    stock?: number;
    stockStatus?: string;
  }>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este producto?')) {
      deleteProduct(id);
    }
  };

  // Check if it's a new product (not editing existing one)
  const isNewProduct = editingProduct && !products.find(p => p.id === editingProduct.id);

  const handleSaveClick = () => {
    if (!editingProduct) return;
    
    // Show confirmation only for new products
    if (isNewProduct) {
      setShowConfirmation(true);
    } else {
      // For updates, save directly
      handleConfirmSave();
    }
  };

  const handleConfirmSave = async () => {
    if (!editingProduct || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const exists = products.find(p => p.id === editingProduct.id);
      if (exists) {
        await updateProduct(editingProduct);
      } else {
        await addProduct(editingProduct);
      }
      setEditingProduct(null);
      setShowConfirmation(false);
    } catch (error: any) {
      console.error('Save product error:', error);
      
      // Check for limit reached error
      if (error.message && (
          error.message.includes('Límite de productos') || 
          error.message.includes('limit') ||
          error.message.includes('Upgrade')
      )) {
        setShowUpgradeModal(true);
        setShowConfirmation(false); // Close confirmation modal
      } else {
        alert(error instanceof Error ? error.message : 'Error al guardar el producto. Verificá que estés logueado como administrador.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  // Filter and Sort Products
  const filteredProducts = products
    .filter(p => !categoryFilter || p.category === categoryFilter)
    .sort((a, b) => {
      if (dateFilter === 'newest') {
        return String(b.id).localeCompare(String(a.id));
      }
      return String(a.id).localeCompare(String(b.id));
    });

  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, dateFilter, itemsPerPage]);

  // Bulk Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredProducts.map(p => String(p.id))));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkUpdate = async () => {
    if (!confirm(`¿Estás seguro de actualizar ${selectedIds.size} productos?`)) return;
    
    setIsSubmitting(true);
    try {
      const updates = Array.from(selectedIds).map(id => {
        const product = products.find(p => String(p.id) === id);
        if (!product) return Promise.resolve();
        
        return updateProduct({
          ...product,
          ...bulkEditData,
          // Only update fields that are defined in bulkEditData
          price: bulkEditData.price ?? product.price,
          category: bulkEditData.category ?? product.category,
          stock: bulkEditData.stock ?? product.stock,
          stockStatus: bulkEditData.stockStatus ?? product.stockStatus,
        });
      });

      await Promise.all(updates);
      setSelectedIds(new Set());
      setShowBulkEditModal(false);
      setBulkEditData({});
      alert('Productos actualizados correctamente');
    } catch (error) {
      console.error('Bulk update error:', error);
      alert('Error al actualizar productos');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
          <p className="text-gray-600">Gestión del catálogo ({products.length} productos)</p>
        </div>
        <div className="flex gap-3">
          {/* Filters */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option value="">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as 'newest' | 'oldest')}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option value="newest">Más recientes</option>
            <option value="oldest">Más antiguos</option>
          </select>

          <button 
            onClick={() => setEditingProduct({
              id: `prod-${Date.now()}`,
              name: '',
              description: '',
              price: 0,
              category: '',
              subcategory: '',
              image: '',
              sizes: ['S', 'M', 'L', 'XL'],
              stock: 100,
              images: [],
              colors: []
            })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors btn-accent"
          >
            <Plus size={20} />
            Agregar Producto
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-blue-800">{selectedIds.size} seleccionados</span>
            <button 
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-blue-600 hover:underline"
            >
              Deseleccionar todo
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBulkEditModal(true)}
              className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-50 flex items-center gap-2"
            >
              <Edit size={16} />
              Editar Masivamente
            </button>
            <button
              onClick={() => {
                if (confirm(`¿Eliminar ${selectedIds.size} productos?`)) {
                  selectedIds.forEach(id => deleteProduct(id));
                  setSelectedIds(new Set());
                }
              }}
              className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg font-medium hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 size={16} />
              Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-bold mb-4">
              {products.find(p => p.id === editingProduct.id) ? 'Editar' : 'Nuevo'} Producto
            </h3>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  value={editingProduct.description}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg h-24"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Precio</label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={e => setEditingProduct({ ...editingProduct, price: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Precio Original (opcional)</label>
                  <input
                    type="number"
                    value={editingProduct.originalPrice || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, originalPrice: parseInt(e.target.value) || undefined })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Categoría</label>
                  {isCreatingCategory ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="Nombre de nueva categoría"
                        autoFocus
                      />
                      <button 
                        onClick={async () => {
                          if (newCategoryName.trim()) {
                            try {
                              const newId = `cat-${Date.now()}`;
                              const createdCategory = await addCategory({ 
                                id: newId,
                                name: newCategoryName, 
                                slug: newCategoryName.toLowerCase().replace(/\s+/g, '-'),
                                order: categories.length + 1,
                                isActive: true
                              });
                              // Use the ID returned by the API
                              setEditingProduct({ ...editingProduct, category: createdCategory.id });
                              setIsCreatingCategory(false);
                              setNewCategoryName('');
                            } catch (error) {
                              alert(error instanceof Error ? error.message : 'Error al crear categoría');
                            }
                          }
                        }}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm"
                      >
                        OK
                      </button>
                      <button 
                        onClick={() => setIsCreatingCategory(false)}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm"
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <select
                      value={editingProduct.category}
                      onChange={e => {
                        if (e.target.value === '__new__') {
                          setIsCreatingCategory(true);
                        } else {
                          setEditingProduct({ ...editingProduct, category: e.target.value });
                        }
                      }}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="">Seleccionar...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                      <option value="__new__" className="text-blue-600 font-medium">+ Crear nueva...</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subcategoría</label>
                  <input
                    type="text"
                    value={editingProduct.subcategory}
                    onChange={e => setEditingProduct({ ...editingProduct, subcategory: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <ImageUpload
                value={editingProduct.image}
                onChange={(url) => setEditingProduct({ ...editingProduct, image: url })}
                label="Imagen destacada"
              />
              
              {/* Additional Images Gallery */}
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">
                  Imágenes adicionales (hasta 5) - La primera se muestra en hover
                </label>
                <div className="grid grid-cols-5 gap-2 mb-2">
                  {(editingProduct.images || []).map((img, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={img} 
                        alt={`Imagen ${index + 1}`} 
                        className="w-full aspect-square object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newImages = [...(editingProduct.images || [])];
                          newImages.splice(index, 1);
                          setEditingProduct({ ...editingProduct, images: newImages });
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-1 left-1 text-xs bg-black/70 text-white px-1 rounded">
                          Hover
                        </span>
                      )}
                    </div>
                  ))}
                  {(!editingProduct.images || editingProduct.images.length < 5) && (
                    <ImageUpload
                      value=""
                      onChange={(url) => {
                        const newImages = [...(editingProduct.images || []), url];
                        setEditingProduct({ ...editingProduct, images: newImages });
                      }}
                      label=""
                      compact
                    />
                  )}
                </div>
              </div>

              {/* Color Options */}
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Colores disponibles</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(editingProduct.colors || []).map((color, index) => {
                    const colorName = typeof color === 'string' ? color : color.name;
                    const colorHex = typeof color === 'string' ? '#888' : color.hex;
                    return (
                      <div 
                        key={index} 
                        className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full group"
                      >
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300" 
                          style={{ backgroundColor: colorHex }}
                        />
                        <span className="text-sm">{colorName}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newColors = [...(editingProduct.colors || [])];
                            newColors.splice(index, 1);
                            setEditingProduct({ ...editingProduct, colors: newColors as typeof editingProduct.colors });
                          }}
                          className="text-red-500 text-xs opacity-0 group-hover:opacity-100"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nombre del color (ej: Rojo)"
                    id="new-color-name"
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  />
                  <input
                    type="color"
                    id="new-color-hex"
                    className="w-12 h-10 rounded cursor-pointer"
                    defaultValue="#000000"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const nameInput = document.getElementById('new-color-name') as HTMLInputElement;
                      const hexInput = document.getElementById('new-color-hex') as HTMLInputElement;
                      if (nameInput.value.trim()) {
                        const newColor = { name: nameInput.value.trim(), hex: hexInput.value };
                        setEditingProduct({ 
                          ...editingProduct, 
                          colors: [...(editingProduct.colors || []), newColor] as typeof editingProduct.colors 
                        });
                        nameInput.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Agregar
                  </button>
                </div>
              </div>

              {/* Variant Stock - Stock per Color */}
              {(editingProduct.colors || []).length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="block text-sm font-semibold text-blue-800 mb-3">
                    📦 Stock por color <span className="font-normal text-blue-600">(opcional)</span>
                  </label>
                  <p className="text-xs text-blue-600 mb-3">
                    Define el stock disponible para cada variante de color. Si no lo defines, se usará el stock general.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {(editingProduct.colors || []).map((color, index) => {
                      const colorName = typeof color === 'string' ? color : (color.name || `Color ${index + 1}`);
                      const colorHex = typeof color === 'string' ? '#888' : color.hex;
                      const currentStock = editingProduct.variantsStock?.[colorName] ?? '';
                      return (
                        <div key={index} className="flex items-center gap-2 bg-white p-2 rounded-lg border">
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" 
                            style={{ backgroundColor: colorHex }}
                          />
                          <span className="text-sm flex-1 truncate">{colorName}</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Stock"
                            value={currentStock}
                            onChange={e => {
                              const newVariantsStock = { ...(editingProduct.variantsStock || {}) };
                              const val = e.target.value;
                              if (val === '' || val === undefined) {
                                delete newVariantsStock[colorName];
                              } else {
                                newVariantsStock[colorName] = parseInt(val) || 0;
                              }
                              
                              // Auto-calculate total stock if variants are defined
                              const newStock = Object.keys(newVariantsStock).length > 0 
                                ? Object.values(newVariantsStock).reduce((sum, qty) => sum + qty, 0)
                                : (editingProduct.stock ?? 0);
                                
                              setEditingProduct({ 
                                ...editingProduct, 
                                variantsStock: newVariantsStock,
                                stock: newStock
                              });
                            }}
                            className="w-20 px-2 py-1 text-sm border rounded text-center"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* AI Model Generator Button - Only for Retail */}
              {editingProduct.image && config.storeType === 'retail' && (
                <button
                  type="button"
                  onClick={() => setShowAIGenerator(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg hover:opacity-90 transition"
                >
                  <Sparkles size={18} />
                  Generar foto con modelo IA
                </button>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Stock (unidades)
                    {Object.keys(editingProduct.variantsStock || {}).length > 0 && (
                      <span className="ml-2 text-xs text-blue-600 font-normal">
                        (Calculado automáticamente)
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={editingProduct.stock ?? 100}
                    onChange={e => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                    className={`w-full px-4 py-2 border rounded-lg ${Object.keys(editingProduct.variantsStock || {}).length > 0 ? 'bg-gray-100 text-gray-500' : ''}`}
                    min="0"
                    disabled={Object.keys(editingProduct.variantsStock || {}).length > 0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Talles (separados por coma)</label>
                  <input
                    type="text"
                    value={editingProduct.sizes.join(', ')}
                    onChange={e => setEditingProduct({ ...editingProduct, sizes: e.target.value.split(',').map(s => s.trim()) })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProduct.isBestSeller || false}
                    onChange={e => setEditingProduct({ ...editingProduct, isBestSeller: e.target.checked })}
                  />
                  <span className="text-sm">Best Seller</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProduct.isNew || false}
                    onChange={e => setEditingProduct({ ...editingProduct, isNew: e.target.checked })}
                  />
                  <span className="text-sm">Nuevo</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProduct.isOnSale || false}
                    onChange={e => setEditingProduct({ ...editingProduct, isOnSale: e.target.checked })}
                  />
                  <span className="text-sm">En Sale</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button 
                onClick={handleSaveClick} 
                disabled={isSubmitting}
                className={`text-white px-4 py-2 rounded-lg ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {isSubmitting ? 'Guardando...' : (isNewProduct ? 'Crear Producto' : 'Guardar Cambios')}
              </button>
              <button 
                onClick={() => setEditingProduct(null)} 
                disabled={isSubmitting}
                className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 w-4">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.size === paginatedProducts.length && paginatedProducts.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        // Select all on current page
                        const newSelected = new Set(selectedIds);
                        paginatedProducts.forEach(p => newSelected.add(String(p.id)));
                        setSelectedIds(newSelected);
                      } else {
                        // Deselect all on current page
                        const newSelected = new Set(selectedIds);
                        paginatedProducts.forEach(p => newSelected.delete(String(p.id)));
                        setSelectedIds(newSelected);
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedProducts.map((product) => (
                <tr key={product.id} className={`hover:bg-gray-50 ${selectedIds.has(String(product.id)) ? 'bg-blue-50' : ''}`}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(String(product.id))}
                      onChange={(e) => handleSelectOne(String(product.id), e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded" />
                      <div>
                        <p className="font-medium text-gray-800">{product.name}</p>
                        <p className="text-xs text-gray-500">ID: {product.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {categories.find(c => c.id === product.category)?.name || 'Sin categoría'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{formatPrice(product.price)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      product.stockStatus === 'Última' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {product.stockStatus || 'En stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingProduct(product)} className="p-2 hover:bg-gray-100 rounded-lg">
                        <Edit size={16} className="text-gray-600" />
                      </button>
                      <button onClick={() => handleDelete(String(product.id))} className="p-2 hover:bg-red-50 rounded-lg">
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="px-6 py-4 border-t flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Mostrar:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="border rounded px-2 py-1 bg-white"
            >
              {[10, 20, 30, 40, 50].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
            <span>por página</span>
            <span className="ml-4">
              {filteredProducts.length} productos en total
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded bg-white disabled:opacity-50 hover:bg-gray-50"
            >
              Anterior
            </button>
            <span className="text-sm font-medium">
              Página {currentPage} de {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1 border rounded bg-white disabled:opacity-50 hover:bg-gray-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* AI Model Generator Modal */}
      {showAIGenerator && editingProduct?.image && (
        <AIModelGenerator
          garmentImageUrl={editingProduct.image}
          onImageGenerated={(url) => {
            // Add the AI-generated image to product's images array
            const existingImages = editingProduct.images || [];
            setEditingProduct({
              ...editingProduct,
              images: [...existingImages, url]
            });
            setShowAIGenerator(false);
          }}
          onClose={() => setShowAIGenerator(false)}
        />
      )}

      {/* Confirmation Modal for New Products */}
      {showConfirmation && editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-3">¿Confirmar creación de producto?</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                {editingProduct.image && (
                  <img src={editingProduct.image} alt="" className="w-16 h-16 object-cover rounded-lg" />
                )}
                <div>
                  <p className="font-semibold">{editingProduct.name || 'Sin nombre'}</p>
                  <p className="text-sm text-gray-600">${editingProduct.price?.toLocaleString('es-AR')}</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Se creará un nuevo producto en el catálogo. ¿Estás seguro?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmSave}
                disabled={isSubmitting}
                className={`flex-1 py-2.5 rounded-lg font-semibold ${isSubmitting ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
              >
                {isSubmitting ? 'Creando...' : 'Sí, crear producto'}
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Editar {selectedIds.size} productos</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Precio</label>
                <input
                  type="number"
                  placeholder="Dejar vacío para no cambiar"
                  onChange={e => setBulkEditData({ ...bulkEditData, price: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoría</label>
                <select
                  onChange={e => setBulkEditData({ ...bulkEditData, category: e.target.value || undefined })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">No cambiar</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stock</label>
                <input
                  type="number"
                  placeholder="Dejar vacío para no cambiar"
                  onChange={e => setBulkEditData({ ...bulkEditData, stock: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estado de Stock</label>
                <select
                  onChange={e => setBulkEditData({ ...bulkEditData, stockStatus: e.target.value || undefined })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">No cambiar</option>
                  <option value="En stock">En stock</option>
                  <option value="Sin stock">Sin stock</option>
                  <option value="Última">Última unidad</option>
                  <option value="Por encargo">Por encargo</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleBulkUpdate}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Actualizando...' : 'Aplicar Cambios'}
              </button>
              <button
                onClick={() => {
                  setShowBulkEditModal(false);
                  setBulkEditData({});
                }}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan="Starter" // TODO: Get dynamic plan from context
        limitType="products"
      />
    </AdminLayout>
  );
};
