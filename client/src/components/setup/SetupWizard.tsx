import React, { useState } from 'react';
import { Check, ArrowRight, ArrowLeft, Store, Palette, Mail, Rocket } from 'lucide-react';
import { getStoreHeaders } from '../../utils/storeDetection';
import './SetupStyles.css';

// Types
interface StoreSetupData {
  // Step 1: Basic Info
  name: string;
  tagline: string;
  category: string;
  licenseKey: string; // Serial de activación
  
  // Step 2: Branding
  logo: string;
  primaryColor: string;
  accentColor: string;
  
  // Step 3: Contact & Admin
  email: string;
  whatsapp: string;
  instagram: string;
  address: string;
  adminEmail: string;
  adminPassword: string;
  
  // Custom categories
  categories: string[];
}

interface SetupWizardProps {
  onComplete: (data: StoreSetupData) => void;
}

const STEPS = [
  { id: 1, label: 'Información', icon: Store },
  { id: 2, label: 'Diseño', icon: Palette },
  { id: 3, label: 'Contacto', icon: Mail },
  { id: 4, label: 'Lanzar', icon: Rocket },
];

const CATEGORIES = [
  'Ropa y Moda',
  'Electrónica',
  'Hogar y Decoración',
  'Deportes',
  'Belleza y Cuidado Personal',
  'Alimentos y Bebidas',
  'Juguetes y Niños',
  'Otros',
];

// Industry-specific presets
interface IndustryPreset {
  primaryColor: string;
  accentColor: string;
  suggestedTaglines: string[];
  suggestedCategories: string[];
  icon: string;
}

