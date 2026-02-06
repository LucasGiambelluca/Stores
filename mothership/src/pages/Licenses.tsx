import { useState } from 'react';
import { useLicenses } from '../hooks/useLicenses';
import CreateLicenseModal from '../components/licenses/CreateLicenseModal';
import LicenseTable from '../components/licenses/LicenseTable';
import Button from '../components/ui/Button';
import { Plus, Search } from 'lucide-react';

export default function Licenses() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    plan: '',
    search: '',
  });
  
  const { data, isLoading } = useLicenses(filters);
  const licenses = data?.data.licenses || [];
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 ">Licencias</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="inline mr-2" />
          Nueva Licencia
        </Button>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 border border-slate-200 ">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por serial, email..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400"
            />
          </div>
          
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-slate-900 "
          >
            <option value="">Todos los estados</option>
            <option value="generated">Generadas</option>
            <option value="activated">Activas</option>
            <option value="suspended">Suspendidas</option>
            <option value="expired">Vencidas</option>
          </select>
          
          {/* Plan Filter */}
          <select
            value={filters.plan}
            onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-slate-900 "
          >
            <option value="">Todos los planes</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>
      
      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <LicenseTable licenses={licenses} />
      )}
      
      {/* Create Modal */}
      <CreateLicenseModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
