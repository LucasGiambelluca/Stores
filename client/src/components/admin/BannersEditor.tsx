import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, Image as ImageIcon } from 'lucide-react';
import { useBanners, usePromoCards } from '../../context/StoreContext';
import { Banner, PromoCard } from '../../types';
import { AdminLayout } from './AdminLayout';
import { ImageUpload } from './ImageUpload';
import { getStoreHeaders, buildApiUrl } from '../../utils/storeDetection';

export const AdminBanners: React.FC = () => {
  const { allBanners, updateBanners } = useBanners();
  const { allPromoCards, updatePromoCards } = usePromoCards();
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [editingPromo, setEditingPromo] = useState<PromoCard | null>(null);
  const [activeTab, setActiveTab] = useState<'banners' | 'promos'>('banners');

  // Banner handlers
  const handleSaveBanner = async () => {
    if (!editingBanner) return;
    
    let newBanners: Banner[];
    const existing = allBanners.find(b => b.id === editingBanner.id);
    if (existing) {
      newBanners = allBanners.map(b => b.id === editingBanner.id ? editingBanner : b);
    } else {
      newBanners = [...allBanners, editingBanner];
    }
    
    // Update local state
    updateBanners(newBanners);
    
    // Persist to database
    try {
      const token = sessionStorage.getItem('token');
      await fetch(buildApiUrl('/api/banners/save'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...getStoreHeaders(),
        },
        body: JSON.stringify({ banners: newBanners }),
      });
    } catch (error) {
      console.error('Error saving banners to database:', error);
    }
    
    setEditingBanner(null);
  };

  const handleDeleteBanner = async (id: string) => {
    if (confirm('¿Eliminar este banner?')) {
      const newBanners = allBanners.filter(b => b.id !== id);
      updateBanners(newBanners);
      
      // Persist to database
      try {
        const token = sessionStorage.getItem('token');
        await fetch(buildApiUrl('/api/banners/save'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...getStoreHeaders(),
          },
          body: JSON.stringify({ banners: newBanners }),
        });
      } catch (error) {
        console.error('Error deleting banner from database:', error);
      }
    }
  };

  const handleAddBanner = () => {
    setEditingBanner({
      id: `banner-${Date.now()}`,
      image: '',
      title: '',
      subtitle: '',
      buttonText: 'Ver más',
      buttonLink: '#productos',
      order: allBanners.length + 1,
      isActive: true
    });
  };

  // Promo handlers
  const handleSavePromo = () => {
    if (!editingPromo) return;
    const existing = allPromoCards.find(p => p.id === editingPromo.id);
    if (existing) {
      updatePromoCards(allPromoCards.map(p => p.id === editingPromo.id ? editingPromo : p));
    } else {
      updatePromoCards([...allPromoCards, editingPromo]);
    }
    setEditingPromo(null);
  };

  const handleDeletePromo = (id: string) => {
    if (confirm('¿Eliminar esta promo?')) {
      updatePromoCards(allPromoCards.filter(p => p.id !== id));
    }
  };

  const handleAddPromo = () => {
    setEditingPromo({
      id: `promo-${Date.now()}`,
      type: 'small',
      image: '',
      title: '',
      subtitle: '',
      buttonText: 'Ver más',
      buttonLink: '#productos',
      order: allPromoCards.length + 1,
      isActive: true
    });
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Banners y Promos</h1>
        <p className="text-gray-600">Gestión de sliders y secciones promocionales</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('banners')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'banners' 
              ? 'bg-[#1a1a1a] text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Sliders ({allBanners.length})
        </button>
        <button
          onClick={() => setActiveTab('promos')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'promos' 
              ? 'bg-[#1a1a1a] text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Promos ({allPromoCards.length})
        </button>
      </div>

      {/* Banners Tab */}
      {activeTab === 'banners' && (
        <>
          <div className="flex justify-end mb-4">
            <button 
              onClick={handleAddBanner}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold btn-accent"
            >
              <Plus size={20} />
              Nuevo Banner
            </button>
          </div>

          {editingBanner && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">
                {allBanners.find(b => b.id === editingBanner.id) ? 'Editar' : 'Nuevo'} Banner
              </h3>
              <div className="grid gap-4">
                <ImageUpload
                  value={editingBanner.image}
                  onChange={(url) => setEditingBanner({ ...editingBanner, image: url })}
                  label="Imagen del Banner"
                  placeholder="Subí una imagen o pegá una URL"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Título</label>
                    <input
                      type="text"
                      value={editingBanner.title}
                      onChange={e => setEditingBanner({ ...editingBanner, title: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Subtítulo</label>
                    <input
                      type="text"
                      value={editingBanner.subtitle || ''}
                      onChange={e => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Texto del botón</label>
                    <input
                      type="text"
                      value={editingBanner.buttonText || ''}
                      onChange={e => setEditingBanner({ ...editingBanner, buttonText: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Link del botón</label>
                    <input
                      type="text"
                      value={editingBanner.buttonLink || ''}
                      onChange={e => setEditingBanner({ ...editingBanner, buttonLink: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Orden</label>
                    <input
                      type="number"
                      value={editingBanner.order}
                      onChange={e => setEditingBanner({ ...editingBanner, order: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingBanner.isActive}
                    onChange={e => setEditingBanner({ ...editingBanner, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Activo</span>
                </label>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleSaveBanner} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg">
                  <Save size={18} /> Guardar
                </button>
                <button onClick={() => setEditingBanner(null)} className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded-lg">
                  <X size={18} /> Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {allBanners.sort((a,b) => a.order - b.order).map(banner => (
              <div key={banner.id} className="bg-white rounded-xl shadow-sm p-4 flex gap-4 items-center">
                <div className="w-32 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {banner.image ? (
                    <img src={banner.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ImageIcon size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{banner.title || '(Sin título)'}</p>
                  <p className="text-sm text-gray-500">{banner.subtitle}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${banner.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                  {banner.isActive ? 'Activo' : 'Inactivo'}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setEditingBanner(banner)} className="p-2 hover:bg-gray-100 rounded">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDeleteBanner(banner.id)} className="p-2 hover:bg-red-50 rounded">
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Promos Tab */}
      {activeTab === 'promos' && (
        <>
          <div className="flex justify-end mb-4">
            <button 
              onClick={handleAddPromo}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold btn-accent"
            >
              <Plus size={20} />
              Nueva Promo
            </button>
          </div>

          {editingPromo && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">
                {allPromoCards.find(p => p.id === editingPromo.id) ? 'Editar' : 'Nueva'} Promo
              </h3>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipo</label>
                    <select
                      value={editingPromo.type}
                      onChange={e => setEditingPromo({ ...editingPromo, type: e.target.value as 'large' | 'small' })}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="large">Grande</option>
                      <option value="small">Pequeño</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Badge (opcional)</label>
                    <input
                      type="text"
                      value={editingPromo.badge || ''}
                      onChange={e => setEditingPromo({ ...editingPromo, badge: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="NUEVO"
                    />
                  </div>
                </div>
                <ImageUpload
                  value={editingPromo.image}
                  onChange={(url) => setEditingPromo({ ...editingPromo, image: url })}
                  label="Imagen de la Promo"
                  placeholder="Subí una imagen o pegá una URL"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Título</label>
                    <input
                      type="text"
                      value={editingPromo.title}
                      onChange={e => setEditingPromo({ ...editingPromo, title: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Subtítulo</label>
                    <input
                      type="text"
                      value={editingPromo.subtitle || ''}
                      onChange={e => setEditingPromo({ ...editingPromo, subtitle: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Texto del botón</label>
                    <input
                      type="text"
                      value={editingPromo.buttonText || ''}
                      onChange={e => setEditingPromo({ ...editingPromo, buttonText: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Link</label>
                    <input
                      type="text"
                      value={editingPromo.buttonLink || ''}
                      onChange={e => setEditingPromo({ ...editingPromo, buttonLink: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Orden</label>
                    <input
                      type="number"
                      value={editingPromo.order}
                      onChange={e => setEditingPromo({ ...editingPromo, order: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingPromo.isActive}
                    onChange={e => setEditingPromo({ ...editingPromo, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Activo</span>
                </label>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleSavePromo} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg">
                  <Save size={18} /> Guardar
                </button>
                <button onClick={() => setEditingPromo(null)} className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded-lg">
                  <X size={18} /> Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {allPromoCards.sort((a,b) => a.order - b.order).map(promo => (
              <div key={promo.id} className="bg-white rounded-xl shadow-sm p-4 flex gap-4 items-center">
                <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {promo.image ? (
                    <img src={promo.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ImageIcon size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs rounded ${promo.type === 'large' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {promo.type === 'large' ? 'Grande' : 'Pequeño'}
                    </span>
                    {promo.badge && (
                      <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800">{promo.badge}</span>
                    )}
                  </div>
                  <p className="font-semibold">{promo.title}</p>
                  <p className="text-sm text-gray-500">{promo.subtitle}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${promo.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                  {promo.isActive ? 'Activo' : 'Inactivo'}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setEditingPromo(promo)} className="p-2 hover:bg-gray-100 rounded">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDeletePromo(promo.id)} className="p-2 hover:bg-red-50 rounded">
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  );
};
