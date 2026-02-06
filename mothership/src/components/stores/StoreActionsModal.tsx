import { Store, X, Key, Ban, RefreshCw, Trash2 } from 'lucide-react';

interface StoreActionsModalProps {
  store: any;
  onClose: () => void;
  onResetPassword: (store: any) => void;
  onSuspend: (id: string) => void;
  onReactivate: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function StoreActionsModal({ 
  store, 
  onClose, 
  onResetPassword, 
  onSuspend, 
  onReactivate, 
  onDelete 
}: StoreActionsModalProps) {
  if (!store) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 ">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-lg flex items-center justify-center">
            <Store size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 truncate">{store.name}</h3>
            <p className="text-sm text-slate-500 truncate">{store.ownerEmail}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded text-slate-500 ">
            <X size={20} />
          </button>
        </div>
        
        {/* Actions List */}
        <div className="p-2">
          <button 
            onClick={() => { onResetPassword(store); onClose(); }}
            className="w-full px-4 py-3 text-left hover:bg-blue-50 rounded-lg flex items-center gap-3 transition-colors"
          >
            <Key size={20} className="text-blue-600 " />
            <div>
              <p className="font-medium text-slate-900 ">Blanquear Contraseña</p>
              <p className="text-xs text-slate-500 ">Resetear password del admin</p>
            </div>
          </button>
          
          {store.status === 'active' && (
            <button 
              onClick={() => { onSuspend(store.id); onClose(); }}
              className="w-full px-4 py-3 text-left hover:bg-yellow-50 rounded-lg flex items-center gap-3 transition-colors"
            >
              <Ban size={20} className="text-yellow-600 " />
              <div>
                <p className="font-medium text-slate-900 ">Suspender Tienda</p>
                <p className="text-xs text-slate-500 ">Desactivar temporalmente</p>
              </div>
            </button>
          )}
          
          {store.status === 'suspended' && (
            <button 
              onClick={() => { onReactivate(store.id); onClose(); }}
              className="w-full px-4 py-3 text-left hover:bg-green-50 rounded-lg flex items-center gap-3 transition-colors"
            >
              <RefreshCw size={20} className="text-green-600 " />
              <div>
                <p className="font-medium text-slate-900 ">Reactivar Tienda</p>
                <p className="text-xs text-slate-500 ">Volver a activar</p>
              </div>
            </button>
          )}
          
          <div className="border-t border-slate-100 my-2"></div>
          
          <button 
            onClick={() => { onDelete(store.id); onClose(); }}
            className="w-full px-4 py-3 text-left hover:bg-red-50 rounded-lg flex items-center gap-3 text-red-600 transition-colors"
          >
            <Trash2 size={20} />
            <div>
              <p className="font-medium">Eliminar Tienda</p>
              <p className="text-xs text-red-400 ">Esta acción es irreversible</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
