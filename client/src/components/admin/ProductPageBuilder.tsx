/**
 * ProductPageBuilder
 * 
 * Admin interface for customizing product page layouts.
 * Allows drag & drop of widgets with plan-based access restrictions.
 * 
 * Based on PageBuilder.tsx but specialized for product pages.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Edit, Trash2, Save, X, GripVertical, Eye, EyeOff, Lock,
  Image, Tag, ShoppingCart, FileText, Star, Grid, Layout, Clock, Film,
  Ruler, Award, Play, AlertTriangle, RefreshCw, Check, Package, PlusCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStoreConfig } from '../../context/StoreContext';
import { useLicenseStatus } from '../../hooks/useLicenseStatus';
import { AdminLayout } from './AdminLayout';
import { 
  ProductWidgetType, 
  ProductPageBlock, 
  PlanLevel,
  WIDGET_PLAN_REQUIREMENTS,
  ProductPageConfig
} from '../../types';
import { getStoreHeaders } from '../../utils/storeDetection';

// API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Widget type definitions with metadata
const PRODUCT_WIDGET_TYPES: {
  type: ProductWidgetType;
  label: string;
  icon: React.ReactNode;
  description: string;
  plan: PlanLevel;
}[] = [
  // Core (Free)
  { type: 'product-gallery', label: 'Galería', icon: <Image size={20} />, description: 'Carrusel de imágenes del producto', plan: 'free' },
  { type: 'product-info', label: 'Información', icon: <Tag size={20} />, description: 'Nombre, precio, badges', plan: 'free' },
  { type: 'product-buy-box', label: 'Caja de Compra', icon: <ShoppingCart size={20} />, description: 'Selector de talle, cantidad, carrito', plan: 'free' },
  { type: 'product-description', label: 'Descripción', icon: <FileText size={20} />, description: 'Texto descriptivo del producto', plan: 'free' },
  // Starter+
  { type: 'product-reviews', label: 'Reseñas', icon: <Star size={20} />, description: 'Reviews de clientes', plan: 'starter' },
  { type: 'related-products', label: 'Relacionados', icon: <Grid size={20} />, description: 'Productos similares', plan: 'starter' },
  { type: 'product-specs', label: 'Especificaciones', icon: <Ruler size={20} />, description: 'Tabla de especificaciones', plan: 'starter' },
  // Pro+
  { type: 'product-banner', label: 'Banner Promo', icon: <Layout size={20} />, description: 'Banner promocional inline', plan: 'pro' },
  { type: 'product-countdown', label: 'Countdown', icon: <Clock size={20} />, description: 'Temporizador de oferta', plan: 'pro' },
  { type: 'product-size-guide', label: 'Guía de Talles', icon: <Ruler size={20} />, description: 'Tabla de medidas', plan: 'pro' },
  { type: 'product-bundles', label: 'Packs de Descuento', icon: <Package size={20} />, description: 'Ofertas por cantidad (x2, x3)', plan: 'pro' },
  { type: 'product-cross-sell', label: 'Complementos', icon: <PlusCircle size={20} />, description: 'Armá tu pack con otros productos', plan: 'pro' },
  // Enterprise
  { type: 'product-video', label: 'Video', icon: <Film size={20} />, description: 'Video embed (YouTube/Vimeo)', plan: 'enterprise' },
  { type: 'product-custom-html', label: 'HTML Custom', icon: <FileText size={20} />, description: 'Código HTML/JS personalizado', plan: 'enterprise' },
  { type: 'product-3d-viewer', label: 'Visor 3D', icon: <Play size={20} />, description: 'Modelo 3D interactivo', plan: 'enterprise' },
];

// Plan hierarchy for comparison
const PLAN_HIERARCHY: Record<PlanLevel, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
};

// Default widget configs
const getDefaultConfig = (type: ProductWidgetType): Record<string, any> => {
  switch (type) {
    case 'product-gallery':
      return { layout: 'carousel', showThumbnails: true, enableZoom: true, enableLightbox: true };
    case 'product-info':
      return { showCategory: true, showRating: true, showBadges: true, showViewingCount: true };
    case 'product-buy-box':
      return { buttonStyle: 'solid', showWishlistButton: true, showWhatsAppButton: true, showBuyNowButton: true };
    case 'product-description':
      return { showTitle: true, expandable: false };
    case 'product-reviews':
      return { showSummary: true, limit: 5 };
    case 'related-products':
      return { title: 'También te puede gustar', limit: 4, layout: 'grid' };
    case 'product-specs':
      return { title: 'Especificaciones', layout: 'table' };
    case 'product-banner':
      return { image: '', title: '', subtitle: '', buttonText: '', buttonLink: '' };
    case 'product-countdown':
      return { 
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        title: '¡Oferta por tiempo limitado!' 
      };
    case 'product-size-guide':
      return { title: 'Guía de Talles' };
    case 'product-bundles':
      return { 
        title: 'Ahorrá llevando más',
        bundles: [
          { quantity: 2, discount: 15, label: 'Pack x2', isPopular: true },
          { quantity: 3, discount: 20, label: 'Pack x3', isPopular: false }
        ]
      };
    case 'product-cross-sell':
      return { 
        title: 'Armá tu pack',
        subtitle: 'Seleccioná los complementos',
        products: [],
        discount: 0
      };
    case 'product-video':
      return { title: 'Video del Producto', provider: 'youtube', videoId: '' };
    case 'product-custom-html':
      return { html: '<!-- Tu código aquí -->' };
    case 'product-3d-viewer':
      return { modelUrl: '' };
    default:
      return {};
  }
};

export const ProductPageBuilder = () => {
  const { config: storeConfig } = useStoreConfig();
  const { license, loading: licenseLoading } = useLicenseStatus();
  
  // Get plan from license (priority) or fallback to storeConfig
  // Normalize to lowercase to match PlanLevel types (free, starter, pro, enterprise)
  const rawPlan = license?.plan || storeConfig.plan || 'free';
  const storePlan: PlanLevel = rawPlan.toLowerCase() as PlanLevel;
  
  // State
  const [config, setConfig] = useState<ProductPageConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ProductPageBlock | null>(null);
  const [showLayoutModal, setShowLayoutModal] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // ... (existing code)


  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  
  // Check if user has access to a widget
  const hasAccess = (requiredPlan: PlanLevel): boolean => {
    return PLAN_HIERARCHY[storePlan] >= PLAN_HIERARCHY[requiredPlan];
  };
  
  // Fetch config from API
  const fetchConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/product-page-config`, {
        headers: {
          ...getStoreHeaders(),
          'Authorization': `Bearer ${sessionStorage.getItem('token') || ''}`,
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch config');
      
      const data = await response.json();
      
      // Initialize layoutConfig if missing
      if (!data.layoutConfig) {
        data.layoutConfig = {
          gridType: 'classic',
          leftColumn: ['product-gallery'],
          rightColumn: ['product-info', 'product-buy-box', 'product-description', 'product-countdown', 'product-banner', 'product-size-guide'],
          fullWidth: ['related-products', 'product-reviews', 'product-specs']
        };
      }
      
      setConfig(data);
    } catch (err) {
      console.error('[ProductPageBuilder] Fetch error:', err);
      // Initialize with defaults
      setConfig({
        id: null,
        storeId: '',
        blocks: getDefaultBlocks(),
        globalStyles: {},
        layoutConfig: {
          gridType: 'classic',
          leftColumn: ['product-gallery'],
          rightColumn: ['product-info', 'product-buy-box', 'product-description'],
          fullWidth: ['related-products']
        },
        isEnabled: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Save config to API
  const saveConfig = async () => {
    if (!config) return;
    
    try {
      setIsSaving(true);
      const response = await fetch(`${API_URL}/product-page-config`, {
        method: 'PUT',
        headers: {
          ...getStoreHeaders(),
          'Authorization': `Bearer ${sessionStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blocks: config.blocks,
          globalStyles: config.globalStyles,
          layoutConfig: config.layoutConfig,
          isEnabled: true, // Always enabled
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save');
      }
      
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 2000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Get default blocks for new stores
  const getDefaultBlocks = (): ProductPageBlock[] => [
    { id: 'default-gallery', type: 'product-gallery', order: 1, isActive: true, requiredPlan: 'free', config: getDefaultConfig('product-gallery') },
    { id: 'default-info', type: 'product-info', order: 2, isActive: true, requiredPlan: 'free', config: getDefaultConfig('product-info') },
    { id: 'default-buybox', type: 'product-buy-box', order: 3, isActive: true, requiredPlan: 'free', config: getDefaultConfig('product-buy-box') },
    { id: 'default-description', type: 'product-description', order: 4, isActive: true, requiredPlan: 'free', config: getDefaultConfig('product-description') },
  ];
  
  // Load on mount
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);
  
  // Add new block
  const handleAddBlock = (type: ProductWidgetType) => {
    if (!config) return;
    
    const requiredPlan = WIDGET_PLAN_REQUIREMENTS[type];
    if (!hasAccess(requiredPlan)) return;
    
    const newOrder = config.blocks.length > 0 
      ? Math.max(...config.blocks.map(b => b.order)) + 1 
      : 1;
    
    const newBlock: ProductPageBlock = {
      id: `block-${Date.now()}`,
      type,
      order: newOrder,
      isActive: true,
      requiredPlan,
      config: getDefaultConfig(type),
    };
    
    // Note: layoutConfig is automatically synced by the backend on save
    // No need to manually update it here - just update blocks
    setConfig({ 
      ...config, 
      blocks: [...config.blocks, newBlock]
    });
    setShowAddModal(false);
    setEditingBlock(newBlock);
  };
  
  // Delete block
  // Note: layoutConfig is automatically synced by the backend on save
  const handleDeleteBlock = (id: string) => {
    if (!config) return;
    setConfig({ 
      ...config, 
      blocks: config.blocks.filter(b => b.id !== id)
    });
  };
  
  // Toggle block active
  const handleToggleActive = (id: string) => {
    if (!config) return;
    setConfig({
      ...config,
      blocks: config.blocks.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b),
    });
  };
  
  // Toggle custom layout enabled
  const handleToggleEnabled = () => {
    if (!config) return;
    setConfig({ ...config, isEnabled: !config.isEnabled });
  };
  
  // Save block edits
  const handleSaveBlock = () => {
    if (!config || !editingBlock) return;
    setConfig({
      ...config,
      blocks: config.blocks.map(b => b.id === editingBlock.id ? editingBlock : b),
    });
    setEditingBlock(null);
  };
  
  // Drag handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!hasAccess('pro')) return; // Reordering is Pro+ feature
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };
  
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id !== draggedId) setDragOverId(id);
  };
  
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!config || !draggedId || draggedId === targetId) {
      setDragOverId(null);
      return;
    }
    
    const sorted = [...config.blocks].sort((a, b) => a.order - b.order);
    const draggedIndex = sorted.findIndex(b => b.id === draggedId);
    const targetIndex = sorted.findIndex(b => b.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const [draggedItem] = sorted.splice(draggedIndex, 1);
    sorted.splice(targetIndex, 0, draggedItem);
    
    const reordered = sorted.map((item, index) => ({ ...item, order: index + 1 }));
    setConfig({ ...config, blocks: reordered });
    setDraggedId(null);
    setDragOverId(null);
  };
  
  // Get widget icon
  const getWidgetIcon = (type: ProductWidgetType) => {
    return PRODUCT_WIDGET_TYPES.find(w => w.type === type)?.icon || <Layout size={20} />;
  };
  
  // Get widget label
  const getWidgetLabel = (type: ProductWidgetType) => {
    return PRODUCT_WIDGET_TYPES.find(w => w.type === type)?.label || type;
  };
  
  // Sorted blocks
  const sortedBlocks = config?.blocks ? [...config.blocks].sort((a, b) => a.order - b.order) : [];
  

      
  // Preview config
  const handlePreview = () => {
    if (!config) return;
    
    // Save draft to sessionStorage
    sessionStorage.setItem('product_page_preview', JSON.stringify({
      ...config,
      isEnabled: true // Always enabled in preview
    }));
    
    // Open preview in new tab
    const previewUrl = `/products/preview?preview=true`;
    window.open(previewUrl, '_blank');
  };

  if (isLoading || licenseLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin text-gray-400" size={32} />
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Product Page Builder</h1>
            {hasAccess('pro') && (
              <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                Pro
              </span>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowLayoutModal(true)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              title="Configurar Layout"
            >
              <Grid size={20} />
              <span>Layout</span>
            </button>

            <button
              onClick={handlePreview}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              title="Ver vista previa"
            >
              <Eye size={20} />
              <span>Preview</span>
            </button>
            
            <button
              onClick={saveConfig}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isSaving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
              <span>Guardar</span>
            </button>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm"
            >
              <Plus size={20} />
              <span>Agregar Widget</span>
            </button>
          </div>
        </div>
        
        {/* Plan Warning */}
        {!hasAccess('pro') && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-amber-800">Plan {storePlan}</p>
              <p className="text-sm text-amber-700">
                Reordenar widgets y estilos personalizados requieren plan Pro o superior.
              </p>
            </div>
          </div>
        )}

      {/* Error Toast */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      
      {/* Saved Toast */}
      {showSavedToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Check size={18} />
          Guardado
        </div>
      )}
      
      {/* Blocks List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {sortedBlocks.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Layout size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="font-medium">No hay widgets configurados</p>
            <p className="text-sm">Agregá widgets para construir tu página de producto</p>
          </div>
        ) : (
          <div className="divide-y">
            {sortedBlocks.map((block) => {
              const canDrag = hasAccess('pro');
              const widgetInfo = PRODUCT_WIDGET_TYPES.find(w => w.type === block.type);
              
              return (
                <div
                  key={block.id}
                  draggable={canDrag}
                  onDragStart={(e) => handleDragStart(e, block.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, block.id)}
                  onDrop={(e) => handleDrop(e, block.id)}
                  className={`
                    flex items-center gap-4 p-4 transition-all
                    ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}
                    ${!block.isActive ? 'opacity-50 bg-gray-50' : ''}
                    ${draggedId === block.id ? 'opacity-50 bg-yellow-50' : ''}
                    ${dragOverId === block.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
                  `}
                >
                  {/* Drag handle */}
                  <div className={`text-gray-400 p-1 ${canDrag ? 'hover:text-gray-600' : 'opacity-30'}`}>
                    {canDrag ? <GripVertical size={20} /> : <Lock size={16} />}
                  </div>
                  
                  {/* Block info */}
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    {getWidgetIcon(block.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{getWidgetLabel(block.type)}</p>
                    <p className="text-sm text-gray-500">{widgetInfo?.description}</p>
                  </div>
                  
                  {/* Plan badge */}
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    block.requiredPlan === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                    block.requiredPlan === 'pro' ? 'bg-blue-100 text-blue-700' :
                    block.requiredPlan === 'starter' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {block.requiredPlan}
                  </span>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(block.id)}
                      className={`p-2 rounded-lg ${block.isActive ? 'hover:bg-gray-100' : 'hover:bg-green-50'}`}
                      title={block.isActive ? 'Ocultar' : 'Mostrar'}
                    >
                      {block.isActive ? <Eye size={16} className="text-gray-600" /> : <EyeOff size={16} className="text-gray-400" />}
                    </button>
                    <button
                      onClick={() => setEditingBlock(block)}
                      className="p-2 rounded-lg hover:bg-blue-50"
                      title="Editar"
                    >
                      <Edit size={16} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="p-2 rounded-lg hover:bg-red-50"
                      title="Eliminar"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Layout Configuration Modal */}
      {showLayoutModal && config?.layoutConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Configuración de Layout</h2>
                <p className="text-sm text-gray-500">Organizá tus widgets en la grilla</p>
              </div>
              <button onClick={() => setShowLayoutModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {/* Grid Type Selector */}
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo de Grilla</label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => setConfig({
                        ...config,
                        layoutConfig: { ...config.layoutConfig!, gridType: 'classic' }
                      })}
                      className={`p-4 border rounded-xl text-center transition-all ${
                        config.layoutConfig.gridType === 'classic' 
                          ? 'border-black bg-gray-50 ring-1 ring-black' 
                          : 'hover:border-gray-300'
                      }`}
                    >
                      <div className="flex gap-1 h-12 mb-2 justify-center">
                        <div className="w-1/3 bg-gray-300 rounded-sm"></div>
                        <div className="w-2/3 bg-gray-300 rounded-sm"></div>
                      </div>
                      <span className="text-sm font-medium">Clásico (1/3 - 2/3)</span>
                    </button>
                    
                    <button
                      onClick={() => setConfig({
                        ...config,
                        layoutConfig: { ...config.layoutConfig!, gridType: 'full-width' }
                      })}
                      className={`p-4 border rounded-xl text-center transition-all ${
                        config.layoutConfig.gridType === 'full-width' 
                          ? 'border-black bg-gray-50 ring-1 ring-black' 
                          : 'hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col gap-1 h-12 mb-2 justify-center px-4">
                        <div className="w-full h-full bg-gray-300 rounded-sm"></div>
                      </div>
                      <span className="text-sm font-medium">Ancho Completo</span>
                    </button>
                    
                    <button
                      onClick={() => setConfig({
                        ...config,
                        layoutConfig: { ...config.layoutConfig!, gridType: 'gallery-left' }
                      })}
                      className={`p-4 border rounded-xl text-center transition-all ${
                        config.layoutConfig.gridType === 'gallery-left' 
                          ? 'border-black bg-gray-50 ring-1 ring-black' 
                          : 'hover:border-gray-300'
                      }`}
                    >
                      <div className="flex gap-1 h-12 mb-2 justify-center">
                        <div className="w-1/2 bg-gray-300 rounded-sm"></div>
                        <div className="w-1/2 bg-gray-300 rounded-sm"></div>
                      </div>
                      <span className="text-sm font-medium">Mitad / Mitad</span>
                    </button>
                  </div>
                </div>
                
                {/* Widget Positions */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Posición de Widgets</h3>
                  <div className="space-y-2">
                    {config.blocks.filter(b => b.isActive).map(block => {
                      const currentPos = 
                        config.layoutConfig!.leftColumn.includes(block.type) ? 'left' :
                        config.layoutConfig!.rightColumn.includes(block.type) ? 'right' :
                        'full';
                        
                      return (
                        <div key={block.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-500">
                              {getWidgetIcon(block.type)}
                            </div>
                            <span className="font-medium">{getWidgetLabel(block.type)}</span>
                          </div>
                          
                          <select
                            value={currentPos}
                            onChange={(e) => {
                              const newPos = e.target.value;
                              const type = block.type;
                              const layout = { ...config.layoutConfig! };
                              
                              // Remove from all lists
                              layout.leftColumn = layout.leftColumn.filter(t => t !== type);
                              layout.rightColumn = layout.rightColumn.filter(t => t !== type);
                              layout.fullWidth = layout.fullWidth.filter(t => t !== type);
                              
                              // Add to new list
                              if (newPos === 'left') layout.leftColumn.push(type);
                              else if (newPos === 'right') layout.rightColumn.push(type);
                              else layout.fullWidth.push(type);
                              
                              setConfig({ ...config, layoutConfig: layout });
                            }}
                            className="text-sm border rounded-md px-2 py-1"
                          >
                            <option value="left">Izquierda (Galería)</option>
                            <option value="right">Derecha (Info)</option>
                            <option value="full">Ancho Completo (Abajo)</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowLayoutModal(false)}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Widget Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Agregar Widget</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 gap-4">
                {PRODUCT_WIDGET_TYPES.map((widget) => {
                  const canUse = hasAccess(widget.plan);
                  return (
                    <button
                      key={widget.type}
                      onClick={() => canUse && handleAddBlock(widget.type)}
                      disabled={!canUse}
                      className={`
                        p-4 border rounded-xl text-left transition-all
                        ${canUse 
                          ? 'hover:border-black hover:shadow-md cursor-pointer' 
                          : 'opacity-50 cursor-not-allowed bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          canUse ? 'bg-gray-100' : 'bg-gray-200'
                        }`}>
                          {canUse ? widget.icon : <Lock size={16} className="text-gray-400" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{widget.label}</p>
                          <p className="text-sm text-gray-500">{widget.description}</p>
                          <span className={`mt-2 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                            widget.plan === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                            widget.plan === 'pro' ? 'bg-blue-100 text-blue-700' :
                            widget.plan === 'starter' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {widget.plan}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Widget Modal */}
      {editingBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Editar {getWidgetLabel(editingBlock.type)}</h2>
              <button onClick={() => setEditingBlock(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {/* Widget-specific config form */}
              <WidgetConfigForm 
                block={editingBlock} 
                onChange={(config) => setEditingBlock({ ...editingBlock, config })} 
              />
            </div>
            
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setEditingBlock(null)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveBlock}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
};

// Widget Config Forms
const WidgetConfigForm: React.FC<{
  block: ProductPageBlock;
  onChange: (config: Record<string, any>) => void;
}> = ({ block, onChange }) => {
  const config = block.config;
  
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };
  
  switch (block.type) {
    case 'product-gallery':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Layout</label>
            <select
              value={config.layout || 'carousel'}
              onChange={(e) => updateConfig('layout', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="carousel">Carrusel</option>
              <option value="grid">Grilla</option>
              <option value="stack">Apilado</option>
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.showThumbnails ?? true}
              onChange={(e) => updateConfig('showThumbnails', e.target.checked)}
            />
            <span className="text-sm">Mostrar miniaturas</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.enableZoom ?? true}
              onChange={(e) => updateConfig('enableZoom', e.target.checked)}
            />
            <span className="text-sm">Habilitar zoom</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.enableLightbox ?? true}
              onChange={(e) => updateConfig('enableLightbox', e.target.checked)}
            />
            <span className="text-sm">Habilitar lightbox</span>
          </label>
        </div>
      );
    
    case 'product-info':
      return (
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.showCategory ?? true}
              onChange={(e) => updateConfig('showCategory', e.target.checked)}
            />
            <span className="text-sm">Mostrar categoría</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.showRating ?? true}
              onChange={(e) => updateConfig('showRating', e.target.checked)}
            />
            <span className="text-sm">Mostrar rating</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.showBadges ?? true}
              onChange={(e) => updateConfig('showBadges', e.target.checked)}
            />
            <span className="text-sm">Mostrar badges (Nuevo, Oferta, etc.)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.showViewingCount ?? true}
              onChange={(e) => updateConfig('showViewingCount', e.target.checked)}
            />
            <span className="text-sm">Mostrar contador de visitas</span>
          </label>
        </div>
      );
    
    case 'product-buy-box':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Estilo del botón</label>
            <select
              value={config.buttonStyle || 'solid'}
              onChange={(e) => updateConfig('buttonStyle', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="solid">Sólido</option>
              <option value="outline">Borde</option>
              <option value="ghost">Transparente</option>
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.showWishlistButton ?? true}
              onChange={(e) => updateConfig('showWishlistButton', e.target.checked)}
            />
            <span className="text-sm">Mostrar botón de favoritos</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.showWhatsAppButton ?? true}
              onChange={(e) => updateConfig('showWhatsAppButton', e.target.checked)}
            />
            <span className="text-sm">Mostrar botón de WhatsApp</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.showBuyNowButton ?? true}
              onChange={(e) => updateConfig('showBuyNowButton', e.target.checked)}
            />
            <span className="text-sm">Mostrar "Comprar Ahora"</span>
          </label>
        </div>
      );
    
    case 'product-description':
      return (
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.showTitle ?? true}
              onChange={(e) => updateConfig('showTitle', e.target.checked)}
            />
            <span className="text-sm">Mostrar título "Descripción"</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.expandable ?? false}
              onChange={(e) => updateConfig('expandable', e.target.checked)}
            />
            <span className="text-sm">Colapsable (Ver más/menos)</span>
          </label>
        </div>
      );
    
    case 'related-products':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              type="text"
              value={config.title || ''}
              onChange={(e) => updateConfig('title', e.target.value)}
              placeholder="También te puede gustar"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cantidad de productos</label>
            <input
              type="number"
              min={2}
              max={8}
              value={config.limit || 4}
              onChange={(e) => updateConfig('limit', parseInt(e.target.value))}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Layout</label>
            <select
              value={config.layout || 'grid'}
              onChange={(e) => updateConfig('layout', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="grid">Grilla</option>
              <option value="carousel">Carrusel</option>
            </select>
          </div>
        </div>
      );

    case 'product-size-guide':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              type="text"
              value={config.title || 'Guía de Talles'}
              onChange={(e) => updateConfig('title', e.target.value)}
              placeholder="Ej: Guía de Talles"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Modo de visualización</label>
            <select
              value={config.mode || 'standard'}
              onChange={(e) => updateConfig('mode', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="standard">Tabla Estándar</option>
              <option value="image">Imagen Personalizada</option>
            </select>
          </div>
          
          {config.mode === 'image' && (
            <div>
              <label className="block text-sm font-medium mb-1">URL de la Imagen</label>
              <input
                type="text"
                value={config.imageUrl || ''}
                onChange={(e) => updateConfig('imageUrl', e.target.value)}
                placeholder="https://ejemplo.com/talles.jpg"
                className="w-full border rounded-lg px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Recomendamos una imagen de al menos 800px de ancho.
              </p>
            </div>
          )}
        </div>
      );

    case 'product-reviews':
      return (
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.showSummary ?? true}
              onChange={(e) => updateConfig('showSummary', e.target.checked)}
            />
            <span className="text-sm">Mostrar resumen (estrellas)</span>
          </label>
          <div>
            <label className="block text-sm font-medium mb-1">Límite de reseñas</label>
            <input
              type="number"
              min={1}
              max={20}
              value={config.limit || 5}
              onChange={(e) => updateConfig('limit', parseInt(e.target.value))}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>
      );



    case 'product-bundles':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              type="text"
              value={config.title || 'Ahorrá llevando más'}
              onChange={(e) => updateConfig('title', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
            <p>Los packs se configuran automáticamente:</p>
            <ul className="list-disc ml-4 mt-1">
              <li>Pack x2: 15% descuento</li>
              <li>Pack x3: 20% descuento</li>
            </ul>
            <p className="mt-2 text-xs">Próximamente: Configuración personalizada de descuentos.</p>
          </div>
        </div>
      );

    case 'product-cross-sell':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              type="text"
              value={config.title || 'Armá tu pack'}
              onChange={(e) => updateConfig('title', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subtítulo</label>
            <input
              type="text"
              value={config.subtitle || ''}
              onChange={(e) => updateConfig('subtitle', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descuento del Pack (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={config.discount || 0}
              onChange={(e) => updateConfig('discount', parseInt(e.target.value))}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-700">
            <p>Los productos complementarios se seleccionarán automáticamente de la misma categoría o se pueden configurar manualmente en el futuro.</p>
          </div>
        </div>
      );

    case 'product-specs':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              type="text"
              value={config.title || 'Especificaciones'}
              onChange={(e) => updateConfig('title', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Layout</label>
            <select
              value={config.layout || 'table'}
              onChange={(e) => updateConfig('layout', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="table">Tabla</option>
              <option value="list">Lista</option>
            </select>
          </div>
        </div>
      );

    case 'product-banner':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Imagen de fondo (URL)</label>
            <input
              type="text"
              value={config.image || ''}
              onChange={(e) => updateConfig('image', e.target.value)}
              placeholder="https://..."
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              type="text"
              value={config.title || ''}
              onChange={(e) => updateConfig('title', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subtítulo</label>
            <input
              type="text"
              value={config.subtitle || ''}
              onChange={(e) => updateConfig('subtitle', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Texto Botón</label>
              <input
                type="text"
                value={config.buttonText || ''}
                onChange={(e) => updateConfig('buttonText', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Link Botón</label>
              <input
                type="text"
                value={config.buttonLink || ''}
                onChange={(e) => updateConfig('buttonLink', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Altura</label>
            <input
              type="text"
              value={config.height || '300px'}
              onChange={(e) => updateConfig('height', e.target.value)}
              placeholder="Ej: 300px"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>
      );

    case 'product-countdown':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fecha de fin</label>
            <input
              type="datetime-local"
              value={config.endDate ? new Date(config.endDate).toISOString().slice(0, 16) : ''}
              onChange={(e) => updateConfig('endDate', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              type="text"
              value={config.title || ''}
              onChange={(e) => updateConfig('title', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tema</label>
            <select
              value={config.theme || 'light'}
              onChange={(e) => updateConfig('theme', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="light">Claro (Rojo)</option>
              <option value="dark">Oscuro</option>
            </select>
          </div>
        </div>
      );

    case 'product-video':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">URL del Video (YouTube/Vimeo)</label>
            <input
              type="text"
              value={config.videoUrl || ''}
              onChange={(e) => updateConfig('videoUrl', e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.autoplay ?? false}
              onChange={(e) => updateConfig('autoplay', e.target.checked)}
            />
            <span className="text-sm">Autoplay</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.showControls ?? true}
              onChange={(e) => updateConfig('showControls', e.target.checked)}
            />
            <span className="text-sm">Mostrar controles</span>
          </label>
        </div>
      );

    case 'product-custom-html':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Código HTML/JS</label>
            <textarea
              value={config.html || ''}
              onChange={(e) => updateConfig('html', e.target.value)}
              rows={10}
              className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
              placeholder="<div>Contenido personalizado...</div>"
            />
            <p className="text-xs text-amber-600 mt-1">
              ⚠️ Ten cuidado al insertar scripts externos.
            </p>
          </div>
        </div>
      );

    case 'product-3d-viewer':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">URL del Modelo (.glb/.gltf)</label>
            <input
              type="text"
              value={config.modelUrl || ''}
              onChange={(e) => updateConfig('modelUrl', e.target.value)}
              placeholder="https://..."
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Poster (Imagen de carga)</label>
            <input
              type="text"
              value={config.poster || ''}
              onChange={(e) => updateConfig('poster', e.target.value)}
              placeholder="https://..."
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.autoRotate ?? true}
              onChange={(e) => updateConfig('autoRotate', e.target.checked)}
            />
            <span className="text-sm">Rotación automática</span>
          </label>
        </div>
      );
    
    default:
      return (
        <div className="text-center text-gray-500 py-8">
          <p>Configuración para este widget próximamente</p>
        </div>
      );
  }
};

export default ProductPageBuilder;
