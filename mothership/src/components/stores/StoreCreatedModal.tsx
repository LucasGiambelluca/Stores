import { CheckCircle, ExternalLink, ClipboardList } from 'lucide-react';

interface StoreCreatedModalProps {
  store: {
    id: string;
    name: string;
    domain: string;
  };
  onClose: () => void;
}

const STORE_URL = import.meta.env.VITE_STORE_URL || 'http://localhost:3005';

export default function StoreCreatedModal({ store, onClose }: StoreCreatedModalProps) {
  if (!store) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 ">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 " />
          </div>
          <h3 className="text-xl font-bold text-slate-900 ">¡Tienda Creada!</h3>
          <p className="text-slate-600 mt-1">{store.name}</p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 ">
            <label className="text-xs font-semibold text-blue-600 uppercase">URL de la Tienda</label>
            <p className="text-sm text-slate-600 mt-1">
              La tienda estará disponible en:
            </p>
            <div className="flex items-center gap-2 mt-2">
              <code className="flex-1 text-sm bg-white px-3 py-2 rounded border border-slate-200 font-mono text-slate-800 ">
                https://{store.domain}.tiendita.app
              </code>
              <a href={`${STORE_URL}?storeId=${store.id}`} target="_blank" rel="noopener noreferrer"
                className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 ">
                <ExternalLink size={20} />
              </a>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              * En desarrollo: <a href={`${STORE_URL}?storeId=${store.id}`} target="_blank" className="text-blue-600 underline">Link Directo</a>
            </p>
          </div>
          
          <div className="bg-amber-50 rounded-lg p-4 text-sm border border-amber-100 ">
            <p className="font-medium text-amber-800 flex items-center gap-2">
              <ClipboardList size={16} />
              Próximos pasos:
            </p>
            <ol className="list-decimal list-inside text-amber-700 mt-2 space-y-1 ml-1">
              <li>Crear una licencia con el plan deseado</li>
              <li>Asignar la licencia a esta tienda</li>
              <li>La tienda se activa automáticamente</li>
            </ol>
          </div>
        </div>
        
        <button onClick={onClose}
          className="w-full mt-6 px-4 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 ">
          Entendido
        </button>
      </div>
    </div>
  );
}
