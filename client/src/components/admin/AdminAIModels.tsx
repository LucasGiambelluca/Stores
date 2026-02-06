import React, { useState } from 'react';
import { Plus, Edit, Trash2, Sparkles, Save, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { AIModel } from '../../types';
import { AdminLayout } from './AdminLayout';
import { ImageUpload } from './ImageUpload';

export const AdminAIModels: React.FC = () => {
  const { state, addAIModel, updateAIModel, deleteAIModel } = useStore();
  const models = state.aiModels || [];
  
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const createNewModel = (): AIModel => ({
    id: `model-${Date.now()}`,
    name: '',
    image: '',
    type: 'female',
    bodyType: '',
    order: models.length,
    isActive: true,
  });

  const handleSave = () => {
    if (!editingModel || !editingModel.name || !editingModel.image) {
      alert('Nombre e imagen son requeridos');
      return;
    }
    
    const exists = models.find(m => m.id === editingModel.id);
    if (exists) {
      updateAIModel(editingModel);
    } else {
      addAIModel(editingModel);
    }
    setEditingModel(null);
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este modelo?')) {
      deleteAIModel(id);
    }
  };

  const startEdit = (model: AIModel) => {
    setEditingModel({ ...model });
    setIsCreating(false);
  };

  const startCreate = () => {
    setEditingModel(createNewModel());
    setIsCreating(true);
  };

  const cancelEdit = () => {
    setEditingModel(null);
    setIsCreating(false);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="text-purple-500" />
            Modelos IA - Virtual Try-On
          </h1>
          <p className="text-gray-600">
            Subí fotos de modelos de cuerpo completo para el probador virtual
          </p>
        </div>
        <button 
          onClick={startCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition"
        >
          <Plus size={20} />
          Agregar Modelo
        </button>
      </div>

      {/* Edit/Create Modal */}
      {editingModel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">
                {isCreating ? 'Nuevo Modelo' : 'Editar Modelo'}
              </h3>
              <button onClick={cancelEdit} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  value={editingModel.name}
                  onChange={e => setEditingModel({ ...editingModel, name: e.target.value })}
                  placeholder="Ej: Mujer - Atlética"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de cuerpo (opcional)</label>
                <input
                  type="text"
                  value={editingModel.bodyType || ''}
                  onChange={e => setEditingModel({ ...editingModel, bodyType: e.target.value })}
                  placeholder="Ej: Atlética, Curvy, Plus Size"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Género</label>
                <select
                  value={editingModel.type}
                  onChange={e => setEditingModel({ ...editingModel, type: e.target.value as 'female' | 'male' })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="female">Mujer</option>
                  <option value="male">Hombre</option>
                </select>
              </div>
              
              <ImageUpload
                value={editingModel.image}
                onChange={(url) => setEditingModel({ ...editingModel, image: url })}
                label="Foto del modelo (cuerpo completo)"
              />
              
              <p className="text-sm text-gray-500">
                💡 Tip: Usá fotos de cuerpo completo, fondo neutro, pose frontal
              </p>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingModel.isActive}
                  onChange={e => setEditingModel({ ...editingModel, isActive: e.target.checked })}
                />
                <span className="text-sm">Activo (visible para clientes)</span>
              </label>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button 
                onClick={handleSave} 
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700"
              >
                <Save size={18} />
                Guardar
              </button>
              <button 
                onClick={cancelEdit} 
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Models Grid */}
      {models.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <Sparkles size={48} className="mx-auto mb-4 text-purple-300" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay modelos</h3>
          <p className="text-gray-500 mb-4">
            Agregá fotos de modelos para que los clientes prueben la ropa virtualmente
          </p>
          <button 
            onClick={startCreate}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Agregar primer modelo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {models.map((model) => (
            <div 
              key={model.id}
              className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition ${
                !model.isActive ? 'opacity-50' : ''
              }`}
            >
              <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
                {model.image ? (
                  <img 
                    src={model.image} 
                    alt={model.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Sin imagen
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    model.type === 'female' 
                      ? 'bg-pink-100 text-pink-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {model.type === 'female' ? 'Mujer' : 'Hombre'}
                  </span>
                </div>
                {!model.isActive && (
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-800 text-white">
                      Inactivo
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-gray-800 truncate">{model.name}</h3>
                {model.bodyType && (
                  <p className="text-sm text-gray-500 truncate">{model.bodyType}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={() => startEdit(model)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-gray-100 rounded hover:bg-gray-200 text-sm"
                  >
                    <Edit size={14} />
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(model.id)}
                    className="p-1.5 bg-red-50 rounded hover:bg-red-100 text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAIModels;
