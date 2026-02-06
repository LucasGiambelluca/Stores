import { useState } from 'react';
import { Store, Mail, User, Info, X } from 'lucide-react';
import { createStoreSchema } from '../../schemas/validation';

interface CreateStoreModalProps {
  onClose: () => void;
  onCreate: (data: { name: string; ownerEmail: string; ownerName: string }) => void;
  isCreating: boolean;
  error?: string;
}

export default function CreateStoreModal({ onClose, onCreate, isCreating, error }: CreateStoreModalProps) {
  const [newStore, setNewStore] = useState({
    name: '',
    ownerEmail: '',
    ownerName: ''
  });
  const [localError, setLocalError] = useState('');

  const handleSubmit = () => {
    setLocalError('');
    const result = createStoreSchema.safeParse(newStore);
    
    if (!result.success) {
      setLocalError(result.error.errors[0].message);
      return;
    }
    
    onCreate(newStore);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200 ">
        <div className="sticky top-0 bg-white flex items-center justify-between p-4 border-b border-slate-100 ">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary-600 " />
            <h2 className="text-lg font-bold text-slate-900 ">Nueva Tienda</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded text-slate-500 "><X size={20} /></button>
        </div>
        <div className="p-4 space-y-4">
          {(localError || error) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 ">
              {localError || error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 "><Store size={14} className="inline mr-1" />Nombre *</label>
            <input type="text" value={newStore.name} onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400" placeholder="Mi Tienda" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 "><Mail size={14} className="inline mr-1" />Email *</label>
            <input type="email" value={newStore.ownerEmail} onChange={(e) => setNewStore({ ...newStore, ownerEmail: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400" placeholder="cliente@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 "><User size={14} className="inline mr-1" />Nombre propietario</label>
            <input type="text" value={newStore.ownerName} onChange={(e) => setNewStore({ ...newStore, ownerName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400" placeholder="Juan Pérez" />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 ">
            <p className="font-medium flex items-center gap-2">
              <Info size={16} />
              La tienda se crea sin plan
            </p>
            <p className="text-xs mt-1 ml-6">Después de crear la tienda, asigná una licencia para activarla con el plan correspondiente.</p>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white p-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 ">Cancelar</button>
          <button onClick={handleSubmit} disabled={isCreating}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">
            {isCreating ? 'Creando...' : 'Crear Tienda'}
          </button>
        </div>
      </div>
    </div>
  );
}
