import React, { useState, useRef } from 'react';
import { 
  Plus, Edit, Trash2, Save, X, GripVertical, Eye, EyeOff,
  Layout, Image, Type, Grid, Tag, Clock, Sparkles, Layers, Instagram, MessageSquare,
  Columns, LayoutGrid, PanelLeft, PanelRight, Mail, RefreshCw, Film, MapPin
} from 'lucide-react';
import { useHomepageBlocks, useCategories, useStoreConfig } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { HomepageBlock, BlockType } from '../../types';
import { AdminLayout } from './AdminLayout';
import { ImageUpload } from './ImageUpload';
import { saveStoreConfig } from '../../context/storeApi';
import { ConfirmModal } from './ConfirmModal';

// Block type configurations
const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ReactNode; description: string; category?: string; requiredPlan?: 'pro' | 'enterprise' }[] = [
  // Content Blocks
  { type: 'hero-slider', label: 'Hero Slider', icon: <Layout size={20} />, description: 'Slider de imágenes principal', category: 'content' },
  { type: 'features', label: 'Features Bar', icon: <Sparkles size={20} />, description: 'Barra de beneficios (envío, cuotas, etc.)', category: 'content' },
  { type: 'promo-cards', label: 'Promo Cards', icon: <Tag size={20} />, description: 'Tarjetas promocionales', category: 'content' },
  { type: 'categories', label: 'Categorías', icon: <Layers size={20} />, description: 'Sección de categorías', category: 'content' },
  { type: 'product-grid', label: 'Productos', icon: <Grid size={20} />, description: 'Grilla de productos filtrable', category: 'content' },
  { type: 'bestsellers', label: 'Más Vendidos', icon: <Grid size={20} />, description: 'Productos más vendidos', category: 'content' },
  { type: 'banner', label: 'Banner', icon: <Image size={20} />, description: 'Banner con texto y botón', category: 'content' },
  { type: 'image-banner', label: 'Imagen Banner', icon: <Image size={20} />, description: 'Solo imagen (sin texto)', category: 'content' },
  { type: 'text-block', label: 'Texto/HTML', icon: <Type size={20} />, description: 'Bloque de texto o HTML personalizado', category: 'content' },
  { type: 'countdown', label: 'Countdown', icon: <Clock size={20} />, description: 'Temporizador de ofertas', category: 'content' },
  { type: 'social-feed', label: 'Redes Sociales', icon: <Instagram size={20} />, description: 'Reels de Instagram o TikToks', category: 'content' },
  { type: 'popup', label: 'Popup/Modal', icon: <MessageSquare size={20} />, description: 'Ventana emergente para promos', category: 'content' },
  { type: 'newsletter', label: 'Newsletter', icon: <Mail size={20} />, description: 'Suscripción a newsletter', category: 'content' },
  { type: 'video-hero', label: 'Video Hero', icon: <Film size={20} />, description: 'Video full-width con overlay y CTA', category: 'content' },
  { type: 'premium_hero', label: 'Premium Hero (Parallax)', icon: <Sparkles size={20} />, description: 'Banner animado con efectos 3D y Parallax', category: 'content' },
  { type: 'map', label: 'Mapa', icon: <MapPin size={20} />, description: 'Google Maps con dirección editable', category: 'content', requiredPlan: 'pro' },
  // Layout Blocks
  { type: 'two-column', label: '2 Columnas', icon: <Columns size={20} />, description: 'Dos contenedores 50%/50%', category: 'layout' },
  { type: 'three-column', label: '3 Columnas', icon: <LayoutGrid size={20} />, description: 'Tres contenedores iguales', category: 'layout' },
  { type: 'asymmetric-left', label: 'Asimétrico Izq', icon: <PanelLeft size={20} />, description: '33%/66% - izquierda más chica', category: 'layout' },
  { type: 'asymmetric-right', label: 'Asimétrico Der', icon: <PanelRight size={20} />, description: '66%/33% - derecha más chica', category: 'layout' },
];

// Default configs for new blocks
const getDefaultConfig = (type: BlockType): Record<string, any> => {
  switch (type) {
    case 'hero-slider':
      return { useBanners: true };
    case 'features':
      return {
        items: [
          { icon: 'Truck', title: 'ENVÍO GRATIS', subtitle: 'En compras mayores a $200.000' },
          { icon: 'CreditCard', title: '6 CUOTAS', subtitle: 'Sin interés con tarjeta' },
          { icon: 'Banknote', title: '15% OFF', subtitle: 'Pagando con transferencia' },
          { icon: 'RefreshCcw', title: 'DEVOLUCIÓN', subtitle: '30 días para cambios' },
        ]
      };
    case 'promo-cards':
      return { 
        cards: [
          { type: 'large', title: 'NEW DROP', subtitle: 'Remeras desde $6.500', image: '', buttonText: 'Ver Colección', buttonLink: '#productos' },
          { type: 'small', title: '¿Querés estampar?', subtitle: 'tus remeras?', image: '', buttonText: 'Consultar', buttonLink: 'whatsapp' },
          { type: 'small', title: 'TODOS NUESTROS PRODUCTOS', subtitle: 'xmenosmasprendas.com', image: '', buttonText: 'Ver todo', buttonLink: '#productos' },
        ]
      };
    case 'categories':
      return {};
    case 'product-grid':
      return { title: 'Productos', filter: 'all', showFilters: true };
    case 'bestsellers':
      return { title: 'Los Más Vendidos' };
    case 'banner':
      return { image: '', title: 'Título del banner', subtitle: '', buttonText: 'Ver más', buttonLink: '#productos' };
    case 'image-banner':
      return { image: '', link: '', height: '300px' };
    case 'text-block':
      return { content: '<p>Tu contenido aquí</p>', backgroundColor: '#ffffff' };
    case 'countdown':
      return { 
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        title: '¡Oferta Especial!', 
        subtitle: 'Aprovechá antes de que termine' 
      };
    case 'social-feed':
      return { 
        title: 'Seguinos en redes',
        urls: [],
        showFollowButton: true,
        instagramHandle: '',
        backgroundColor: '#f5f5f5'
      };
    case 'popup':
      return {
        title: '¡Oferta Especial!',
        subtitle: 'Suscribite y obtené un 10% de descuento',
        popupType: 'newsletter',
        showEmailInput: true,
        emailPlaceholder: 'Tu email',
        submitButtonText: 'Suscribirme',
        successMessage: '¡Gracias por suscribirte!',
        size: 'medium',
        position: 'center',
        trigger: 'delay',
        delaySeconds: 3,
        showOnce: true,
        showOnMobile: true,
        showOnDesktop: true,
      };
    case 'newsletter':
      return {
        title: 'Suscribite y recibí ofertas exclusivas',
        subtitle: 'Enterate primero de las novedades y promociones',
        buttonText: 'Suscribirme',
        placeholder: 'Tu correo electrónico',
        successMessage: '¡Gracias por suscribirte!',
      };
    case 'video-hero':
      return {
        videoUrl: '',
        posterImage: '',
        title: 'Título Principal',
        subtitle: 'Subtítulo descriptivo',
        pretitle: '',
        contentPosition: 'bottom-left',
        gradientType: 'bottom',
        height: '80vh',
        minHeight: '500px',
        maxHeight: '900px',
        primaryButtonText: 'Ver Más',
        primaryButtonLink: '#productos',
        secondaryButtonText: '',
        secondaryButtonLink: '',
        showScrollIndicator: false,
      };
    case 'premium_hero':
      return {
        title: 'Experiencia Premium',
        subtitle: 'Descubrí nuestra nueva colección con estilo.',
        pretitle: 'NUEVO LANZAMIENTO',
        buttonText: 'Ver Colección',
        buttonLink: '#productos',
        backgroundImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop',
        height: '85vh',
        parallaxIntensity: 30,
        enableTilt: true,
        enableTextReveal: true,
        enableScrollIndicator: true,
        overlayOpacity: 0.4,
        gradientType: 'bottom',
        contentPosition: 'center',
        textAlign: 'center'
      };
    // Layout blocks - have slots for content
    case 'two-column':
      return {
        slots: [
          { type: 'text', title: '', body: '', textAlign: 'center', backgroundColor: '#f3f4f6' },
          { type: 'text', title: '', body: '', textAlign: 'center', backgroundColor: '#f3f4f6' }
        ],
        gap: '1rem',
        backgroundColor: 'transparent'
      };
    case 'three-column':
      return {
        slots: [
          { type: 'text', title: '', body: '', textAlign: 'center', backgroundColor: '#f3f4f6' },
          { type: 'text', title: '', body: '', textAlign: 'center', backgroundColor: '#f3f4f6' },
          { type: 'text', title: '', body: '', textAlign: 'center', backgroundColor: '#f3f4f6' }
        ],
        gap: '1rem',
        backgroundColor: 'transparent'
      };
    case 'asymmetric-left':
      return {
        slots: [
          { type: 'text', title: '', body: '', textAlign: 'center', backgroundColor: '#f3f4f6' },
          { type: 'text', title: '', body: '', textAlign: 'center', backgroundColor: '#f3f4f6' }
        ],
        gap: '1rem',
        backgroundColor: 'transparent'
      };
    case 'asymmetric-right':
      return {
        slots: [
          { type: 'text', title: '', body: '', textAlign: 'center', backgroundColor: '#f3f4f6' },
          { type: 'text', title: '', body: '', textAlign: 'center', backgroundColor: '#f3f4f6' }
        ],
        gap: '1rem',
        backgroundColor: 'transparent'
      };
    case 'map':
      return {
        address: '',
        zoom: 15,
        height: '400px',
        showTitle: true,
        title: 'Dónde Estamos'
      };
    default:
      return {};
  }
};

