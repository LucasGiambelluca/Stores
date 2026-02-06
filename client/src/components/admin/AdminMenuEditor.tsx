import React, { useState, useRef } from 'react';
import { Plus, Edit, Trash2, Save, X, GripVertical, ExternalLink, Link as LinkIcon, ChevronRight, FolderTree } from 'lucide-react';
import { useMenuLinks, useCategories } from '../../context/StoreContext';
import { MenuLink, Category, Subcategory } from '../../types';
import { AdminLayout } from './AdminLayout';

export const AdminMenuEditor: React.FC = () => {
  const { allMenuLinks, updateMenuLinks } = useMenuLinks();
  const { categories } = useCategories();
  const [editingLink, setEditingLink] = useState<MenuLink | null>(null);
  const [saved, setSaved] = useState(false);
  
  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const handleSave = () => {
    if (!editingLink) return;
    const exists = allMenuLinks.find(l => l.id === editingLink.id);
    if (exists) {
      updateMenuLinks(allMenuLinks.map(l => l.id === editingLink.id ? editingLink : l));
    } else {
      updateMenuLinks([...allMenuLinks, editingLink]);
    }
    setEditingLink(null);
    showSaved();
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este link del menú?')) {
      updateMenuLinks(allMenuLinks.filter(l => l.id !== id));
      showSaved();
    }
  };

  const handleAddNew = () => {
    const newOrder = allMenuLinks.length > 0 
      ? Math.max(...allMenuLinks.map(l => l.order)) + 1 
      : 1;
    setEditingLink({
      id: `menu-${Date.now()}`,
      label: '',
      url: '',
      type: 'internal',
      order: newOrder,
      isActive: true,
    });
  };

  // Add all categories as menu items
  const handleAddAllCategories = () => {
    const existingCategorySlugs = allMenuLinks
      .filter(l => l.type === 'category')
      .map(l => l.categorySlug);
    
    const categoriesToAdd = categories.filter(
      cat => cat.isActive && !existingCategorySlugs.includes(cat.slug)
    );

    if (categoriesToAdd.length === 0) {
      alert('Todas las categorías ya están en el menú');
      return;
    }

    const maxOrder = allMenuLinks.length > 0 
      ? Math.max(...allMenuLinks.map(l => l.order)) 
      : 0;

    const newLinks: MenuLink[] = categoriesToAdd.map((cat, index) => ({
      id: `menu-cat-${cat.id}`,
      label: cat.name,
      url: `#${cat.slug}`,
      type: 'category' as const,
      categorySlug: cat.slug,
      order: maxOrder + index + 1,
      isActive: true,
    }));

    updateMenuLinks([...allMenuLinks, ...newLinks]);
    showSaved();
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    
    // Create custom drag image
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '0.5';
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== draggedId) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedId || draggedId === targetId) {
      setDragOverId(null);
      return;
    }

    const sorted = [...allMenuLinks].sort((a, b) => a.order - b.order);
    const draggedIndex = sorted.findIndex(l => l.id === draggedId);
    const targetIndex = sorted.findIndex(l => l.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Remove dragged item and insert at new position
    const [draggedItem] = sorted.splice(draggedIndex, 1);
    sorted.splice(targetIndex, 0, draggedItem);

    // Reassign order values
    const reordered = sorted.map((item, index) => ({
      ...item,
      order: index + 1
    }));

    updateMenuLinks(reordered);
    setDraggedId(null);
    setDragOverId(null);
    showSaved();
  };

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sortedLinks = [...allMenuLinks].sort((a, b) => a.order - b.order);

  // Get subcategories for a category
  const getSubcategories = (categorySlug: string): Subcategory[] => {
    const category = categories.find(c => c.slug === categorySlug);
    return category?.subcategories || [];
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Editor de Menú</h1>
          <p className="text-gray-600">
            Arrastrá los items para reordenar. Soltá donde quieras.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddAllCategories}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
          >
            <FolderTree size={18} />
            Agregar Categorías
          </button>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors btn-accent"
          >
            <Plus size={20} />
            Agregar Link
          </button>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Arrastrá los items con el ícono ⋮⋮ para reordenarlos. 
          Usá "Agregar Categorías" para importar automáticamente todas las categorías activas.
        </p>
      </div>

      {/* Links List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {sortedLinks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <LinkIcon size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="font-medium">No hay links personalizados</p>
            <p className="text-sm mb-4">El menú usa las categorías por defecto</p>
            <button
              onClick={handleAddAllCategories}
              className="text-blue-600 hover:underline text-sm"
            >
              Importar categorías al menú →
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {sortedLinks.map((link) => {
              const subcats = link.type === 'category' && link.categorySlug 
                ? getSubcategories(link.categorySlug) 
                : [];
              
              return (
                <div 
                  key={link.id}
                  ref={draggedId === link.id ? dragNodeRef : null}
                  draggable
                  onDragStart={(e) => handleDragStart(e, link.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, link.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, link.id)}
                  className={`
                    flex items-center gap-4 p-4 cursor-grab active:cursor-grabbing transition-all
                    ${!link.isActive ? 'opacity-50 bg-gray-50' : ''}
                    ${draggedId === link.id ? 'opacity-50 bg-yellow-50' : ''}
                    ${dragOverId === link.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
                  `}
                >
                  {/* Drag handle */}
                  <div className="text-gray-400 hover:text-gray-600 cursor-grab p-1">
                    <GripVertical size={20} />
                  </div>

                  {/* Link info */}
                  <div className="flex-1">
                    <p className="font-medium">{link.label}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      {link.type === 'external' && <ExternalLink size={12} />}
                      {link.url}
                    </p>
                    {/* Show subcategories if any */}
                    {subcats.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {subcats.map(sub => (
                          <span 
                            key={sub.id}
                            className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                          >
                            <ChevronRight size={10} className="inline" /> {sub.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Type badge */}
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    link.type === 'external' 
                      ? 'bg-purple-100 text-purple-800'
                      : link.type === 'category'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {link.type === 'external' ? 'Externo' : link.type === 'category' ? 'Categoría' : 'Interno'}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setEditingLink(link)} 
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit size={16} className="text-gray-600" />
                    </button>
                    <button 
                      onClick={() => handleDelete(link.id)} 
                      className="p-2 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order preview */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 mb-2">Vista previa del menú:</p>
        <div className="flex flex-wrap gap-4 text-sm">
          {sortedLinks.filter(l => l.isActive).map(link => (
            <span key={link.id} className="px-3 py-1 bg-white rounded border">
              {link.label}
            </span>
          ))}
        </div>
      </div>

      {/* Saved indicator */}
      {saved && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
          ✓ Cambios guardados
        </div>
      )}

      {/* Edit Modal */}
      {editingLink && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              {allMenuLinks.find(l => l.id === editingLink.id) ? 'Editar' : 'Nuevo'} Link
            </h3>
            
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Texto del Link</label>
                <input
                  type="text"
                  value={editingLink.label}
                  onChange={e => setEditingLink({ ...editingLink, label: e.target.value })}
                  placeholder="Ej: Ofertas"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Link</label>
                <select
                  value={editingLink.type}
                  onChange={e => setEditingLink({ 
                    ...editingLink, 
                    type: e.target.value as 'internal' | 'external' | 'category',
                    url: e.target.value === 'category' ? '' : editingLink.url
                  })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="internal">Link Interno</option>
                  <option value="external">Link Externo</option>
                  <option value="category">Categoría</option>
                </select>
              </div>

              {editingLink.type === 'category' ? (
                <div>
                  <label className="block text-sm font-medium mb-1">Categoría</label>
                  <select
                    value={editingLink.categorySlug || ''}
                    onChange={e => {
                      const cat = categories.find(c => c.slug === e.target.value);
                      setEditingLink({ 
                        ...editingLink, 
                        categorySlug: e.target.value,
                        url: `#${e.target.value}`,
                        label: editingLink.label || cat?.name || ''
                      });
                    }}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.filter(c => c.isActive).map(cat => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.name}
                        {(cat.subcategories || []).length > 0 && 
                          ` (${cat.subcategories?.length} subcats)`
                        }
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1">URL</label>
                  <input
                    type="text"
                    value={editingLink.url}
                    onChange={e => setEditingLink({ ...editingLink, url: e.target.value })}
                    placeholder={editingLink.type === 'external' ? 'https://...' : '/pagina'}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              )}

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingLink.isActive}
                    onChange={e => setEditingLink({ ...editingLink, isActive: e.target.checked })}
                  />
                  <span className="text-sm">Activo</span>
                </label>

                {editingLink.type === 'external' && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingLink.openInNewTab ?? true}
                      onChange={e => setEditingLink({ ...editingLink, openInNewTab: e.target.checked })}
                    />
                    <span className="text-sm">Abrir en nueva pestaña</span>
                  </label>
                )}
              </div>
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
                onClick={() => setEditingLink(null)} 
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