const INDUSTRY_PRESETS: Record<string, IndustryPreset> = {
  'Ropa y Moda': {
    primaryColor: '#1a1a1a',
    accentColor: '#E5B800',
    suggestedTaglines: [
      'Estilo que define tu personalidad',
      'Moda que marca tendencia',
      'Tu look, tu esencia',
      'Vestite con actitud',
    ],
    suggestedCategories: ['Remeras', 'Pantalones', 'Vestidos', 'Camperas', 'Accesorios', 'Calzado'],
    icon: '👗',
  },
  'Electrónica': {
    primaryColor: '#0f172a',
    accentColor: '#3b82f6',
    suggestedTaglines: [
      'Tecnología que transforma',
      'Innovación al alcance de tu mano',
      'Conectate con el futuro',
      'Lo último en tecnología',
    ],
    suggestedCategories: ['Celulares', 'Computadoras', 'Audio', 'Gaming', 'Accesorios', 'Smart Home'],
    icon: '📱',
  },
  'Hogar y Decoración': {
    primaryColor: '#44403c',
    accentColor: '#a78bfa',
    suggestedTaglines: [
      'Tu hogar, tu refugio',
      'Diseño que inspira',
      'Espacios que enamoran',
      'Transformá tu espacio',
    ],
    suggestedCategories: ['Muebles', 'Decoración', 'Iluminación', 'Textiles', 'Organización', 'Jardín'],
    icon: '🏠',
  },
  'Deportes': {
    primaryColor: '#1e293b',
    accentColor: '#22c55e',
    suggestedTaglines: [
      'Superá tus límites',
      'Equipamiento para campeones',
      'El deporte es tu pasión',
      'Rendimiento sin límites',
    ],
    suggestedCategories: ['Ropa Deportiva', 'Calzado', 'Equipamiento', 'Fitness', 'Outdoor', 'Accesorios'],
    icon: '⚽',
  },
  'Belleza y Cuidado Personal': {
    primaryColor: '#4c0519',
    accentColor: '#f43f5e',
    suggestedTaglines: [
      'Tu belleza, nuestra pasión',
      'Cuidate, brillá',
      'Descubrí tu mejor versión',
      'Belleza natural',
    ],
    suggestedCategories: ['Skincare', 'Maquillaje', 'Cabello', 'Fragancias', 'Cuidado Corporal', 'Uñas'],
    icon: '💄',
  },
  'Alimentos y Bebidas': {
    primaryColor: '#431407',
    accentColor: '#f97316',
    suggestedTaglines: [
      'Sabores que enamoran',
      'Del productor a tu mesa',
      'Calidad que se sabe',
      'Momentos deliciosos',
    ],
    suggestedCategories: ['Gourmet', 'Bebidas', 'Snacks', 'Orgánicos', 'Dulces', 'Saludables'],
    icon: '🍕',
  },
  'Juguetes y Niños': {
    primaryColor: '#3b0764',
    accentColor: '#a855f7',
    suggestedTaglines: [
      'Diversión sin límites',
      'Donde la magia sucede',
      'Momentos de alegría',
      'Jugar es crecer',
    ],
    suggestedCategories: ['Juguetes', 'Ropa Infantil', 'Bebés', 'Educativos', 'Exterior', 'Disfraces'],
    icon: '🧸',
  },
  'Otros': {
    primaryColor: '#18181b',
    accentColor: '#71717a',
    suggestedTaglines: [
      'Todo lo que necesitás',
      'Calidad garantizada',
      'Tu tienda de confianza',
    ],
    suggestedCategories: ['Categoría 1', 'Categoría 2', 'Categoría 3'],
    icon: '🛒',
  },
};

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [logoMode, setLogoMode] = useState<'upload' | 'url'>('upload');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [data, setData] = useState<StoreSetupData>({
    name: '',
    tagline: '',
    category: '',
    licenseKey: '',
    logo: '',
    primaryColor: '#1a1a1a',
    accentColor: '#3b82f6',
    email: '',
    whatsapp: '',
    instagram: '',
    address: '',
    adminEmail: '',
    adminPassword: '',
    categories: [],
  });
  const [errors, setErrors] = useState<Partial<StoreSetupData>>({});

  // Clear legacy data on mount
  React.useEffect(() => {
    try {
      // Clear ALL legacy data to ensure fresh start
      sessionStorage.removeItem('store_coupons');
      sessionStorage.removeItem('cart-storage');
      sessionStorage.removeItem('wishlist-storage');
      sessionStorage.removeItem('tienda_store_data'); // Clear main store data
      
      // Also clear any other potential keys from sessionStorage
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        // CRITICAL: Do NOT clear tiendita_store_id, as it's needed for context
        if (key === 'tiendita_store_id') continue;
        
        if (key && (key.startsWith('store_') || key.includes('cart') || key.includes('wishlist'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
      
      console.log('🧹 Cleaned up session storage for setup');
    } catch (e) {
      console.warn('Error clearing local storage:', e);
    }
  }, []);

  const updateField = (field: keyof StoreSetupData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle category change and apply industry presets
  const handleCategoryChange = (category: string) => {
    updateField('category', category);
    
    const preset = INDUSTRY_PRESETS[category];
    if (preset) {
      // Apply preset colors
      setData(prev => ({
        ...prev,
        category,
        primaryColor: preset.primaryColor,
        accentColor: preset.accentColor,
        // Suggest a random tagline if user hasn't entered one
        tagline: prev.tagline || preset.suggestedTaglines[Math.floor(Math.random() * preset.suggestedTaglines.length)],
        // Set suggested categories
        categories: [...preset.suggestedCategories],
      }));
    }
  };

  // Category management handlers
  const addCategory = () => {
    const name = prompt('Nombre de la nueva categoría:');
    if (name && name.trim()) {
      setData(prev => ({
        ...prev,
        categories: [...prev.categories, name.trim()]
      }));
    }
  };

  const removeCategory = (index: number) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index)
    }));
  };

  const updateCategoryName = (index: number, newName: string) => {
    const newCategories = [...data.categories];
    newCategories[index] = newName;
    setData(prev => ({
      ...prev,
      categories: newCategories
    }));
  };

  // Upload logo directly to Cloudinary (unsigned upload)
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es muy grande. Máximo 5MB.');
      return;
    }

    setUploadingLogo(true);
    try {
      // Get Cloudinary config from server
      const configRes = await fetch('/api/config', {
        headers: getStoreHeaders()
      });
      const config = await configRes.json();
      
      // For now, convert to base64 data URL (works without Cloudinary)
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        updateField('logo', dataUrl);
        setUploadingLogo(false);
      };
      reader.onerror = () => {
        alert('Error al leer la imagen. Intenta con "Pegar URL".');
        setUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Logo upload error:', error);
      alert('Error al subir la imagen. Intenta con "Pegar URL".');
      setUploadingLogo(false);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<StoreSetupData> = {};
    let isValid = true;

    if (step === 1) {
      if (!data.name) { newErrors.name = 'El nombre es requerido'; isValid = false; }
      if (!data.category) { newErrors.category = 'La categoría es requerida'; isValid = false; }
      // License is optional - don't validate here
    }

    if (step === 3) {
      if (!data.adminEmail) { newErrors.adminEmail = 'El email de admin es requerido'; isValid = false; }
      if (!data.adminPassword) { newErrors.adminPassword = 'La contraseña es requerida'; isValid = false; }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Get storeId from URL or session to update existing store
      const urlParams = new URLSearchParams(window.location.search);
      const storeId = urlParams.get('storeId') || sessionStorage.getItem('tiendita_store_id');

      // 1. Create/Update Store & Admin User
      const setupResponse = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          storeId, // Send explicit storeId if available
        }),
      });

      if (!setupResponse.ok) {
        const errorData = await setupResponse.json();
        throw new Error(errorData.error || 'Error en la configuración');
      }

      const setupResult = await setupResponse.json();
      const newStoreId = setupResult.storeId;

      // 2. License Activation is now handled atomically by /api/setup
      if (data.licenseKey) {
        console.log('✅ License activation requested via setup');
      }

      console.log('🎉 Setup complete! Reloading page...');
      
      // Show success message briefly then trigger reload via onComplete
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Call onComplete to trigger page reload and exit wizard
      // Save storeId and reload with it in URL
      sessionStorage.setItem('tiendita_store_id', newStoreId);
      const url = new URL(window.location.href);
      url.searchParams.set('storeId', newStoreId);
      window.location.href = url.toString();
      
    } catch (error) {
      console.error('❌ Setup error:', error);
      setIsLoading(false);
      alert('Error al guardar la configuración: ' + (error as Error).message);
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 4) {
        handleSubmit();
      } else {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Helper to darken/lighten color
  const adjustColor = (hex: string, amount: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="wizard-loading">
        <div className="limestore-spinner">
          <Store size={48} className="limestore-spinner__icon" />
          <p className="limestore-spinner__text">Creando tu tienda...</p>
        </div>
        <div className="wizard-loading__progress">
          <div className="wizard-loading__bar" />
        </div>
      </div>
    );
  }

  return (
    <div className="wizard-container">
      {/* Header - LimeStore Branding */}
      <header className="wizard-header">
        <div className="wizard-header__logo-container">
          <img 
            src="/limestore-logo.png" 
            alt="LimeStore" 
            className="wizard-header__logo"
            style={{ width: 32, height: 32 }}
            onError={(e) => {
              // Fallback to Store icon if logo not found
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <span className="wizard-header__title">LimeStore</span>
        <span className="wizard-header__subtitle">Nueva Tienda</span>
      </header>

      {/* Steps */}
      <nav className="wizard-steps">
        {STEPS.map((step) => (
          <div 
            key={step.id}
            className={`wizard-step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
          >
            <div className="wizard-step__number">
              {currentStep > step.id ? <Check size={16} /> : step.id}
            </div>
            <span className="wizard-step__label">{step.label}</span>
          </div>
        ))}
      </nav>

      {/* Content */}
      <main className="wizard-content">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <>
            <h1 className="wizard-content__title">¿Cómo se llama tu tienda?</h1>
            <p className="wizard-content__subtitle">
              Elegí un nombre único que represente tu marca
            </p>

            <div className="wizard-form-group">
              <label className="wizard-label">Nombre de la tienda *</label>
              <input
                type="text"
                className={`wizard-input ${errors.name ? 'error' : ''}`}
                placeholder="Ej: Mi Tienda Online"
                value={data.name}
                onChange={(e) => updateField('name', e.target.value)}
                autoFocus
              />
              {errors.name && <p className="wizard-error">{errors.name}</p>}
            </div>

            <div className="wizard-form-group">
              <label className="wizard-label">Slogan (opcional)</label>
              <input
                type="text"
                className="wizard-input"
                placeholder="Ej: Los mejores productos al mejor precio"
                value={data.tagline}
                onChange={(e) => updateField('tagline', e.target.value)}
              />
            </div>

            <div className="wizard-form-group">
              <label className="wizard-label">Rubro</label>
              <select
                className="wizard-input"
                value={data.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {CATEGORIES.map(cat => {
                  const preset = INDUSTRY_PRESETS[cat];
                  return (
                    <option key={cat} value={cat}>
                      {preset?.icon} {cat}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* License Key Input */}
            <div className="wizard-form-group">
              <label className="wizard-label">
                Serial de activación
                <span style={{ color: '#888', fontSize: '0.85em', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                  (opcional para pruebas)
                </span>
              </label>
              <input
                type="text"
                className="wizard-input"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={data.licenseKey}
                onChange={(e) => updateField('licenseKey', e.target.value)}
              />
              <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
                💡 Dejá en blanco para entorno de pruebas
              </p>
            </div>

            {/* Industry context panel - shows when category is selected */}
            {data.category && INDUSTRY_PRESETS[data.category] && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'linear-gradient(135deg, rgba(102, 255, 0, 0.1) 0%, rgba(102, 255, 0, 0.05) 100%)',
                borderRadius: '12px',
                border: '1px solid rgba(102, 255, 0, 0.3)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{INDUSTRY_PRESETS[data.category].icon}</span>
                  <span style={{ fontWeight: 600, color: '#333' }}>
                    Tienda de {data.category}
                  </span>
                </div>
                
                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.75rem' }}>
                  ✨ Configuramos colores y sugerencias para tu tipo de tienda
                </p>
                
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#888', width: '100%' }}>
                      Categorías iniciales (podés editar, borrar o agregar):
                    </span>
                    
                    {data.categories.map((cat, idx) => (
                      <div 
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.8rem',
                          padding: '0.3rem 0.6rem',
                          background: 'white',
                          borderRadius: '6px',
                          color: '#333',
                          border: '1px solid #eee',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                      >
                        <input 
                          type="text"
                          value={cat}
                          onChange={(e) => updateCategoryName(idx, e.target.value)}
                          style={{
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            width: `${Math.max(cat.length, 5)}ch`,
                            minWidth: '50px'
                          }}
                        />
                        <button
                          onClick={() => removeCategory(idx)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#ff4444',
                            cursor: 'pointer',
                            padding: '0 2px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Eliminar categoría"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    ))}
                    
                    <button
                      onClick={addCategory}
                      style={{
                        fontSize: '0.8rem',
                        padding: '0.3rem 0.8rem',
                        background: 'rgba(102, 255, 0, 0.2)',
                        borderRadius: '6px',
                        color: '#1a1a1a',
                        border: '1px dashed #66FF00',
                        cursor: 'pointer',
                        fontWeight: 500
                      }}
                    >
                      + Agregar
                    </button>
                  </div>
              </div>
            </div>
            )}
          </>
        )}

        {/* Step 2: Branding */}
        {currentStep === 2 && (
          <>
            <h1 className="wizard-content__title">Diseñá tu marca</h1>
            <p className="wizard-content__subtitle">
              Elegí los colores que representan tu tienda
            </p>

            <div className="wizard-form-group">
              <label className="wizard-label">Logo de tu tienda (opcional)</label>
              
              {/* Tab selector */}
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                marginBottom: '0.75rem' 
              }}>
                <button
                  type="button"
                  onClick={() => setLogoMode('upload')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: logoMode === 'upload' ? '2px solid #66FF00' : '1px solid #ddd',
                    borderRadius: '8px',
                    background: logoMode === 'upload' ? 'rgba(102, 255, 0, 0.1)' : 'white',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: logoMode === 'upload' ? 600 : 400,
                  }}
                >
                  📤 Subir imagen
                </button>
                <button
                  type="button"
                  onClick={() => setLogoMode('url')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: logoMode === 'url' ? '2px solid #66FF00' : '1px solid #ddd',
                    borderRadius: '8px',
                    background: logoMode === 'url' ? 'rgba(102, 255, 0, 0.1)' : 'white',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: logoMode === 'url' ? 600 : 400,
                  }}
                >
                  🔗 Pegar URL
                </button>
              </div>

              {/* Upload mode */}
              {logoMode === 'upload' && (
                <div>
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="logo-upload"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '1rem',
                      background: '#f4f4f4',
                      borderRadius: '12px',
                      cursor: uploadingLogo ? 'wait' : 'pointer',
                      border: '2px dashed #ccc',
                      transition: 'all 0.2s',
                    }}
                  >
                    {uploadingLogo ? (
                      <>
                        <span className="limestore-spinner__logo" style={{ width: 24, height: 24 }} />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        📷 Elegir imagen
                      </>
                    )}
                  </label>
                </div>
              )}

              {/* URL mode */}
              {logoMode === 'url' && (
                <input
                  type="url"
                  className="wizard-input"
                  placeholder="https://ejemplo.com/mi-logo.png"
                  value={data.logo}
                  onChange={(e) => updateField('logo', e.target.value)}
                />
              )}

              {/* Preview */}
              {data.logo && (
                <div style={{ 
                  marginTop: '1rem', 
                  textAlign: 'center',
                  padding: '1rem',
                  background: '#f4f4f4',
                  borderRadius: '12px'
                }}>
                  <img 
                    src={data.logo} 
                    alt="Logo Preview" 
                    style={{ 
                      maxHeight: '80px', 
                      maxWidth: '200px',
                      borderRadius: '8px',
                      objectFit: 'contain'
                    }}
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  <button
                    type="button"
                    onClick={() => updateField('logo', '')}
                    style={{
                      display: 'block',
                      margin: '0.5rem auto 0',
                      padding: '0.25rem 0.5rem',
                      background: 'transparent',
                      border: 'none',
                      color: '#888',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    ✕ Quitar logo
                  </button>
                </div>
              )}
            </div>

            <div className="wizard-form-group">
              <label className="wizard-label">Color Principal</label>
              <div className="wizard-color-picker">
                <input
                  type="color"
                  className="wizard-color-input"
                  value={data.primaryColor}
                  onChange={(e) => updateField('primaryColor', e.target.value)}
                />
                <div 
                  className="wizard-color-preview"
                  style={{ backgroundColor: data.primaryColor }}
                >
                  {data.primaryColor}
                </div>
              </div>
            </div>

            <div className="wizard-form-group">
              <label className="wizard-label">Color de Acento</label>
              <div className="wizard-color-picker">
                <input
                  type="color"
                  className="wizard-color-input"
                  value={data.accentColor}
                  onChange={(e) => updateField('accentColor', e.target.value)}
                />
                <div 
                  className="wizard-color-preview"
                  style={{ backgroundColor: data.accentColor }}
                >
                  {data.accentColor}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div style={{ 
              marginTop: '2rem', 
              padding: '1.5rem', 
              borderRadius: '8px',
              backgroundColor: '#f9f9f9'
            }}>
              <p style={{ fontSize: '12px', color: '#888', marginBottom: '1rem', textTransform: 'uppercase' }}>
                Vista previa
              </p>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ 
                  backgroundColor: data.primaryColor, 
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  fontWeight: 600
                }}>
                  {data.name || 'Tu Tienda'}
                </div>
                <button style={{
                  backgroundColor: data.accentColor,
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}>
                  Comprar
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Contact */}
        {currentStep === 3 && (
          <>
            <h1 className="wizard-content__title">Información de contacto</h1>
            <p className="wizard-content__subtitle">
              Cómo tus clientes pueden comunicarse con vos
            </p>

            <div className="wizard-form-group">
              <label className="wizard-label">Email de contacto *</label>
              <input
                type="email"
                className={`wizard-input ${errors.email ? 'error' : ''}`}
                placeholder="contacto@mitienda.com"
                value={data.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
              {errors.email && <p className="wizard-error">{errors.email}</p>}
            </div>

            <div className="wizard-form-group">
              <label className="wizard-label">WhatsApp (opcional)</label>
              <input
                type="tel"
                className="wizard-input"
                placeholder="+54 9 11 1234-5678"
                value={data.whatsapp}
                onChange={(e) => updateField('whatsapp', e.target.value)}
              />
            </div>

            <div className="wizard-form-group">
              <label className="wizard-label">Instagram (opcional)</label>
              <input
                type="text"
                className="wizard-input"
                placeholder="@mitienda"
                value={data.instagram}
                onChange={(e) => updateField('instagram', e.target.value)}
              />
            </div>

            <div className="wizard-form-group">
              <label className="wizard-label">Dirección (opcional)</label>
              <input
                type="text"
                className="wizard-input"
                placeholder="Av. Corrientes 1234, CABA"
                value={data.address}
                onChange={(e) => updateField('address', e.target.value)}
              />
            </div>

            {/* Admin Credentials Section */}
            <div style={{ 
              marginTop: '2rem', 
              paddingTop: '2rem', 
              borderTop: '2px solid #f0f0f0' 
            }}>
              <h3 style={{ 
                fontSize: '1.1rem', 
                fontWeight: 600, 
                marginBottom: '0.5rem',
                color: '#1a1a1a'
              }}>
                👤 Credenciales de Administrador
              </h3>
              <p style={{ 
                fontSize: '0.85rem', 
                color: '#666', 
                marginBottom: '1.5rem' 
              }}>
                Estas serán tus credenciales para acceder al panel de administración
              </p>

              <div className="wizard-form-group">
                <label className="wizard-label">Email del administrador *</label>
                <input
                  type="email"
                  className={`wizard-input ${errors.adminEmail ? 'error' : ''}`}
                  placeholder="admin@mitienda.com"
                  value={data.adminEmail}
                  onChange={(e) => updateField('adminEmail', e.target.value)}
                />
                {errors.adminEmail && <p className="wizard-error">{errors.adminEmail}</p>}
              </div>

              <div className="wizard-form-group">
                <label className="wizard-label">Contraseña del administrador *</label>
                <input
                  type="password"
                  className={`wizard-input ${errors.adminPassword ? 'error' : ''}`}
                  placeholder="Mínimo 6 caracteres"
                  value={data.adminPassword}
                  onChange={(e) => updateField('adminPassword', e.target.value)}
                />
                {errors.adminPassword && <p className="wizard-error">{errors.adminPassword}</p>}
                <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
                  💡 Recordá esta contraseña para acceder al panel de administración
                </p>
              </div>
            </div>
          </>
        )}

        {/* Step 4: Review & Launch */}
        {currentStep === 4 && (
          <>
            <h1 className="wizard-content__title">¡Todo listo!</h1>
            <p className="wizard-content__subtitle">
              Revisá la configuración antes de lanzar tu tienda
            </p>

            <div style={{ 
              backgroundColor: '#f9f9f9', 
              borderRadius: '12px', 
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ fontSize: '14px', color: '#888', marginBottom: '1rem', textTransform: 'uppercase' }}>
                Resumen
              </h3>
              
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <strong>Nombre:</strong> {data.name}
                </div>
                {data.tagline && (
                  <div>
                    <strong>Slogan:</strong> {data.tagline}
                  </div>
                )}
                <div>
                  <strong>Email:</strong> {data.email}
                </div>
                {data.whatsapp && (
                  <div>
                    <strong>WhatsApp:</strong> {data.whatsapp}
                  </div>
                )}
                <div>
                  <strong>Colores:</strong>
                  <span style={{ 
                    display: 'inline-block',
                    width: '20px',
                    height: '20px',
                    backgroundColor: data.primaryColor,
                    borderRadius: '4px',
                    marginLeft: '8px',
                    verticalAlign: 'middle'
                  }} />
                  <span style={{ 
                    display: 'inline-block',
                    width: '20px',
                    height: '20px',
                    backgroundColor: data.accentColor,
                    borderRadius: '4px',
                    marginLeft: '4px',
                    verticalAlign: 'middle'
                  }} />
                </div>
              </div>
            </div>

            <div style={{ 
              backgroundColor: '#111', 
              color: '#66FF00',
              borderRadius: '12px', 
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <Rocket size={40} style={{ marginBottom: '1rem' }} />
              <p style={{ fontSize: '14px', opacity: 0.8 }}>
                Al hacer clic en "Lanzar Tienda", tu tienda estará lista para recibir clientes.
              </p>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="wizard-actions">
          <button 
            className="wizard-btn wizard-btn-secondary"
            onClick={prevStep}
            style={{ visibility: currentStep === 1 ? 'hidden' : 'visible' }}
          >
            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
            Volver
          </button>

          <button 
            className="wizard-btn wizard-btn-primary"
            onClick={nextStep}
          >
            {currentStep === 4 ? (
              <>
                <Rocket size={16} style={{ marginRight: '8px' }} />
                Lanzar Tienda
              </>
            ) : (
              <>
                Continuar
                <ArrowRight size={16} style={{ marginLeft: '8px' }} />
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
};

export default SetupWizard;