interface PageBuilderProps {
  title?: string;
  configKey?: 'homepage' | 'about';
}

export const PageBuilder: React.FC<PageBuilderProps> = ({ 
  title = 'Page Builder',
  configKey = 'homepage'
}) => {
  const { allBlocks: homepageBlocks, updateHomepageBlocks } = useHomepageBlocks();
  const { config, updateConfig } = useStoreConfig();
  const { user } = useAuth();
  
  // Select blocks based on configKey
  const allBlocks = configKey === 'about' ? (config.aboutBlocks || []) : homepageBlocks;
  const updateBlocks = (blocks: HomepageBlock[]) => {
    if (configKey === 'about') {
      updateConfig({ ...config, aboutBlocks: blocks });
    } else {
      updateHomepageBlocks(blocks);
    }
  };
  const [editingBlock, setEditingBlock] = useState<HomepageBlock | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; blockId: string; blockName: string }>({
    isOpen: false,
    blockId: '',
    blockName: ''
  });

  const handleSaveToServer = async () => {
    setIsSaving(true);
    try {
      const payload = configKey === 'about' 
        ? { aboutBlocks: allBlocks }
        : { homepageBlocks: allBlocks };
      await saveStoreConfig(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save to server:', error);
      alert('Error al guardar la configuración en el servidor. Por favor revisá tu conexión.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sortedBlocks = [...allBlocks].sort((a, b) => a.order - b.order);

  const handleAddBlock = (type: BlockType) => {
    const newOrder = allBlocks.length > 0 
      ? Math.max(...allBlocks.map(b => b.order)) + 1 
      : 1;
    
    const blockInfo = BLOCK_TYPES.find(t => t.type === type);
    const newBlock: HomepageBlock = {
      id: `block-${Date.now()}`,
      type,
      order: newOrder,
      isActive: true,
      title: blockInfo?.label || type,
      config: getDefaultConfig(type)
    };
    
    updateBlocks([...allBlocks, newBlock]);
    setShowAddModal(false);
    setEditingBlock(newBlock);
    showSaved();
  };

  const handleDeleteBlock = (id: string) => {
    const block = allBlocks.find(b => b.id === id);
    setDeleteConfirm({
      isOpen: true,
      blockId: id,
      blockName: block?.title || 'este bloque'
    });
  };
  
  const confirmDelete = () => {
    const newBlocks = allBlocks.filter(b => b.id !== deleteConfirm.blockId);
    updateBlocks(newBlocks);
    setDeleteConfirm({ isOpen: false, blockId: '', blockName: '' });
    showSaved();
  };

  const handleToggleActive = (id: string) => {
    updateBlocks(
      allBlocks.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b)
    );
    showSaved();
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== draggedId) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedId || draggedId === targetId) {
      setDragOverId(null);
      return;
    }

    const sorted = [...allBlocks].sort((a, b) => a.order - b.order);
    const draggedIndex = sorted.findIndex(b => b.id === draggedId);
    const targetIndex = sorted.findIndex(b => b.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Remove dragged item and insert at new position
    const [draggedItem] = sorted.splice(draggedIndex, 1);
    sorted.splice(targetIndex, 0, draggedItem);

    // Reassign order values
    const reordered = sorted.map((item, index) => ({
      ...item,
      order: index + 1
    }));

    updateBlocks(reordered);
    setDraggedId(null);
    setDragOverId(null);
    showSaved();
  };

  const handleSaveBlock = () => {
    if (!editingBlock) return;
    updateBlocks(
      allBlocks.map(b => b.id === editingBlock.id ? editingBlock : b)
    );
    setEditingBlock(null);
    showSaved();
  };

  const getBlockIcon = (type: BlockType) => {
    return BLOCK_TYPES.find(t => t.type === type)?.icon || <Layout size={20} />;
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Page Builder</h1>
          <p className="text-gray-600">
            Diseñá tu homepage arrastrando bloques
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveToServer}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              saved ? 'bg-green-600 text-white' : 'bg-black text-white hover:bg-gray-800'
            } ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
          >
            {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            {saved ? 'Guardado!' : (isSaving ? 'Guardando...' : 'Guardar Cambios')}
          </button>
          <button
            onClick={() => {
              setShowPreview(!showPreview);
              if (!showPreview) setPreviewKey(k => k + 1);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              showPreview ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Eye size={18} />
            {showPreview ? 'Cerrar Preview' : 'Ver Preview'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors btn-accent"
          >
            <Plus size={20} />
            Agregar Bloque
          </button>
        </div>
      </div>

      {/* Main Content with optional Preview */}
      <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Blocks List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {sortedBlocks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Layout size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="font-medium">No hay bloques configurados</p>
            <p className="text-sm">Agregá bloques para construir tu homepage</p>
          </div>
        ) : (
          <div className="divide-y">
            {sortedBlocks.map((block) => (
              <div 
                key={block.id}
                ref={draggedId === block.id ? dragNodeRef : null}
                draggable
                onDragStart={(e) => handleDragStart(e, block.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, block.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, block.id)}
                className={`
                  flex items-center gap-4 p-4 cursor-grab active:cursor-grabbing transition-all
                  ${!block.isActive ? 'opacity-50 bg-gray-50' : ''}
                  ${draggedId === block.id ? 'opacity-50 bg-yellow-50' : ''}
                  ${dragOverId === block.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
                `}
              >
                {/* Drag handle */}
                <div className="text-gray-400 hover:text-gray-600 cursor-grab p-1">
                  <GripVertical size={20} />
                </div>

                {/* Block info */}
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  {getBlockIcon(block.type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{block.title || block.type}</p>
                  <p className="text-sm text-gray-500">
                    {BLOCK_TYPES.find(t => t.type === block.type)?.description}
                  </p>
                </div>

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
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    title="Editar"
                  >
                    <Edit size={16} className="text-gray-600" />
                  </button>
                  <button 
                    onClick={() => handleDeleteBlock(block.id)} 
                    className="p-2 hover:bg-red-50 rounded-lg"
                    title="Eliminar"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-gray-500" />
                <span className="font-medium">Preview de la Home</span>
              </div>
              <button
                onClick={() => setPreviewKey(k => k + 1)}
                className="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center gap-1"
              >
                <RefreshCw size={14} />
                Refrescar
              </button>
            </div>
            <div className="h-[600px] overflow-hidden">
              <iframe
                key={previewKey}
                src={`/?storeId=${sessionStorage.getItem('tiendita_store_id') || user?.storeId || ''}`}
                className="w-full h-full border-0"
                style={{ transform: 'scale(0.6)', transformOrigin: 'top left', width: '166%', height: '166%' }}
              />
            </div>
            <div className="p-3 bg-gray-50 border-t text-xs text-gray-500 text-center">
              💡 Los cambios se guardan automáticamente. Clickeá "Refrescar" para ver los cambios.
            </div>
          </div>
        )}
      </div>

      {/* Saved indicator */}
      {saved && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          ✓ Cambios guardados
        </div>
      )}

      {/* Add Block Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Agregar Bloque</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            {/* Content Blocks */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Bloques de Contenido
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {BLOCK_TYPES.filter(b => b.category !== 'layout').map(blockType => (
                  <button
                    key={blockType.type}
                    onClick={() => handleAddBlock(blockType.type)}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                      {blockType.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{blockType.label}</p>
                      <p className="text-xs text-gray-500 truncate">{blockType.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Layout Blocks */}
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                📐 Bloques de Layout
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {BLOCK_TYPES.filter(b => b.category === 'layout').map(blockType => (
                  <button
                    key={blockType.type}
                    onClick={() => handleAddBlock(blockType.type)}
                    className="flex items-center gap-3 p-3 border-2 border-dashed rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                      {blockType.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{blockType.label}</p>
                      <p className="text-xs text-gray-500 truncate">{blockType.description}</p>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                💡 Los bloques de layout te permiten organizar contenido en columnas. Cada slot puede contener HTML, videos, productos, etc.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Block Modal */}
      {editingBlock && (
        <BlockConfigEditor 
          block={editingBlock} 
          onChange={setEditingBlock}
          onSave={handleSaveBlock}
          onCancel={() => setEditingBlock(null)}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Eliminar bloque"
        message={`¿Estás seguro de que querés eliminar "${deleteConfirm.blockName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, blockId: '', blockName: '' })}
      />
    </AdminLayout>
  );
};

// Block config editor component
interface BlockConfigEditorProps {
  block: HomepageBlock;
  onChange: (block: HomepageBlock) => void;
  onSave: () => void;
  onCancel: () => void;
}

const BlockConfigEditor: React.FC<BlockConfigEditorProps> = ({ block, onChange, onSave, onCancel }) => {
  const { categories } = useCategories();
  
  const updateConfig = (key: string, value: any) => {
    onChange({ ...block, config: { ...block.config, [key]: value } });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
        <h3 className="text-xl font-bold mb-4">Editar: {block.title}</h3>
        
        <div className="grid gap-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Nombre del bloque</label>
            <input
              type="text"
              value={block.title || ''}
              onChange={e => onChange({ ...block, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          {/* Hero Slider Config */}
          {block.type === 'hero-slider' && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 border border-blue-200">
                ℹ️ Este bloque muestra los banners activos configurados en <strong>Marketing {'>'} Banners</strong>.
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Altura del Slider</label>
                <input
                  type="text"
                  value={block.config.height || '600px'}
                  onChange={e => updateConfig('height', e.target.value)}
                  placeholder="Ej: 600px, 100vh, 80vh"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Altura recomendada: 600px (Desktop), 400px (Mobile automático)
                </p>
              </div>
            </div>
          )}

          {/* Type-specific config */}
          {block.type === 'banner' && (
            <>
              <ImageUpload
                value={block.config.image || ''}
                onChange={(url) => updateConfig('image', url)}
                label="Imagen de fondo"
              />
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input
                  type="text"
                  value={block.config.title || ''}
                  onChange={e => updateConfig('title', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subtítulo</label>
                <input
                  type="text"
                  value={block.config.subtitle || ''}
                  onChange={e => updateConfig('subtitle', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Texto botón</label>
                  <input
                    type="text"
                    value={block.config.buttonText || ''}
                    onChange={e => updateConfig('buttonText', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Link botón</label>
                  <input
                    type="text"
                    value={block.config.buttonLink || ''}
                    onChange={e => updateConfig('buttonLink', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Alineación texto</label>
                <select
                  value={block.config.textAlign || 'left'}
                  onChange={e => updateConfig('textAlign', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="left">Izquierda</option>
                  <option value="center">Centro</option>
                  <option value="right">Derecha</option>
                </select>
              </div>
            </>
          )}

          {/* Features/Benefits Editor */}
          {block.type === 'features' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Items de beneficios</label>
                <button
                  type="button"
                  onClick={() => {
                    const items = block.config.items || [];
                    updateConfig('items', [...items, { icon: 'Truck', title: 'Nuevo', subtitle: 'Descripción' }]);
                  }}
                  className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  + Agregar
                </button>
              </div>
              
              {(block.config.items || []).map((item: any, index: number) => (
                <div key={index} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Item {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const items = [...(block.config.items || [])];
                        items.splice(index, 1);
                        updateConfig('items', items);
                      }}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Eliminar
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs mb-1">Ícono</label>
                      <select
                        value={item.icon}
                        onChange={e => {
                          const items = [...(block.config.items || [])];
                          items[index] = { ...items[index], icon: e.target.value };
                          updateConfig('items', items);
                        }}
                        className="w-full px-2 py-1 border rounded text-sm"
                      >
                        <option value="Truck">🚚 Envío</option>
                        <option value="CreditCard">💳 Tarjeta</option>
                        <option value="Banknote">💵 Dinero</option>
                        <option value="RefreshCcw">🔄 Cambio</option>
                        <option value="Shield">🛡️ Garantía</option>
                        <option value="Clock">⏰ Tiempo</option>
                        <option value="Gift">🎁 Regalo</option>
                        <option value="Star">⭐ Estrella</option>
                        <option value="Phone">📱 Teléfono</option>
                        <option value="Check">✓ Check</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Título</label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={e => {
                          const items = [...(block.config.items || [])];
                          items[index] = { ...items[index], title: e.target.value };
                          updateConfig('items', items);
                        }}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Subtítulo</label>
                      <input
                        type="text"
                        value={item.subtitle}
                        onChange={e => {
                          const items = [...(block.config.items || [])];
                          items[index] = { ...items[index], subtitle: e.target.value };
                          updateConfig('items', items);
                        }}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Promo Cards Editor */}
          {block.type === 'promo-cards' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Promo Cards</label>
                <button
                  type="button"
                  onClick={() => {
                    const cards = block.config.cards || [];
                    updateConfig('cards', [...cards, { type: 'small', title: 'Nuevo', subtitle: 'Descripción', image: '', buttonText: 'Ver', buttonLink: '#productos' }]);
                  }}
                  className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  + Agregar Card
                </button>
              </div>
              
              {(block.config.cards || []).map((card: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">
                      Card {index + 1} - <span className={card.type === 'large' ? 'text-purple-600' : 'text-blue-600'}>{card.type === 'large' ? 'Grande' : 'Pequeña'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const cards = [...(block.config.cards || [])];
                        cards.splice(index, 1);
                        updateConfig('cards', cards);
                      }}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Eliminar
                    </button>
                  </div>
                  
                  {/* Type selector */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const cards = [...(block.config.cards || [])];
                        cards[index] = { ...cards[index], type: 'large' };
                        updateConfig('cards', cards);
                      }}
                      className={`flex-1 py-2 text-xs border rounded ${card.type === 'large' ? 'bg-purple-100 border-purple-300' : 'hover:bg-gray-50'}`}
                    >
                      Grande (izquierda)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cards = [...(block.config.cards || [])];
                        cards[index] = { ...cards[index], type: 'small' };
                        updateConfig('cards', cards);
                      }}
                      className={`flex-1 py-2 text-xs border rounded ${card.type === 'small' ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-50'}`}
                    >
                      Pequeña (derecha)
                    </button>
                  </div>

                  {/* Image */}
                  <ImageUpload
                    value={card.image || ''}
                    onChange={(url) => {
                      const cards = [...(block.config.cards || [])];
                      cards[index] = { ...cards[index], image: url };
                      updateConfig('cards', cards);
                    }}
                    label="Imagen"
                  />

                  {/* Title & Subtitle */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs mb-1">Título</label>
                      <input
                        type="text"
                        value={card.title || ''}
                        onChange={e => {
                          const cards = [...(block.config.cards || [])];
                          cards[index] = { ...cards[index], title: e.target.value };
                          updateConfig('cards', cards);
                        }}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Subtítulo</label>
                      <input
                        type="text"
                        value={card.subtitle || ''}
                        onChange={e => {
                          const cards = [...(block.config.cards || [])];
                          cards[index] = { ...cards[index], subtitle: e.target.value };
                          updateConfig('cards', cards);
                        }}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>

                  {/* Button */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs mb-1">Texto botón</label>
                      <input
                        type="text"
                        value={card.buttonText || ''}
                        onChange={e => {
                          const cards = [...(block.config.cards || [])];
                          cards[index] = { ...cards[index], buttonText: e.target.value };
                          updateConfig('cards', cards);
                        }}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Link (o "whatsapp")</label>
                      <input
                        type="text"
                        value={card.buttonLink || ''}
                        onChange={e => {
                          const cards = [...(block.config.cards || [])];
                          cards[index] = { ...cards[index], buttonLink: e.target.value };
                          updateConfig('cards', cards);
                        }}
                        placeholder="#productos, /catalogo, whatsapp"
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <p className="text-xs text-gray-500">
                💡 Tip: Usá 1 card grande + 2 pequeñas para el layout clásico de promociones
              </p>
            </div>
          )}

          {block.type === 'image-banner' && (
            <>
              <ImageUpload
                value={block.config.image || ''}
                onChange={(url) => updateConfig('image', url)}
                label="Imagen"
              />
              <div>
                <label className="block text-sm font-medium mb-1">Link (opcional)</label>
                <input
                  type="text"
                  value={block.config.link || ''}
                  onChange={e => updateConfig('link', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Altura</label>
                <input
                  type="text"
                  value={block.config.height || '300px'}
                  onChange={e => updateConfig('height', e.target.value)}
                  placeholder="300px"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </>
          )}

          {block.type === 'product-grid' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input
                  type="text"
                  value={block.config.title || ''}
                  onChange={e => updateConfig('title', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Filtro</label>
                <select
                  value={block.config.filter || 'all'}
                  onChange={e => updateConfig('filter', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <optgroup label="Filtros generales">
                    <option value="all">Todos</option>
                    <option value="bestsellers">Más vendidos</option>
                    <option value="new">Nuevos</option>
                    <option value="sale">En oferta</option>
                  </optgroup>
                  {categories.length > 0 && (
                    <optgroup label="Por categoría">
                      {categories.map(cat => (
                        <option key={cat.id} value={`category:${cat.slug}`}>
                          {cat.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={block.config.showFilters ?? true}
                  onChange={e => updateConfig('showFilters', e.target.checked)}
                />
                <span className="text-sm">Mostrar filtros de categoría</span>
              </label>
            </>
          )}

          {block.type === 'text-block' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Contenido HTML</label>
                <textarea
                  value={block.config.content || ''}
                  onChange={e => updateConfig('content', e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color de fondo</label>
                <input
                  type="color"
                  value={block.config.backgroundColor || '#ffffff'}
                  onChange={e => updateConfig('backgroundColor', e.target.value)}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>
            </>
          )}

          {block.type === 'countdown' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha fin</label>
                <input
                  type="date"
                  value={block.config.endDate?.split('T')[0] || ''}
                  onChange={e => updateConfig('endDate', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input
                  type="text"
                  value={block.config.title || ''}
                  onChange={e => updateConfig('title', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subtítulo</label>
                <input
                  type="text"
                  value={block.config.subtitle || ''}
                  onChange={e => updateConfig('subtitle', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="border-t pt-4 mt-2">
                <p className="text-sm font-medium mb-3">🎨 Personalización</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Fondo Sección</label>
                    <input
                      type="color"
                      value={block.config.backgroundColor || '#fbbf24'}
                      onChange={e => updateConfig('backgroundColor', e.target.value)}
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Color Texto</label>
                    <input
                      type="color"
                      value={block.config.textColor || '#1a1a1a'}
                      onChange={e => updateConfig('textColor', e.target.value)}
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Fondo Cajas</label>
                    <input
                      type="color"
                      value={block.config.boxColor || '#1a1a1a'}
                      onChange={e => updateConfig('boxColor', e.target.value)}
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Color Números</label>
                    <input
                      type="color"
                      value={block.config.numberColor || '#ffffff'}
                      onChange={e => updateConfig('numberColor', e.target.value)}
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {block.type === 'social-feed' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Título de la sección</label>
                <input
                  type="text"
                  value={block.config.title || ''}
                  onChange={e => updateConfig('title', e.target.value)}
                  placeholder="Seguinos en redes"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  URLs de Instagram/TikTok (una por línea)
                </label>
                <textarea
                  value={(block.config.urls || []).join('\n')}
                  onChange={e => updateConfig('urls', e.target.value.split('\n').filter(u => u.trim()))}
                  rows={5}
                  placeholder="https://www.instagram.com/reel/ABC123/
https://www.tiktok.com/@usuario/video/123456"
                  className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Copiá los links de Reels o TikToks que quieras embeber
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Usuario de Instagram</label>
                <input
                  type="text"
                  value={block.config.instagramHandle || ''}
                  onChange={e => updateConfig('instagramHandle', e.target.value)}
                  placeholder="@tunegocio"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={block.config.showFollowButton ?? true}
                  onChange={e => updateConfig('showFollowButton', e.target.checked)}
                />
                <span className="text-sm">Mostrar botón "Seguinos en Instagram"</span>
              </label>
              <div>
                <label className="block text-sm font-medium mb-1">Color de fondo</label>
                <input
                  type="color"
                  value={block.config.backgroundColor || '#f5f5f5'}
                  onChange={e => updateConfig('backgroundColor', e.target.value)}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>
            </>
          )}

          {block.type === 'popup' && (
            <>
              {/* Popup Content */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2">
                <p className="text-sm text-purple-800 font-medium">📣 Popup/Modal</p>
                <p className="text-xs text-purple-600">Aparecerá como ventana emergente en el sitio</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Popup</label>
                <select
                  value={block.config.popupType || 'newsletter'}
                  onChange={e => updateConfig('popupType', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="newsletter">Newsletter / Suscripción</option>
                  <option value="promo">Promoción / Descuento</option>
                  <option value="announcement">Anuncio</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>

              <ImageUpload
                value={block.config.image || ''}
                onChange={(url) => updateConfig('image', url)}
                label="Imagen (opcional)"
              />

              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input
                  type="text"
                  value={block.config.title || ''}
                  onChange={e => updateConfig('title', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Subtítulo</label>
                <input
                  type="text"
                  value={block.config.subtitle || ''}
                  onChange={e => updateConfig('subtitle', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descripción (opcional)</label>
                <textarea
                  value={block.config.description || ''}
                  onChange={e => updateConfig('description', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              {/* Newsletter fields */}
              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={block.config.showEmailInput ?? true}
                  onChange={e => updateConfig('showEmailInput', e.target.checked)}
                />
                <span className="text-sm">Mostrar campo de email (newsletter)</span>
              </label>

              {block.config.showEmailInput && (
                <div className="grid grid-cols-2 gap-2 pl-6">
                  <input
                    type="text"
                    value={block.config.emailPlaceholder || ''}
                    onChange={e => updateConfig('emailPlaceholder', e.target.value)}
                    placeholder="Placeholder del email"
                    className="px-3 py-1.5 border rounded text-sm"
                  />
                  <input
                    type="text"
                    value={block.config.submitButtonText || ''}
                    onChange={e => updateConfig('submitButtonText', e.target.value)}
                    placeholder="Texto del botón"
                    className="px-3 py-1.5 border rounded text-sm"
                  />
                  <input
                    type="text"
                    value={block.config.successMessage || ''}
                    onChange={e => updateConfig('successMessage', e.target.value)}
                    placeholder="Mensaje de éxito"
                    className="px-3 py-1.5 border rounded text-sm col-span-2"
                  />
                </div>
              )}

              {/* CTA Button (for non-newsletter) */}
              {!block.config.showEmailInput && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Texto botón CTA</label>
                    <input
                      type="text"
                      value={block.config.buttonText || ''}
                      onChange={e => updateConfig('buttonText', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Link botón</label>
                    <input
                      type="text"
                      value={block.config.buttonLink || ''}
                      onChange={e => updateConfig('buttonLink', e.target.value)}
                      placeholder="/catalogo o https://..."
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Appearance */}
              <div className="border-t pt-4 mt-2">
                <p className="text-sm font-medium mb-3">Apariencia</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tamaño</label>
                    <select
                      value={block.config.size || 'medium'}
                      onChange={e => updateConfig('size', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="small">Pequeño</option>
                      <option value="medium">Mediano</option>
                      <option value="large">Grande</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Posición</label>
                    <select
                      value={block.config.position || 'center'}
                      onChange={e => updateConfig('position', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="center">Centro</option>
                      <option value="bottom-right">Abajo derecha</option>
                      <option value="bottom-left">Abajo izquierda</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Trigger Settings */}
              <div className="border-t pt-4 mt-2">
                <p className="text-sm font-medium mb-3">Cuándo mostrar</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Trigger</label>
                    <select
                      value={block.config.trigger || 'delay'}
                      onChange={e => updateConfig('trigger', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="immediate">Al cargar la página</option>
                      <option value="delay">Después de X segundos</option>
                      <option value="exit-intent">Al intentar salir</option>
                      <option value="scroll">Al hacer scroll</option>
                    </select>
                  </div>
                  {block.config.trigger === 'delay' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Segundos</label>
                      <input
                        type="number"
                        value={block.config.delaySeconds || 3}
                        onChange={e => updateConfig('delaySeconds', parseInt(e.target.value))}
                        min={1}
                        max={60}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                  )}
                  {block.config.trigger === 'scroll' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">% de scroll</label>
                      <input
                        type="number"
                        value={block.config.scrollPercent || 50}
                        onChange={e => updateConfig('scrollPercent', parseInt(e.target.value))}
                        min={10}
                        max={100}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-4 mt-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={block.config.showOnce ?? true}
                      onChange={e => updateConfig('showOnce', e.target.checked)}
                    />
                    <span className="text-sm">Mostrar solo 1 vez por sesión</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={block.config.showOnMobile ?? true}
                      onChange={e => updateConfig('showOnMobile', e.target.checked)}
                    />
                    <span className="text-sm">En móvil</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={block.config.showOnDesktop ?? true}
                      onChange={e => updateConfig('showOnDesktop', e.target.checked)}
                    />
                    <span className="text-sm">En desktop</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Video Hero Editor */}
          {block.type === 'video-hero' && (
            <>
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3 mb-2">
                <p className="text-sm text-purple-800 font-medium">🎬 Video Hero Block</p>
                <p className="text-xs text-purple-600">Video full-width con overlay, texto y botones de acción</p>
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-sm font-medium mb-1">URL del Video *</label>
                <input
                  type="text"
                  value={block.config.videoUrl || ''}
                  onChange={e => updateConfig('videoUrl', e.target.value)}
                  placeholder="YouTube, Vimeo o URL directa (mp4, webm)"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Formatos: YouTube, Vimeo, o archivo directo (.mp4, .webm)</p>
              </div>

              {/* Poster Image (fallback) */}
              <ImageUpload
                value={block.config.posterImage || ''}
                onChange={(url) => updateConfig('posterImage', url)}
                label="Imagen de poster (mientras carga el video)"
              />

              {/* Content */}
              <div className="border-t pt-4 mt-2">
                <p className="text-sm font-medium mb-3">📝 Contenido</p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Pre-título (tag)</label>
                    <input
                      type="text"
                      value={block.config.pretitle || ''}
                      onChange={e => updateConfig('pretitle', e.target.value)}
                      placeholder="Ej: ✨ Nueva Colección"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Título Principal</label>
                    <input
                      type="text"
                      value={block.config.title || ''}
                      onChange={e => updateConfig('title', e.target.value)}
                      placeholder="Título grande y llamativo"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Subtítulo</label>
                    <textarea
                      value={block.config.subtitle || ''}
                      onChange={e => updateConfig('subtitle', e.target.value)}
                      placeholder="Descripción breve"
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Layout */}
              <div className="border-t pt-4 mt-2">
                <p className="text-sm font-medium mb-3">📐 Layout</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Posición del contenido</label>
                    <select
                      value={block.config.contentPosition || 'bottom-left'}
                      onChange={e => updateConfig('contentPosition', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="top-left">↖ Arriba Izquierda</option>
                      <option value="top-center">↑ Arriba Centro</option>
                      <option value="top-right">↗ Arriba Derecha</option>
                      <option value="center-left">← Centro Izquierda</option>
                      <option value="center">⬤ Centro</option>
                      <option value="center-right">→ Centro Derecha</option>
                      <option value="bottom-left">↙ Abajo Izquierda</option>
                      <option value="bottom-center">↓ Abajo Centro</option>
                      <option value="bottom-right">↘ Abajo Derecha</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Gradiente</label>
                    <select
                      value={block.config.gradientType || 'bottom'}
                      onChange={e => updateConfig('gradientType', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="bottom">↑ Desde abajo (oscuro)</option>
                      <option value="top">↓ Desde arriba (oscuro)</option>
                      <option value="left">→ Desde izquierda</option>
                      <option value="right">← Desde derecha</option>
                      <option value="center">⬤ Oscurecido uniforme</option>
                      <option value="none">Sin gradiente</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Altura</label>
                    <input
                      type="text"
                      value={block.config.height || '80vh'}
                      onChange={e => updateConfig('height', e.target.value)}
                      placeholder="80vh"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Min. altura</label>
                    <input
                      type="text"
                      value={block.config.minHeight || '500px'}
                      onChange={e => updateConfig('minHeight', e.target.value)}
                      placeholder="500px"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Max. altura</label>
                    <input
                      type="text"
                      value={block.config.maxHeight || '900px'}
                      onChange={e => updateConfig('maxHeight', e.target.value)}
                      placeholder="900px"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="border-t pt-4 mt-2">
                <p className="text-sm font-medium mb-3">🔘 Botones de Acción</p>
                
                <div className="space-y-3">
                  {/* Primary Button */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-600 mb-2">Botón Principal</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={block.config.primaryButtonText || ''}
                        onChange={e => updateConfig('primaryButtonText', e.target.value)}
                        placeholder="Texto (ej: Ver Productos)"
                        className="px-3 py-2 border rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        value={block.config.primaryButtonLink || ''}
                        onChange={e => updateConfig('primaryButtonLink', e.target.value)}
                        placeholder="Link: #productos, whatsapp, URL"
                        className="px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  {/* Secondary Button */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-600 mb-2">Botón Secundario (opcional)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={block.config.secondaryButtonText || ''}
                        onChange={e => updateConfig('secondaryButtonText', e.target.value)}
                        placeholder="Texto (ej: Contactar)"
                        className="px-3 py-2 border rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        value={block.config.secondaryButtonLink || ''}
                        onChange={e => updateConfig('secondaryButtonLink', e.target.value)}
                        placeholder="Link"
                        className="px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="border-t pt-4 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={block.config.showScrollIndicator ?? false}
                    onChange={e => updateConfig('showScrollIndicator', e.target.checked)}
                  />
                  <span className="text-sm">Mostrar indicador de scroll (flecha animada)</span>
                </label>
              </div>
            </>
          )}
          
          {/* Map Config */}
          {block.type === 'map' && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                <p className="text-sm text-blue-800 font-medium">📍 Google Maps</p>
                <p className="text-xs text-blue-600">Mostrá la ubicación de tu negocio</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Dirección *</label>
                <input
                  type="text"
                  value={block.config.address || ''}
                  onChange={e => updateConfig('address', e.target.value)}
                  placeholder="Ej: Av. Corrientes 1234, CABA"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Escribí la dirección completa como la buscarías en Google Maps.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Zoom (1-20)</label>
                  <input
                    type="number"
                    value={block.config.zoom || 15}
                    onChange={e => updateConfig('zoom', parseInt(e.target.value))}
                    min={1}
                    max={20}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Altura</label>
                  <input
                    type="text"
                    value={block.config.height || '400px'}
                    onChange={e => updateConfig('height', e.target.value)}
                    placeholder="400px"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Título de la sección</label>
                <input
                  type="text"
                  value={block.config.title || ''}
                  onChange={e => updateConfig('title', e.target.value)}
                  placeholder="Dónde Estamos"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={block.config.showTitle ?? true}
                    onChange={e => updateConfig('showTitle', e.target.checked)}
                  />
                  <span className="text-sm">Mostrar título</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Color de fondo</label>
                <input
                  type="color"
                  value={block.config.backgroundColor || '#f9fafb'}
                  onChange={e => updateConfig('backgroundColor', e.target.value)}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>
            </>
          )} 
          
          {/* Premium Hero Editor */}
          {block.type === 'premium_hero' && (
            <>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 mb-2">
                <p className="text-sm text-purple-800 font-medium">✨ Premium Hero (Parallax)</p>
                <p className="text-xs text-purple-600">Banner de alto impacto con efectos 3D y movimiento</p>
              </div>

              {/* Background Media */}
              <div>
                <label className="block text-sm font-medium mb-1">Imagen de Fondo</label>
                <ImageUpload
                  value={block.config.backgroundImage || ''}
                  onChange={(url) => updateConfig('backgroundImage', url)}
                  label="Subir imagen HD"
                />
              </div>

              {/* Video Option */}
              <div className="mt-3">
                <label className="block text-sm font-medium mb-1">O Video de Fondo (opcional)</label>
                <input
                  type="text"
                  value={block.config.videoUrl || ''}
                  onChange={e => updateConfig('videoUrl', e.target.value)}
                  placeholder="URL de YouTube, Vimeo o MP4"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              {/* Content */}
              <div className="border-t pt-4 mt-2">
                <p className="text-sm font-medium mb-3">📝 Contenido</p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Pre-título (Badge)</label>
                    <input
                      type="text"
                      value={block.config.pretitle || ''}
                      onChange={e => updateConfig('pretitle', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Título Principal</label>
                    <input
                      type="text"
                      value={block.config.title || ''}
                      onChange={e => updateConfig('title', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Subtítulo</label>
                    <textarea
                      value={block.config.subtitle || ''}
                      onChange={e => updateConfig('subtitle', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="border-t pt-4 mt-2">
                <p className="text-sm font-medium mb-3">🔘 Botones</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Botón Principal</label>
                    <input
                      type="text"
                      value={block.config.buttonText || ''}
                      onChange={e => updateConfig('buttonText', e.target.value)}
                      placeholder="Texto"
                      className="w-full px-3 py-2 border rounded-lg text-sm mb-2"
                    />
                    <input
                      type="text"
                      value={block.config.buttonLink || ''}
                      onChange={e => updateConfig('buttonLink', e.target.value)}
                      placeholder="Link"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Botón Secundario</label>
                    <input
                      type="text"
                      value={block.config.secondaryButtonText || ''}
                      onChange={e => updateConfig('secondaryButtonText', e.target.value)}
                      placeholder="Texto"
                      className="w-full px-3 py-2 border rounded-lg text-sm mb-2"
                    />
                    <input
                      type="text"
                      value={block.config.secondaryButtonLink || ''}
                      onChange={e => updateConfig('secondaryButtonLink', e.target.value)}
                      placeholder="Link"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Effects & Layout */}
              <div className="border-t pt-4 mt-2">
                <p className="text-sm font-medium mb-3">✨ Efectos y Ajustes</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Intensidad Parallax</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={block.config.parallaxIntensity || 30}
                      onChange={e => updateConfig('parallaxIntensity', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 text-right">{block.config.parallaxIntensity || 30}%</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Altura</label>
                    <input
                      type="text"
                      value={block.config.height || '85vh'}
                      onChange={e => updateConfig('height', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={block.config.enableTilt ?? true}
                      onChange={e => updateConfig('enableTilt', e.target.checked)}
                    />
                    <span className="text-sm">Efecto 3D (Tilt)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={block.config.enableTextReveal ?? true}
                      onChange={e => updateConfig('enableTextReveal', e.target.checked)}
                    />
                    <span className="text-sm">Animación de texto</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={block.config.enableScrollIndicator ?? true}
                      onChange={e => updateConfig('enableScrollIndicator', e.target.checked)}
                    />
                    <span className="text-sm">Indicador de Scroll</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Layout Blocks Editor */}
          {(block.type === 'two-column' || block.type === 'three-column' || block.type === 'asymmetric-left' || block.type === 'asymmetric-right') && (
            <>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2">
                <p className="text-sm text-purple-800 font-medium">📐 Bloque de Layout</p>
                <p className="text-xs text-purple-600">
                  {block.type === 'two-column' && '2 columnas 50%/50%'}
                  {block.type === 'three-column' && '3 columnas iguales'}
                  {block.type === 'asymmetric-left' && '2 columnas 33%/66%'}
                  {block.type === 'asymmetric-right' && '2 columnas 66%/33%'}
                </p>
              </div>

              {/* Visual Layout Preview */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Vista previa del layout:</label>
                <div className={`flex gap-2 h-16 rounded border-2 border-dashed border-gray-300 overflow-hidden ${
                  block.type === 'three-column' ? '' : ''
                }`}>
                  {block.type === 'two-column' && (
                    <>
                      <div className="flex-1 bg-purple-100 flex items-center justify-center text-xs text-purple-600">50%</div>
                      <div className="flex-1 bg-purple-100 flex items-center justify-center text-xs text-purple-600">50%</div>
                    </>
                  )}
                  {block.type === 'three-column' && (
                    <>
                      <div className="flex-1 bg-purple-100 flex items-center justify-center text-xs text-purple-600">33%</div>
                      <div className="flex-1 bg-purple-100 flex items-center justify-center text-xs text-purple-600">33%</div>
                      <div className="flex-1 bg-purple-100 flex items-center justify-center text-xs text-purple-600">33%</div>
                    </>
                  )}
                  {block.type === 'asymmetric-left' && (
                    <>
                      <div className="w-1/3 bg-purple-100 flex items-center justify-center text-xs text-purple-600">33%</div>
                      <div className="w-2/3 bg-purple-200 flex items-center justify-center text-xs text-purple-600">66%</div>
                    </>
                  )}
                  {block.type === 'asymmetric-right' && (
                    <>
                      <div className="w-2/3 bg-purple-200 flex items-center justify-center text-xs text-purple-600">66%</div>
                      <div className="w-1/3 bg-purple-100 flex items-center justify-center text-xs text-purple-600">33%</div>
                    </>
                  )}
                </div>
              </div>

              {/* Slots Editor */}
              <div className="space-y-4">
                {(block.config.slots || []).map((slot: any, index: number) => (
                  <div key={index} className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-700">
                        Columna {index + 1}
                      </span>
                      <select
                        value={slot.type || 'text'}
                        onChange={e => {
                          const newSlots = [...(block.config.slots || [])];
                          newSlots[index] = { ...newSlots[index], type: e.target.value };
                          updateConfig('slots', newSlots);
                        }}
                        className="text-sm px-2 py-1 border rounded"
                      >
                        <option value="text">Texto</option>
                        <option value="image">Imagen</option>
                        <option value="video">Video (URL)</option>
                        <option value="product">Producto</option>
                      </select>
                    </div>

                    {(slot.type === 'text' || slot.type === 'html') && (
                      <div className="space-y-3">
                        {/* Title */}
                        <div>
                          <label className="block text-xs font-medium mb-1">Título</label>
                          <input
                            type="text"
                            value={slot.title || ''}
                            onChange={e => {
                              const newSlots = [...(block.config.slots || [])];
                              newSlots[index] = { ...newSlots[index], title: e.target.value };
                              updateConfig('slots', newSlots);
                            }}
                            placeholder="Título principal"
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                        </div>

                        {/* Body */}
                        <div>
                          <label className="block text-xs font-medium mb-1">Descripción</label>
                          <textarea
                            value={slot.body || ''}
                            onChange={e => {
                              const newSlots = [...(block.config.slots || [])];
                              newSlots[index] = { ...newSlots[index], body: e.target.value };
                              updateConfig('slots', newSlots);
                            }}
                            rows={3}
                            placeholder="Texto descriptivo..."
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                        </div>

                        {/* Alignment */}
                        <div className="flex items-center gap-4">
                          <label className="block text-xs font-medium">Alineación:</label>
                          <div className="flex gap-2">
                            {['left', 'center', 'right'].map(align => (
                              <button
                                key={align}
                                type="button"
                                onClick={() => {
                                  const newSlots = [...(block.config.slots || [])];
                                  newSlots[index] = { ...newSlots[index], textAlign: align };
                                  updateConfig('slots', newSlots);
                                }}
                                className={`px-3 py-1 text-xs border rounded ${
                                  (slot.textAlign || 'center') === align 
                                    ? 'bg-gray-800 text-white' 
                                    : 'hover:bg-gray-100'
                                }`}
                              >
                                {align === 'left' ? 'Izq' : align === 'center' ? 'Centro' : 'Der'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Background Color */}
                        <div className="flex items-center gap-2">
                          <label className="block text-xs font-medium">Fondo:</label>
                          <input
                            type="color"
                            value={slot.backgroundColor || '#f3f4f6'}
                            onChange={e => {
                              const newSlots = [...(block.config.slots || [])];
                              newSlots[index] = { ...newSlots[index], backgroundColor: e.target.value };
                              updateConfig('slots', newSlots);
                            }}
                            className="w-8 h-8 rounded cursor-pointer"
                          />
                          <input
                            type="color"
                            value={slot.textColor || '#1f2937'}
                            onChange={e => {
                              const newSlots = [...(block.config.slots || [])];
                              newSlots[index] = { ...newSlots[index], textColor: e.target.value };
                              updateConfig('slots', newSlots);
                            }}
                            className="w-8 h-8 rounded cursor-pointer"
                            title="Color del texto"
                          />
                          <span className="text-xs text-gray-500">Fondo / Texto</span>
                        </div>

                        {/* CTA Button */}
                        <div className="border-t pt-3">
                          <label className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              checked={slot.showButton || false}
                              onChange={e => {
                                const newSlots = [...(block.config.slots || [])];
                                newSlots[index] = { ...newSlots[index], showButton: e.target.checked };
                                updateConfig('slots', newSlots);
                              }}
                            />
                            <span className="text-sm font-medium">Botón de acción</span>
                          </label>

                          {slot.showButton && (
                            <div className="flex gap-2 pl-6">
                              <input
                                type="text"
                                value={slot.buttonText || ''}
                                onChange={e => {
                                  const newSlots = [...(block.config.slots || [])];
                                  newSlots[index] = { ...newSlots[index], buttonText: e.target.value };
                                  updateConfig('slots', newSlots);
                                }}
                                placeholder="Texto del botón"
                                className="flex-1 px-3 py-1.5 border rounded text-sm"
                              />
                              <input
                                type="text"
                                value={slot.buttonLink || ''}
                                onChange={e => {
                                  const newSlots = [...(block.config.slots || [])];
                                  newSlots[index] = { ...newSlots[index], buttonLink: e.target.value };
                                  updateConfig('slots', newSlots);
                                }}
                                placeholder="Link"
                                className="flex-1 px-3 py-1.5 border rounded text-sm"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {slot.type === 'image' && (
                      <div className="space-y-3">
                        {/* Image Upload */}
                        <ImageUpload
                          value={slot.imageUrl || ''}
                          onChange={(url) => {
                            const newSlots = [...(block.config.slots || [])];
                            newSlots[index] = { ...newSlots[index], imageUrl: url };
                            updateConfig('slots', newSlots);
                          }}
                          label="Imagen"
                        />
                        
                        {/* Link */}
                        <div>
                          <label className="block text-xs font-medium mb-1">Link al hacer clic</label>
                          <input
                            type="text"
                            value={slot.imageLink || ''}
                            onChange={e => {
                              const newSlots = [...(block.config.slots || [])];
                              newSlots[index] = { ...newSlots[index], imageLink: e.target.value };
                              updateConfig('slots', newSlots);
                            }}
                            placeholder="/catalogo o https://..."
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                        </div>

                        {/* Overlay Options */}
                        <div className="border-t pt-3 mt-3">
                          <label className="flex items-center gap-2 mb-3">
                            <input
                              type="checkbox"
                              checked={slot.showOverlay || false}
                              onChange={e => {
                                const newSlots = [...(block.config.slots || [])];
                                newSlots[index] = { ...newSlots[index], showOverlay: e.target.checked };
                                updateConfig('slots', newSlots);
                              }}
                            />
                            <span className="text-sm font-medium">Mostrar overlay con texto</span>
                          </label>

                          {slot.showOverlay && (
                            <div className="space-y-2 pl-6">
                              <input
                                type="text"
                                value={slot.overlayTitle || ''}
                                onChange={e => {
                                  const newSlots = [...(block.config.slots || [])];
                                  newSlots[index] = { ...newSlots[index], overlayTitle: e.target.value };
                                  updateConfig('slots', newSlots);
                                }}
                                placeholder="Título del overlay"
                                className="w-full px-3 py-1.5 border rounded text-sm"
                              />
                              <input
                                type="text"
                                value={slot.overlaySubtitle || ''}
                                onChange={e => {
                                  const newSlots = [...(block.config.slots || [])];
                                  newSlots[index] = { ...newSlots[index], overlaySubtitle: e.target.value };
                                  updateConfig('slots', newSlots);
                                }}
                                placeholder="Subtítulo (opcional)"
                                className="w-full px-3 py-1.5 border rounded text-sm"
                              />
                              <div className="flex gap-2">
                                <select
                                  value={slot.overlayPosition || 'center'}
                                  onChange={e => {
                                    const newSlots = [...(block.config.slots || [])];
                                    newSlots[index] = { ...newSlots[index], overlayPosition: e.target.value };
                                    updateConfig('slots', newSlots);
                                  }}
                                  className="flex-1 px-2 py-1 border rounded text-sm"
                                >
                                  <option value="center">Centro</option>
                                  <option value="bottom-left">Abajo izq</option>
                                  <option value="bottom-center">Abajo centro</option>
                                  <option value="bottom-right">Abajo der</option>
                                </select>
                                <select
                                  value={slot.overlayGradient || 'dark'}
                                  onChange={e => {
                                    const newSlots = [...(block.config.slots || [])];
                                    newSlots[index] = { ...newSlots[index], overlayGradient: e.target.value };
                                    updateConfig('slots', newSlots);
                                  }}
                                  className="flex-1 px-2 py-1 border rounded text-sm"
                                >
                                  <option value="dark">Degradado oscuro</option>
                                  <option value="light">Degradado claro</option>
                                  <option value="accent">Color accent</option>
                                  <option value="none">Sin degradado</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* CTA Button */}
                        <div className="border-t pt-3">
                          <label className="flex items-center gap-2 mb-3">
                            <input
                              type="checkbox"
                              checked={slot.showCTA || false}
                              onChange={e => {
                                const newSlots = [...(block.config.slots || [])];
                                newSlots[index] = { ...newSlots[index], showCTA: e.target.checked };
                                updateConfig('slots', newSlots);
                              }}
                            />
                            <span className="text-sm font-medium">Botón de llamado a la acción</span>
                          </label>

                          {slot.showCTA && (
                            <div className="flex gap-2 pl-6">
                              <input
                                type="text"
                                value={slot.ctaText || ''}
                                onChange={e => {
                                  const newSlots = [...(block.config.slots || [])];
                                  newSlots[index] = { ...newSlots[index], ctaText: e.target.value };
                                  updateConfig('slots', newSlots);
                                }}
                                placeholder="Texto del botón"
                                className="flex-1 px-3 py-1.5 border rounded text-sm"
                              />
                              <input
                                type="text"
                                value={slot.ctaLink || ''}
                                onChange={e => {
                                  const newSlots = [...(block.config.slots || [])];
                                  newSlots[index] = { ...newSlots[index], ctaLink: e.target.value };
                                  updateConfig('slots', newSlots);
                                }}
                                placeholder="Link del botón"
                                className="flex-1 px-3 py-1.5 border rounded text-sm"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {slot.type === 'video' && (
                      <input
                        type="text"
                        value={slot.videoUrl || ''}
                        onChange={e => {
                          const newSlots = [...(block.config.slots || [])];
                          newSlots[index] = { ...newSlots[index], videoUrl: e.target.value };
                          updateConfig('slots', newSlots);
                        }}
                        placeholder="URL de YouTube o Vimeo"
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    )}

                    {slot.type === 'product' && (
                      <div className="space-y-2">
                        <select
                          value={slot.productId || ''}
                          onChange={e => {
                            const newSlots = [...(block.config.slots || [])];
                            newSlots[index] = { ...newSlots[index], productId: e.target.value };
                            updateConfig('slots', newSlots);
                          }}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        >
                          <option value="">Seleccionar producto...</option>
                          {/* Products will be passed via context, for now show placeholder */}
                        </select>
                        <p className="text-xs text-gray-500">
                          💡 Tip: Podés pegar el ID del producto o cargarlo desde el catálogo
                        </p>
                        <input
                          type="text"
                          value={slot.productId || ''}
                          onChange={e => {
                            const newSlots = [...(block.config.slots || [])];
                            newSlots[index] = { ...newSlots[index], productId: e.target.value };
                            updateConfig('slots', newSlots);
                          }}
                          placeholder="O pegá el ID del producto"
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Layout Options */}
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium mb-1">Espacio entre columnas</label>
                  <select
                    value={block.config.gap || '1rem'}
                    onChange={e => updateConfig('gap', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="0">Sin espacio</option>
                    <option value="0.5rem">Pequeño</option>
                    <option value="1rem">Normal</option>
                    <option value="2rem">Grande</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Color de fondo</label>
                  <input
                    type="color"
                    value={block.config.backgroundColor || '#ffffff'}
                    onChange={e => updateConfig('backgroundColor', e.target.value)}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-3">
                💡 Usá HTML para máxima flexibilidad, o elegí imagen/video para contenido simple.
              </p>
            </>
          )}

          {(block.type === 'hero-slider' || block.type === 'features' || block.type === 'promo-cards' || block.type === 'categories' || block.type === 'bestsellers') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Este bloque usa la configuración existente. Editá los {
                  block.type === 'hero-slider' ? 'banners en la sección Banners' :
                  block.type === 'promo-cards' ? 'promos en la sección Promos' :
                  block.type === 'categories' ? 'categorías en la sección Categorías' :
                  block.type === 'features' ? 'features en la sección Features (próximamente)' :
                  'productos más vendidos'
                }.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <button 
            onClick={onSave} 
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Save size={16} />
            Guardar
          </button>
          <button 
            onClick={onCancel} 
            className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
          >
            <X size={16} />
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
