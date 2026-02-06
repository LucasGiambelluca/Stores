import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, Image as ImageIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { usePromoCards } from '../../context/StoreContext';
import { PromoCard } from '../../types';
import { AdminLayout } from './AdminLayout';
import { ImageUpload } from './ImageUpload';

export const AdminPromoCards: React.FC = () => {
  const { allPromoCards, updatePromoCards } = usePromoCards();
  const [editingCard, setEditingCard] = useState<PromoCard | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!editingCard) return;
    const exists = allPromoCards.find(c => c.id === editingCard.id);
    if (exists) {
      updatePromoCards(allPromoCards.map(c => c.id === editingCard.id ? editingCard : c));
    } else {
      updatePromoCards([...allPromoCards, editingCard]);
    }
    setEditingCard(null);
    showSaved();
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta tarjeta promocional?')) {
      updatePromoCards(allPromoCards.filter(c => c.id !== id));
      showSaved();
    }
  };

  const handleAddNew = () => {
    const newOrder = allPromoCards.length > 0 
      ? Math.max(...allPromoCards.map(c => c.order)) + 1 
      : 1;
    setEditingCard({
      id: `promo-${Date.now()}`,
      type: 'small',
      title: '',
      subtitle: '',
      image: '',
      buttonText: 'Ver más',
      buttonLink: '#productos',
      order: newOrder,
      isActive: true,
    });
  };

  const moveCard = (id: string, direction: 'up' | 'down') => {
    const sorted = [...allPromoCards].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex(c => c.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sorted.length - 1)
    ) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = sorted[index].order;
    sorted[index].order = sorted[swapIndex].order;
    sorted[swapIndex].order = temp;
    
    updatePromoCards(sorted);
    showSaved();
  };

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sortedCards = [...allPromoCards].sort((a, b) => a.order - b.order);

  return (
    <AdminLayout>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tarjetas Promocionales</h1>
          <p className="text-gray-600">
            Personalizá las tarjetas de promoción en la página de inicio
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors btn-accent"
        >
          <Plus size={20} />
          Agregar Tarjeta
        </button>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> La primera tarjeta "large" se muestra grande a la izquierda. 
          Las tarjetas "small" se muestran a la derecha apiladas.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedCards.map((card, index) => (
          <div 
            key={card.id} 
            className={`bg-white rounded-xl shadow-sm overflow-hidden ${!card.isActive ? 'opacity-50' : ''}`}
          >
            {/* Card Image */}
            <div className="relative h-40 bg-gray-100">
              {card.image ? (
                <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon size={32} className="text-gray-300" />
                </div>
              )}
              {/* Type badge */}
              <span className={`absolute top-2 left-2 px-2 py-1 text-xs font-bold rounded ${
                card.type === 'large' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-600 text-white'
              }`}>
                {card.type === 'large' ? 'GRANDE' : 'PEQUEÑA'}
              </span>
            </div>

            {/* Card Content */}
            <div className="p-4">
              <h3 className="font-bold text-gray-800">{card.title || 'Sin título'}</h3>
              <p className="text-sm text-gray-500 truncate">{card.subtitle || 'Sin subtítulo'}</p>
              <p className="text-xs text-gray-400 mt-2">
                Botón: {card.buttonText} → {card.buttonLink?.substring(0, 20)}...
              </p>
            </div>

            {/* Card Actions */}
            <div className="flex items-center justify-between border-t p-3">
              <div className="flex gap-1">
                <button 
                  onClick={() => moveCard(card.id, 'up')}
                  disabled={index === 0}
                  className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30"
                  title="Mover arriba"
                >
                  <ChevronUp size={16} />
                </button>
                <button 
                  onClick={() => moveCard(card.id, 'down')}
                  disabled={index === sortedCards.length - 1}
                  className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30"
                  title="Mover abajo"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => setEditingCard(card)} 
                  className="p-1.5 hover:bg-gray-100 rounded"
                  title="Editar"
                >
                  <Edit size={16} className="text-gray-600" />
                </button>
                <button 
                  onClick={() => handleDelete(card.id)} 
                  className="p-1.5 hover:bg-red-50 rounded"
                  title="Eliminar"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {sortedCards.length === 0 && (
          <div className="col-span-full bg-white rounded-xl p-8 text-center text-gray-500">
            <ImageIcon size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="font-medium">No hay tarjetas promocionales</p>
            <p className="text-sm">Agregá una para empezar</p>
          </div>
        )}
      </div>

      {/* Saved indicator */}
      {saved && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          ✓ Cambios guardados
        </div>
      )}

      {/* Edit Modal */}
      {editingCard && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-bold mb-4">
              {allPromoCards.find(c => c.id === editingCard.id) ? 'Editar' : 'Nueva'} Tarjeta
            </h3>
            
            <div className="grid gap-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Tarjeta</label>
                <select
                  value={editingCard.type}
                  onChange={e => setEditingCard({ ...editingCard, type: e.target.value as 'large' | 'small' })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="large">Grande (izquierda)</option>
                  <option value="small">Pequeña (derecha)</option>
                </select>
              </div>

              {/* Image */}
              <ImageUpload
                value={editingCard.image}
                onChange={(url) => setEditingCard({ ...editingCard, image: url })}
                label="Imagen"
              />

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input
                  type="text"
                  value={editingCard.title}
                  onChange={e => setEditingCard({ ...editingCard, title: e.target.value })}
                  placeholder="Ej: NEW DROP"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm font-medium mb-1">Subtítulo</label>
                <input
                  type="text"
                  value={editingCard.subtitle || ''}
                  onChange={e => setEditingCard({ ...editingCard, subtitle: e.target.value })}
                  placeholder="Ej: Remeras desde $6.500"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              {/* Badge (optional) */}
              <div>
                <label className="block text-sm font-medium mb-1">Badge (opcional)</label>
                <input
                  type="text"
                  value={editingCard.badge || ''}
                  onChange={e => setEditingCard({ ...editingCard, badge: e.target.value })}
                  placeholder="Ej: NUEVO"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              {/* Button Text */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Texto del Botón</label>
                  <input
                    type="text"
                    value={editingCard.buttonText || ''}
                    onChange={e => setEditingCard({ ...editingCard, buttonText: e.target.value })}
                    placeholder="Ej: Ver más"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Link del Botón</label>
                  <input
                    type="text"
                    value={editingCard.buttonLink || ''}
                    onChange={e => setEditingCard({ ...editingCard, buttonLink: e.target.value })}
                    placeholder="Ej: #productos"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Active */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingCard.isActive}
                  onChange={e => setEditingCard({ ...editingCard, isActive: e.target.checked })}
                />
                <span className="text-sm">Activa</span>
              </label>
            </div>

            <div className="flex gap-2 mt-6">
              <button 
                onClick={handleSave} 
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <Save size={16} />
                Guardar
              </button>
              <button 
                onClick={() => setEditingCard(null)} 
                className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                <X size={16} />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
