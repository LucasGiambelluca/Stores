import React, { useState } from 'react';
import { useStoreConfig } from '../../context/StoreContext';
import { AdminLayout } from './AdminLayout';
import { ImageUpload } from './ImageUpload';
import { getStoreHeaders } from '@/src/utils/storeDetection';
import { API_BASE } from '../../context/storeApi';

// Settings Admin Page
export const AdminSettings: React.FC = () => {
  const { config, updateConfig } = useStoreConfig();
  const [formData, setFormData] = useState(config);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Guardar en el servidor (BD)
      const token = sessionStorage.getItem('token');
      const storeHeaders = getStoreHeaders();
      const response = await fetch(`${API_BASE}/admin/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...storeHeaders
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar configuración');
      }
      
      // Actualizar estado local
      updateConfig(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      
      // Reload preview iframe after save
      const iframe = document.getElementById('store-preview') as HTMLIFrameElement;
      if (iframe) {
        iframe.src = iframe.src;
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
          <p className="text-gray-600">Ajustes generales de la tienda</p>
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            showPreview 
              ? 'bg-blue-100 text-blue-700 border border-blue-300' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {showPreview ? 'Ocultar Preview' : 'Ver Preview'}
        </button>
      </div>

      {/* Live Preview Panel */}
      {showPreview && (
        <div className="mb-6 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-medium">Vista Previa de la Tienda</span>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
            </div>
          </div>
          <iframe
            id="store-preview"
            src="/"
            className="w-full h-[500px] border-0"
            title="Vista previa de la tienda"
          />
          <div className="bg-gray-100 px-4 py-2 text-xs text-gray-500 flex items-center justify-between">
            <span>💡 Guardá los cambios para ver las actualizaciones</span>
            <a 
              href="/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Abrir en nueva pestaña →
            </a>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {/* Store Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Información de la Tienda</h2>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus-ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                <input 
                  type="text" 
                  value={formData.tagline}
                  onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus-ring-accent"
                />
              </div>
            </div>
            <ImageUpload
              value={formData.logo}
              onChange={(url) => setFormData({ ...formData, logo: url })}
              label="Logo de la Tienda"
            />
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Contacto</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <input 
                type="text" 
                value={formData.whatsapp}
                onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="+54 9 11 1234-5678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
              <input 
                type="text" 
                value={formData.instagram}
                onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="@usuario"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input 
                type="text" 
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <input 
                type="text" 
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Promotions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Promociones</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Envío gratis desde ($)</label>
              <input 
                type="number" 
                value={formData.freeShippingFrom}
                onChange={e => setFormData({ ...formData, freeShippingFrom: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descuento transferencia</label>
              <input 
                type="text" 
                value={formData.transferDiscount}
                onChange={e => setFormData({ ...formData, transferDiscount: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Tipografía</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fuente para Títulos</label>
              <select 
                value={formData.fonts?.heading || 'Bebas Neue'}
                onChange={e => setFormData({ 
                  ...formData, 
                  fonts: { ...(formData.fonts || { heading: 'Bebas Neue', body: 'Inter' }), heading: e.target.value } 
                })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="Bebas Neue">Bebas Neue (Display)</option>
                <option value="Space Grotesk">Space Grotesk (Grotesca)</option>
                <option value="DM Sans">DM Sans (Grotesca)</option>
                <option value="Inter">Inter (Sans-serif)</option>
                <option value="Poppins">Poppins (Sans-serif)</option>
                <option value="Montserrat">Montserrat (Sans-serif)</option>
                <option value="Oswald">Oswald (Display)</option>
                <option value="Roboto">Roboto (Sans-serif)</option>
                <option value="Playfair Display">Playfair Display (Serif)</option>
                <option value="Lora">Lora (Serif)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Usada en títulos y encabezados</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fuente para Cuerpo</label>
              <select 
                value={formData.fonts?.body || 'Inter'}
                onChange={e => setFormData({ 
                  ...formData, 
                  fonts: { ...(formData.fonts || { heading: 'Bebas Neue', body: 'Inter' }), body: e.target.value } 
                })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="Inter">Inter</option>
                <option value="Space Grotesk">Space Grotesk</option>
                <option value="DM Sans">DM Sans</option>
                <option value="Roboto">Roboto</option>
                <option value="Poppins">Poppins</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Lato">Lato</option>
                <option value="Nunito">Nunito</option>
                <option value="Montserrat">Montserrat</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Usada en texto general y descripciones</p>
            </div>
          </div>
          {/* Font Preview */}
          <div className="mt-4 p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
            <p className="text-xs text-gray-400 mb-2">Vista previa:</p>
            <h3 
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: `"${formData.fonts?.heading || 'Bebas Neue'}", sans-serif` }}
            >
              {formData.name || 'Título de Ejemplo'}
            </h3>
            <p 
              className="text-gray-600"
              style={{ fontFamily: `"${formData.fonts?.body || 'Inter'}", sans-serif` }}
            >
              Este es un ejemplo de cómo se verá el texto del cuerpo con la fuente seleccionada.
            </p>
          </div>
        </div>

        {/* Colors */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Colores de Marca</h2>
          
          {/* Theme Presets */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Temas Predefinidos</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { 
                  name: 'Midnight Gold', 
                  colors: { primary: '#1a1a1a', secondary: '#F5F5F5', accent: '#E5B800', accentHover: '#D4A900' },
                  preview: ['#1a1a1a', '#E5B800']
                },
                { 
                  name: 'Ocean Blue', 
                  colors: { primary: '#0f172a', secondary: '#f8fafc', accent: '#3b82f6', accentHover: '#2563eb' },
                  preview: ['#0f172a', '#3b82f6']
                },
                { 
                  name: 'Forest Green', 
                  colors: { primary: '#14532d', secondary: '#f0fdf4', accent: '#22c55e', accentHover: '#16a34a' },
                  preview: ['#14532d', '#22c55e']
                },
                { 
                  name: 'Royal Purple', 
                  colors: { primary: '#3b0764', secondary: '#faf5ff', accent: '#a855f7', accentHover: '#9333ea' },
                  preview: ['#3b0764', '#a855f7']
                },
                { 
                  name: 'Rose Pink', 
                  colors: { primary: '#4c0519', secondary: '#fff1f2', accent: '#f43f5e', accentHover: '#e11d48' },
                  preview: ['#4c0519', '#f43f5e']
                },
                { 
                  name: 'Sunset Orange', 
                  colors: { primary: '#431407', secondary: '#fff7ed', accent: '#f97316', accentHover: '#ea580c' },
                  preview: ['#431407', '#f97316']
                },
                { 
                  name: 'Teal Modern', 
                  colors: { primary: '#134e4a', secondary: '#f0fdfa', accent: '#14b8a6', accentHover: '#0d9488' },
                  preview: ['#134e4a', '#14b8a6']
                },
                { 
                  name: 'Minimalist Gray', 
                  colors: { primary: '#18181b', secondary: '#fafafa', accent: '#71717a', accentHover: '#52525b' },
                  preview: ['#18181b', '#71717a']
                },
              ].map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => setFormData({
                    ...formData,
                    colors: { ...formData.colors, ...theme.colors }
                  })}
                  className="p-3 border-2 rounded-lg hover:border-gray-400 transition-all group"
                >
                  <div className="flex gap-1 mb-2">
                    {theme.preview.map((color, i) => (
                      <div 
                        key={i}
                        className="w-6 h-6 rounded-full border border-white shadow-sm" 
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-medium text-gray-700 group-hover:text-gray-900">{theme.name}</p>
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-4">O personalizá los colores manualmente:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primario</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={formData.colors.primary}
                  onChange={e => setFormData({ 
                    ...formData, 
                    colors: { ...formData.colors, primary: e.target.value } 
                  })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input 
                  type="text" 
                  value={formData.colors.primary}
                  onChange={e => setFormData({ 
                    ...formData, 
                    colors: { ...formData.colors, primary: e.target.value } 
                  })}
                  className="flex-1 px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secundario</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={formData.colors.secondary}
                  onChange={e => setFormData({ 
                    ...formData, 
                    colors: { ...formData.colors, secondary: e.target.value } 
                  })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input 
                  type="text" 
                  value={formData.colors.secondary}
                  onChange={e => setFormData({ 
                    ...formData, 
                    colors: { ...formData.colors, secondary: e.target.value } 
                  })}
                  className="flex-1 px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Acento</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={formData.colors.accent}
                  onChange={e => setFormData({ 
                    ...formData, 
                    colors: { ...formData.colors, accent: e.target.value } 
                  })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input 
                  type="text" 
                  value={formData.colors.accent}
                  onChange={e => setFormData({ 
                    ...formData, 
                    colors: { ...formData.colors, accent: e.target.value } 
                  })}
                  className="flex-1 px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Acento Hover</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={formData.colors.accentHover}
                  onChange={e => setFormData({ 
                    ...formData, 
                    colors: { ...formData.colors, accentHover: e.target.value } 
                  })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input 
                  type="text" 
                  value={formData.colors.accentHover}
                  onChange={e => setFormData({ 
                    ...formData, 
                    colors: { ...formData.colors, accentHover: e.target.value } 
                  })}
                  className="flex-1 px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
          </div>
          
          <h3 className="text-sm font-medium text-gray-700 mb-3 mt-6 border-t pt-4">Colores de Tipografía e Iconos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color de Texto</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={formData.colors.text || '#1a1a1a'}
                  onChange={e => setFormData({ 
                    ...formData, 
                    colors: { ...formData.colors, text: e.target.value } 
                  })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input 
                  type="text" 
                  value={formData.colors.text || '#1a1a1a'}
                  onChange={e => setFormData({ 
                    ...formData, 
                    colors: { ...formData.colors, text: e.target.value } 
                  })}
                  className="flex-1 px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color de Iconos</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={formData.colors.icon || '#E5B800'}
                  onChange={e => setFormData({ 
                    ...formData, 
                    colors: { ...formData.colors, icon: e.target.value } 
                  })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input 
                  type="text" 
                  value={formData.colors.icon || '#E5B800'}
                  onChange={e => setFormData({ 
                    ...formData, 
                    colors: { ...formData.colors, icon: e.target.value } 
                  })}
                  className="flex-1 px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color de Fondo</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={formData.colors.background || '#F5F5F5'}
                  onChange={e => setFormData({ 
                    ...formData, 
                    colors: { ...formData.colors, background: e.target.value } 
                  })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input 
                  type="text" 
                  value={formData.colors.background || '#F5F5F5'}
                  onChange={e => setFormData({ 
                    ...formData, 
                    colors: { ...formData.colors, background: e.target.value } 
                  })}
                  className="flex-1 px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Marketing & Integrations */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">Marketing e Integraciones</h2>
            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Pro</span>
          </div>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Pixel ID</label>
              <input 
                type="text" 
                value={formData.facebookPixelId || ''}
                onChange={e => setFormData({ ...formData, facebookPixelId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus-ring-accent"
                placeholder="Ej: 123456789012345"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ingresá solo el identificador numérico de tu Pixel de Meta.
              </p>
            </div>
          </div>
        </div>

        {/* AI Integrations */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">🤖 Inteligencia Artificial</h2>
            <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Beta</span>
          </div>
          <div className="grid gap-4">
            {/* HuggingFace API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key de HuggingFace
              </label>
              <input 
                type="password" 
                value={(formData as any).huggingfaceApiKey || ''}
                onChange={e => setFormData({ ...formData, huggingfaceApiKey: e.target.value } as any)}
                className="w-full px-4 py-2 border rounded-lg focus-ring-accent"
                placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
              <p className="text-xs text-gray-500 mt-2">
                Obtené tu API key gratis en{' '}
                <a 
                  href="https://huggingface.co/settings/tokens" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline"
                >
                  huggingface.co/settings/tokens
                </a>
              </p>
              <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                <h4 className="font-medium text-purple-900 text-sm mb-1">✨ Probador Virtual con IA</h4>
                <p className="text-xs text-purple-700">
                  Al configurar tu API key, los clientes podrán probarse la ropa virtualmente usando Inteligencia Artificial.
                  Este botón aparecerá en la página de cada producto.
                </p>
                <p className="text-xs text-purple-600 mt-2">
                  <strong>Estado:</strong> {(formData as any).huggingfaceApiKey ? '✅ Habilitado' : '❌ Deshabilitado'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Buttons Config */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Botones Flotantes</h2>
          
          {/* WhatsApp Button */}
          <div className="border-b pb-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium">Botón de WhatsApp</h3>
                <p className="text-sm text-gray-500">Muestra un botón flotante para contacto por WhatsApp</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.showWhatsAppButton !== false}
                  onChange={e => setFormData({ ...formData, showWhatsAppButton: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
            {formData.showWhatsAppButton !== false && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de WhatsApp</label>
                <input 
                  type="text" 
                  value={formData.whatsapp || ''}
                  onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="+54 9 11 1234-5678"
                />
                <p className="text-xs text-gray-500 mt-1">Este número también se usa en la sección de contacto</p>
              </div>
            )}
          </div>
          
          {/* Dark Mode Toggle */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium">Toggle de Modo Oscuro</h3>
                <p className="text-sm text-gray-500">Permite a los usuarios cambiar entre tema claro y oscuro</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.showDarkModeToggle !== false}
                  onChange={e => setFormData({ ...formData, showDarkModeToggle: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Los colores del modo oscuro se generan automáticamente basados en tu paleta. Para personalizarlos, edita el CSS.
            </p>
          </div>
        </div>

        {/* Shipping Origin - Use store data */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Dirección de Origen (Remitente)</h2>
          <p className="text-sm text-gray-500 mb-4">Estos datos se usan para calcular envíos y como remitente en las etiquetas.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input 
                type="text" 
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Nombre de la tienda"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input 
                type="text" 
                value={formData.whatsapp || ''}
                onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="+54 9 11 1234-5678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input 
                type="text" 
                value={formData.address || ''}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Calle y número"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <input 
                type="text" 
                value={formData.city || ''}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Ciudad"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            saved 
              ? 'bg-green-600 text-white' 
              : saving
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'btn-accent'
          }`}
        >
          {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar Cambios'}
        </button>
      </div>
    </AdminLayout>
  );
};
