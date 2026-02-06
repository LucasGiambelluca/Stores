import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { useCategories } from '../../context/StoreContext';
import { Category, Subcategory } from '../../types';
import { AdminLayout } from './AdminLayout';

export const AdminCategories: React.FC = () => {
  const { allCategories, addCategory, updateCategory, deleteCategory } = useCategories();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Category>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Subcategory state
  const [editingSubcatId, setEditingSubcatId] = useState<string | null>(null);
  const [addingSubcatTo, setAddingSubcatTo] = useState<string | null>(null);
  const [subcatFormData, setSubcatFormData] = useState<Partial<Subcategory>>({});

  const sortedCategories = [...allCategories].sort((a, b) => a.order - b.order);

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Category handlers
  const handleAdd = () => {
    setIsAdding(true);
    setFormData({
      name: '',
      slug: '',
      order: allCategories.length + 1,
      isActive: true,
      isAccent: false,
      subcategories: []
    });
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData(category);
  };

  const handleSave = () => {
    if (!formData.name || !formData.slug) return;
    
    if (isAdding) {
      addCategory({
        id: `cat-${Date.now()}`,
        name: formData.name,
        slug: formData.slug,
        order: formData.order || allCategories.length + 1,
        isActive: formData.isActive ?? true,
        isAccent: formData.isAccent ?? false,
        subcategories: formData.subcategories || []
      });
      setIsAdding(false);
    } else if (editingId) {
      updateCategory(formData as Category);
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
    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
      deleteCategory(id);
    }
  };

  // Subcategory handlers
  const handleAddSubcat = (categoryId: string) => {
    setAddingSubcatTo(categoryId);
    setSubcatFormData({
      name: '',
      slug: '',
      isActive: true
    });
    // Expand the category to show the new subcategory form
    const newExpanded = new Set(expandedCategories);
    newExpanded.add(categoryId);
    setExpandedCategories(newExpanded);
  };

  const handleEditSubcat = (subcat: Subcategory) => {
    setEditingSubcatId(subcat.id);
    setSubcatFormData(subcat);
  };

  const handleSaveSubcat = (categoryId: string) => {
    if (!subcatFormData.name || !subcatFormData.slug) return;
    
    const category = allCategories.find(c => c.id === categoryId);
    if (!category) return;
    
    const subcategories = category.subcategories || [];
    
    if (addingSubcatTo === categoryId) {
      // Adding new subcategory
      const newSubcat: Subcategory = {
        id: `subcat-${Date.now()}`,
        name: subcatFormData.name,
        slug: subcatFormData.slug,
        isActive: subcatFormData.isActive ?? true
      };
      updateCategory({
        ...category,
        subcategories: [...subcategories, newSubcat]
      });
      setAddingSubcatTo(null);
    } else if (editingSubcatId) {
      // Editing existing subcategory
      updateCategory({
        ...category,
        subcategories: subcategories.map(s => 
          s.id === editingSubcatId ? { ...s, ...subcatFormData } as Subcategory : s
        )
      });
      setEditingSubcatId(null);
    }
    setSubcatFormData({});
  };

  const handleCancelSubcat = () => {
    setAddingSubcatTo(null);
    setEditingSubcatId(null);
    setSubcatFormData({});
  };

  const handleDeleteSubcat = (categoryId: string, subcatId: string) => {
    if (confirm('¿Eliminar esta subcategoría?')) {
      const category = allCategories.find(c => c.id === categoryId);
      if (!category) return;
      
      updateCategory({
        ...category,
        subcategories: (category.subcategories || []).filter(s => s.id !== subcatId)
      });
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Categorías</h1>
          <p className="text-gray-600">Gestión de categorías y subcategorías</p>
        </div>
        <button 
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors btn-accent"
        >
          <Plus size={20} />
          Nueva Categoría
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10"></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subcats</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {/* Add new category row */}
            {isAdding && (
              <tr className="bg-yellow-50">
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    value={formData.order || ''}
                    onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    className="w-16 px-2 py-1 border rounded"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={e => setFormData({ 
                      ...formData, 
                      name: e.target.value,
                      slug: generateSlug(e.target.value)
                    })}
                    placeholder="Nombre"
                    className="w-full px-2 py-1 border rounded"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={formData.slug || ''}
                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="slug-url"
                    className="w-full px-2 py-1 border rounded"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={formData.isActive ?? true}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">-</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={handleSave} className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200">
                      <Save size={16} />
                    </button>
                    <button onClick={handleCancel} className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
                      <X size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Existing categories */}
            {sortedCategories.map(category => (
              <React.Fragment key={category.id}>
                <tr className="hover:bg-gray-50">
                  {editingId === category.id ? (
                    <>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={formData.order || ''}
                          onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) })}
                          className="w-16 px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={formData.name || ''}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={formData.slug || ''}
                          onChange={e => setFormData({ ...formData, slug: e.target.value })}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={formData.isActive ?? true}
                          onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {(category.subcategories || []).length}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={handleSave} className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200">
                            <Save size={16} />
                          </button>
                          <button onClick={handleCancel} className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4">
                        {(category.subcategories || []).length > 0 && (
                          <button 
                            onClick={() => toggleExpand(category.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            {expandedCategories.has(category.id) 
                              ? <ChevronDown size={16} className="text-gray-500" />
                              : <ChevronRight size={16} className="text-gray-500" />
                            }
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-400">
                          <GripVertical size={16} />
                          <span>{category.order}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{category.name}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{category.slug}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {category.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {(category.subcategories || []).length}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleAddSubcat(category.id)} 
                            className="p-2 hover:bg-blue-50 rounded"
                            title="Agregar subcategoría"
                          >
                            <Plus size={16} className="text-blue-500" />
                          </button>
                          <button 
                            onClick={() => handleEdit(category)} 
                            className="p-2 hover:bg-gray-100 rounded"
                          >
                            <Edit size={16} className="text-gray-600" />
                          </button>
                          <button 
                            onClick={() => handleDelete(category.id)} 
                            className="p-2 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>

                {/* Subcategories rows */}
                {expandedCategories.has(category.id) && (
                  <>
                    {(category.subcategories || []).map(subcat => (
                      <tr key={subcat.id} className="bg-gray-50">
                        <td className="px-6 py-3"></td>
                        <td className="px-6 py-3 pl-12" colSpan={2}>
                          {editingSubcatId === subcat.id ? (
                            <input
                              type="text"
                              value={subcatFormData.name || ''}
                              onChange={e => setSubcatFormData({ 
                                ...subcatFormData, 
                                name: e.target.value,
                                slug: generateSlug(e.target.value)
                              })}
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-700">↳ {subcat.name}</span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          {editingSubcatId === subcat.id ? (
                            <input
                              type="text"
                              value={subcatFormData.slug || ''}
                              onChange={e => setSubcatFormData({ ...subcatFormData, slug: e.target.value })}
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          ) : (
                            <span className="text-xs text-gray-500">{subcat.slug}</span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          {editingSubcatId === subcat.id ? (
                            <input
                              type="checkbox"
                              checked={subcatFormData.isActive ?? true}
                              onChange={e => setSubcatFormData({ ...subcatFormData, isActive: e.target.checked })}
                              className="w-4 h-4"
                            />
                          ) : (
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              subcat.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {subcat.isActive ? 'Activa' : 'Inactiva'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3"></td>
                        <td className="px-6 py-3">
                          {editingSubcatId === subcat.id ? (
                            <div className="flex gap-2">
                              <button onClick={() => handleSaveSubcat(category.id)} className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200">
                                <Save size={14} />
                              </button>
                              <button onClick={handleCancelSubcat} className="p-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button onClick={() => handleEditSubcat(subcat)} className="p-1 hover:bg-gray-200 rounded">
                                <Edit size={14} className="text-gray-500" />
                              </button>
                              <button onClick={() => handleDeleteSubcat(category.id, subcat.id)} className="p-1 hover:bg-red-100 rounded">
                                <Trash2 size={14} className="text-red-400" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}

                    {/* Add subcategory row */}
                    {addingSubcatTo === category.id && (
                      <tr className="bg-blue-50">
                        <td className="px-6 py-3"></td>
                        <td className="px-6 py-3 pl-12" colSpan={2}>
                          <input
                            type="text"
                            value={subcatFormData.name || ''}
                            onChange={e => setSubcatFormData({ 
                              ...subcatFormData, 
                              name: e.target.value,
                              slug: generateSlug(e.target.value)
                            })}
                            placeholder="Nombre de subcategoría"
                            className="w-full px-2 py-1 border rounded text-sm"
                            autoFocus
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="text"
                            value={subcatFormData.slug || ''}
                            onChange={e => setSubcatFormData({ ...subcatFormData, slug: e.target.value })}
                            placeholder="slug"
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="checkbox"
                            checked={subcatFormData.isActive ?? true}
                            onChange={e => setSubcatFormData({ ...subcatFormData, isActive: e.target.checked })}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="px-6 py-3"></td>
                        <td className="px-6 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveSubcat(category.id)} className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200">
                              <Save size={14} />
                            </button>
                            <button onClick={handleCancelSubcat} className="p-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Help text */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
        <strong>💡 Tip:</strong> Hacé clic en el botón + azul de una categoría para agregar subcategorías. 
        Las subcategorías te permiten organizar mejor tus productos.
      </div>
    </AdminLayout>
  );
};
