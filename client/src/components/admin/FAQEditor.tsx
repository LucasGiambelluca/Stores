import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useFAQs } from '../../context/StoreContext';
import { FAQItem } from '../../types';
import { AdminLayout } from './AdminLayout';

export const AdminFAQs: React.FC = () => {
  const { allFAQs, addFAQ, updateFAQ, deleteFAQ } = useFAQs();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<FAQItem>>({});

  const sortedFAQs = [...allFAQs].sort((a, b) => a.order - b.order);

  const categories = [
    { value: 'compras', label: 'Compras' },
    { value: 'pagos', label: 'Pagos' },
    { value: 'envios', label: 'Envíos' },
    { value: 'general', label: 'General' }
  ];

  const handleAdd = () => {
    setIsAdding(true);
    setFormData({
      question: '',
      answer: '',
      category: 'general',
      order: allFAQs.length + 1,
      isActive: true
    });
  };

  const handleEdit = (faq: FAQItem) => {
    setEditingId(faq.id);
    setFormData(faq);
  };

  const handleSave = () => {
    if (!formData.question || !formData.answer) return;
    
    if (isAdding) {
      addFAQ({
        id: `faq-${Date.now()}`,
        question: formData.question,
        answer: formData.answer,
        category: formData.category as FAQItem['category'] || 'general',
        order: formData.order || allFAQs.length + 1,
        isActive: formData.isActive ?? true
      });
      setIsAdding(false);
    } else if (editingId) {
      updateFAQ(formData as FAQItem);
      setEditingId(null);
    }
    setFormData({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta pregunta?')) {
      deleteFAQ(id);
    }
  };

  const getCategoryLabel = (cat: string) => 
    categories.find(c => c.value === cat)?.label || cat;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Preguntas Frecuentes</h1>
          <p className="text-gray-600">Gestión de FAQs</p>
        </div>
        <button 
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors btn-accent"
        >
          <Plus size={20} />
          Nueva Pregunta
        </button>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {isAdding ? 'Nueva Pregunta' : 'Editar Pregunta'}
          </h3>
          
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pregunta</label>
              <input
                type="text"
                value={formData.question || ''}
                onChange={e => setFormData({ ...formData, question: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus-ring-accent"
                placeholder="¿Cómo hago una compra?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Respuesta (HTML permitido)</label>
              <textarea
                value={formData.answer || ''}
                onChange={e => setFormData({ ...formData, answer: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus-ring-accent h-32"
                placeholder="<p>Texto de la respuesta...</p>"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={formData.category || 'general'}
                  onChange={e => setFormData({ ...formData, category: e.target.value as FAQItem['category'] })}
                  className="w-full px-4 py-2 border rounded-lg focus-ring-accent"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                <input
                  type="number"
                  value={formData.order || ''}
                  onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive ?? true}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Activa</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Save size={18} />
              Guardar
            </button>
            <button 
              onClick={handleCancel}
              className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              <X size={18} />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* FAQ List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pregunta</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedFAQs.map(faq => (
              <tr key={faq.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-500">{faq.order}</td>
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-800">{faq.question}</p>
                  <p className="text-sm text-gray-500 truncate max-w-md" 
                     dangerouslySetInnerHTML={{ __html: faq.answer.slice(0, 100) + '...' }} 
                  />
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {getCategoryLabel(faq.category)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    faq.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {faq.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(faq)} className="p-2 hover:bg-gray-100 rounded">
                      <Edit size={16} className="text-gray-600" />
                    </button>
                    <button onClick={() => handleDelete(faq.id)} className="p-2 hover:bg-red-50 rounded">
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};
