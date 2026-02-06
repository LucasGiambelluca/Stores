import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { licensesApi } from '../../api/licenses';
import type { CreateLicenseInput } from '../../types/license';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface CreateLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateLicenseModal({ isOpen, onClose }: CreateLicenseModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateLicenseInput>({
    plan: 'free',
    duration: 'lifetime',
    ownerEmail: '',
    ownerName: '',
    notes: '',
  });
  
  const createMutation = useMutation({
    mutationFn: (data: CreateLicenseInput) => licensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
      queryClient.invalidateQueries({ queryKey: ['license-stats'] });
      onClose();
      resetForm();
    },
  });
  
  const resetForm = () => {
    setFormData({
      plan: 'free',
      duration: 'lifetime',
      ownerEmail: '',
      ownerName: '',
      notes: '',
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Licencia">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Plan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Plan *
          </label>
          <select
            value={formData.plan}
            onChange={(e) => setFormData({ ...formData, plan: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          >
            <option value="trial">Trial (5 productos, 10 órdenes)</option>
            <option value="free">Free (10 productos, 50 órdenes)</option>
            <option value="starter">Starter (50 productos, 100 órdenes)</option>
            <option value="pro">Pro (2000 productos, ilimitado)</option>
            <option value="enterprise">Enterprise (ilimitado)</option>
          </select>
        </div>
        
        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duración *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: '1week', label: '1 semana (Trial)' },
              { value: 'lifetime', label: 'Vitalicia' },
              { value: '1year', label: '1 año' },
              { value: '6months', label: '6 meses' },
              { value: '3months', label: '3 meses' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData({ ...formData, duration: option.value as any })}
                className={`px-3 py-2 rounded-lg border transition ${
                  formData.duration === option.value
                    ? 'border-primary bg-primary bg-opacity-10 font-medium'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Owner Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email del Cliente
          </label>
          <input
            type="email"
            value={formData.ownerEmail}
            onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="cliente@ejemplo.com"
          />
        </div>
        
        {/* Owner Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Cliente
          </label>
          <input
            type="text"
            value={formData.ownerName}
            onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Juan Pérez"
          />
        </div>
        
        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas Internas
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Notas opcionales..."
          />
        </div>
        
        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={createMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2"
          >
            {createMutation.isPending ? 'Generando...' : (
              <>
                <Sparkles size={18} />
                Generar Licencia
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={createMutation.isPending}
          >
            Cancelar
          </Button>
        </div>
        
        {createMutation.isError && (
          <p className="text-red-600 text-sm">
            Error al crear licencia. Por favor intenta de nuevo.
          </p>
        )}
      </form>
    </Modal>
  );
}
