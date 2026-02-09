import { Store, ExternalLink, MoreVertical } from 'lucide-react';

interface StoreTableProps {
  stores: any[];
  isLoading: boolean;
  error: any;
  selectedIds: Set<string>;
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  onAction: (store: any) => void;
}

const STORE_URL = import.meta.env.VITE_STORE_URL || 'http://localhost:3005';

export default function StoreTable({ 
  stores, 
  isLoading, 
  error, 
  selectedIds, 
  onSelectAll, 
  onSelectOne, 
  onAction 
}: StoreTableProps) {
  
  const allSelected = stores.length > 0 && stores.every((s: any) => selectedIds.has(s.id));

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800 ',
      suspended: 'bg-yellow-100 text-yellow-800 ',
      pending: 'bg-slate-100 text-slate-800 ',
    };
    const labels: Record<string, string> = {
      active: 'Activa', suspended: 'Suspendida', pending: 'Pendiente',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-800 '}`}>{labels[status] || status}</span>;
  };

  const getPlanBadge = (plan: string) => {
    const styles: Record<string, string> = {
      free: 'bg-slate-100 text-slate-700 ', 
      starter: 'bg-blue-100 text-blue-700 ',
      pro: 'bg-purple-100 text-purple-700 ', 
      enterprise: 'bg-emerald-100 text-emerald-700 ',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${styles[plan] || 'bg-slate-100 text-slate-700 '}`}>{plan}</span>;
  };

  if (isLoading) {
    return (
      <div className="bg-white p-12 rounded-xl text-center border border-slate-200 ">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-8 rounded-xl text-center text-red-700 border border-red-200 ">
        Error al cargar las tiendas
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="bg-white p-12 rounded-xl text-center border border-slate-200 ">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <Store size={32} className="text-slate-400" />
        </div>
        <h3 className="text-xl font-bold mb-2 text-slate-900 ">No hay tiendas</h3>
        <p className="text-slate-500 ">Haz clic en "Nueva Tienda" para crear una.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 ">
        <thead className="bg-slate-50 ">
          <tr>
            <th className="px-4 py-4">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
              />
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Tienda</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">ID / Acceso</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Estado</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Plan</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Licencia</th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 ">
          {stores.map((store: any) => {
            const isSelected = selectedIds.has(store.id);
            return (
            <tr key={store.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-red-50 ' : ''}`}>
              <td className="px-4 py-4">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => onSelectOne(store.id, e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                />
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-lg flex items-center justify-center">
                    <Store size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 ">{store.name}</div>
                    <div className="text-sm text-slate-500 ">{store.ownerEmail}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="space-y-1">
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono block truncate max-w-[180px] text-slate-600 " title={store.id}>
                    {store.id.substring(0, 8)}...
                  </code>
                  <a 
                    href={`${STORE_URL}?storeId=${store.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <ExternalLink size={12} />
                    Abrir tienda
                  </a>
                </div>
              </td>
              <td className="px-6 py-4">{getStatusBadge(store.status)}</td>
              <td className="px-6 py-4">{getPlanBadge(store.plan)}</td>
              <td className="px-6 py-4">
                {store.licenseKey ? (
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-600 ">{store.licenseKey}</code>
                ) : <span className="text-slate-400 text-sm">Sin licencia</span>}
              </td>
              <td className="px-6 py-4 text-right">
                <button 
                  onClick={() => onAction(store)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <MoreVertical size={18} className="text-slate-500 " />
                </button>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
