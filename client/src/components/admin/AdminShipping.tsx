import React, { useState, useEffect } from 'react';
import { Truck, Package, MapPin, Check, AlertCircle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Default config values
const defaultConfig = {
  provider: 'manual',
  freeShippingThreshold: 50000,
  defaultShippingCost: 5000,
  enableLocalPickup: true,
  pickupAddress: '',
  pickupHours: 'Lunes a Viernes 10:00 - 18:00',
  zones: [
    { id: '1', name: 'AMBA', cost: 5000, enabled: true },
    { id: '2', name: 'Interior (hasta 500km)', cost: 7000, enabled: true },
    { id: '3', name: 'Interior (más de 500km)', cost: 9000, enabled: true },
  ],
  origin: {
    name: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    email: '',
  },
  correoArgentino: {
    apiKey: '',
    agreement: '',
    env: 'test',
  },
  andreani: {
    username: '',
    password: '',
    clientId: '',
    env: 'test',
  },
  enviopack: {
    apiKey: '',
    secretKey: '',
    env: 'test',
  },
};

export const AdminShipping: React.FC = () => {
  const { token } = useAuth();
  const [shippingConfig, setShippingConfig] = useState(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testingCredentials, setTestingCredentials] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/admin/shipping-config`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setShippingConfig({ ...defaultConfig, ...data });
      }
    } catch (err) {
      console.error('Error loading shipping config:', err);
      setError('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/admin/shipping-config`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shippingConfig),
      });
      
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        throw new Error('Error al guardar');
      }
    } catch (err) {
      console.error('Error saving shipping config:', err);
      setError('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const testCredentials = async () => {
    try {
      setTestingCredentials(true);
      setTestResult(null);
      
      const credentials = shippingConfig.provider === 'correo_argentino' 
        ? shippingConfig.correoArgentino 
        : shippingConfig.andreani;
      
      const response = await fetch(`${API_URL}/admin/shipping-config/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: shippingConfig.provider,
          credentials,
        }),
      });
      
      const result = await response.json();
      setTestResult(result);
    } catch (err) {
      setTestResult({ success: false, message: 'Error de conexión' });
    } finally {
      setTestingCredentials(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Configuración de Envíos</h1>
          <p className="text-gray-600">Configurá los métodos y costos de envío</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 size={20} className="animate-spin" /> : saved ? <Check size={20} /> : null}
          {saving ? 'Guardando...' : saved ? 'Guardado!' : 'Guardar Cambios'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6">
        {/* Provider Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Truck size={20} />
            Proveedor de Envíos
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { id: 'manual', name: 'Manual / Zonas', desc: 'Configurá costos por zona manualmente' },
              { id: 'correo_argentino', name: 'Correo Argentino', desc: 'Integración con API de Correo Argentino' },
              { id: 'andreani', name: 'Andreani', desc: 'Integración con API de Andreani' },
              { id: 'enviopack', name: 'Enviopack', desc: 'Múltiples carriers (CA, Andreani, OCA)' },
            ].map((provider) => (
              <button
                key={provider.id}
                onClick={() => setShippingConfig({ ...shippingConfig, provider: provider.id })}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  shippingConfig.provider === provider.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-semibold">{provider.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{provider.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Zones Configuration */}
        {shippingConfig.provider === 'manual' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin size={20} />
              Zonas de Envío
            </h2>
            
            <div className="space-y-4">
              {shippingConfig.zones.map((zone, index) => (
                <div key={zone.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={zone.enabled}
                    onChange={(e) => {
                      const newZones = [...shippingConfig.zones];
                      newZones[index].enabled = e.target.checked;
                      setShippingConfig({ ...shippingConfig, zones: newZones });
                    }}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={zone.name}
                      onChange={(e) => {
                        const newZones = [...shippingConfig.zones];
                        newZones[index].name = e.target.value;
                        setShippingConfig({ ...shippingConfig, zones: newZones });
                      }}
                      className="font-medium bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">$</span>
                    <input
                      type="number"
                      value={zone.cost}
                      onChange={(e) => {
                        const newZones = [...shippingConfig.zones];
                        newZones[index].cost = parseInt(e.target.value) || 0;
                        setShippingConfig({ ...shippingConfig, zones: newZones });
                      }}
                      className="w-24 px-3 py-1 border rounded-lg"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const newZones = shippingConfig.zones.filter((_, i) => i !== index);
                      setShippingConfig({ ...shippingConfig, zones: newZones });
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
              
              <button
                onClick={() => {
                  const newZones = [...shippingConfig.zones, {
                    id: String(Date.now()),
                    name: 'Nueva Zona',
                    cost: 5000,
                    enabled: true,
                  }];
                  setShippingConfig({ ...shippingConfig, zones: newZones });
                }}
                className="w-full p-3 border-2 border-dashed rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400"
              >
                + Agregar Zona
              </button>
            </div>
          </div>
        )}

        {/* Correo Argentino Config */}
        {shippingConfig.provider === 'correo_argentino' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Credenciales Correo Argentino</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  type="password"
                  value={shippingConfig.correoArgentino.apiKey}
                  onChange={(e) => setShippingConfig({
                    ...shippingConfig,
                    correoArgentino: { ...shippingConfig.correoArgentino, apiKey: e.target.value }
                  })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Tu API Key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agreement (Contrato)</label>
                <input
                  type="text"
                  value={shippingConfig.correoArgentino.agreement}
                  onChange={(e) => setShippingConfig({
                    ...shippingConfig,
                    correoArgentino: { ...shippingConfig.correoArgentino, agreement: e.target.value }
                  })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Ej: 18017"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente</label>
                <select
                  value={shippingConfig.correoArgentino.env}
                  onChange={(e) => setShippingConfig({
                    ...shippingConfig,
                    correoArgentino: { ...shippingConfig.correoArgentino, env: e.target.value }
                  })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="test">Test (Desarrollo)</option>
                  <option value="production">Producción</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={testCredentials}
                  disabled={testingCredentials}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                >
                  {testingCredentials ? <Loader2 size={16} className="animate-spin" /> : null}
                  Probar Credenciales
                </button>
              </div>
            </div>
            
            {testResult && (
              <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
                testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {testResult.success ? <CheckCircle size={20} /> : <XCircle size={20} />}
                {testResult.message}
              </div>
            )}
            
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
              <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-700">
                Necesitás tener un contrato comercial con Correo Argentino para usar esta integración.
                Visitá <a href="https://www.correoargentino.com.ar" target="_blank" rel="noopener" className="underline">correoargentino.com.ar</a> para más información.
              </p>
            </div>
          </div>
        )}

        {/* Andreani Config */}
        {shippingConfig.provider === 'andreani' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Credenciales Andreani</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                <input
                  type="text"
                  value={shippingConfig.andreani.username}
                  onChange={(e) => setShippingConfig({
                    ...shippingConfig,
                    andreani: { ...shippingConfig.andreani, username: e.target.value }
                  })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={shippingConfig.andreani.password}
                  onChange={(e) => setShippingConfig({
                    ...shippingConfig,
                    andreani: { ...shippingConfig.andreani, password: e.target.value }
                  })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client ID (Contrato)</label>
                <input
                  type="text"
                  value={shippingConfig.andreani.clientId}
                  onChange={(e) => setShippingConfig({
                    ...shippingConfig,
                    andreani: { ...shippingConfig.andreani, clientId: e.target.value }
                  })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente</label>
                <select
                  value={shippingConfig.andreani.env}
                  onChange={(e) => setShippingConfig({
                    ...shippingConfig,
                    andreani: { ...shippingConfig.andreani, env: e.target.value }
                  })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="test">Test (Desarrollo)</option>
                  <option value="production">Producción</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={testCredentials}
                disabled={testingCredentials}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                {testingCredentials ? <Loader2 size={16} className="animate-spin" /> : null}
                Probar Credenciales
              </button>
            </div>
            
            {testResult && (
              <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
                testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {testResult.success ? <CheckCircle size={20} /> : <XCircle size={20} />}
                {testResult.message}
              </div>
            )}
            
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
              <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-700">
                Necesitás tener un contrato comercial con Andreani para usar esta integración.
                Visitá <a href="https://www.andreani.com" target="_blank" rel="noopener" className="underline">andreani.com</a> para más información.
              </p>
            </div>
          </div>
        )}

        {/* Enviopack Config */}
        {shippingConfig.provider === 'enviopack' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Package size={24} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Credenciales Enviopack</h2>
                <p className="text-sm text-gray-500">Conectá con Correo Argentino, Andreani, OCA y más</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  type="text"
                  value={(shippingConfig as any).enviopack?.apiKey || ''}
                  onChange={(e) => setShippingConfig({
                    ...shippingConfig,
                    enviopack: { ...(shippingConfig as any).enviopack, apiKey: e.target.value }
                  } as any)}
                  className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                  placeholder="Tu API Key de Enviopack"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                <input
                  type="password"
                  value={(shippingConfig as any).enviopack?.secretKey || ''}
                  onChange={(e) => setShippingConfig({
                    ...shippingConfig,
                    enviopack: { ...(shippingConfig as any).enviopack, secretKey: e.target.value }
                  } as any)}
                  className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                  placeholder="Tu Secret Key de Enviopack"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente</label>
                <select
                  value={(shippingConfig as any).enviopack?.env || 'test'}
                  onChange={(e) => setShippingConfig({
                    ...shippingConfig,
                    enviopack: { ...(shippingConfig as any).enviopack, env: e.target.value }
                  } as any)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="test">Test (Desarrollo)</option>
                  <option value="production">Producción</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={testCredentials}
                  disabled={testingCredentials}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                >
                  {testingCredentials ? <Loader2 size={16} className="animate-spin" /> : null}
                  Probar Credenciales
                </button>
              </div>
            </div>
            
            {testResult && (
              <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
                testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {testResult.success ? <CheckCircle size={20} /> : <XCircle size={20} />}
                {testResult.message}
              </div>
            )}
            
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
              <AlertCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-700">
                <p className="font-medium mb-1">¿Por qué usar Enviopack?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Cotizá y enviá con múltiples carriers desde un solo lugar</li>
                  <li>Correo Argentino, Andreani, OCA, Via Cargo y más</li>
                  <li>Gestión de etiquetas y tracking unificado</li>
                </ul>
                <a href="https://www.enviopack.com" target="_blank" rel="noopener" className="underline mt-2 inline-block">
                  Crear cuenta gratis en Enviopack →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Free Shipping & General Options */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Opciones Generales</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Envío gratis desde ($)</label>
              <input
                type="number"
                value={shippingConfig.freeShippingThreshold}
                onChange={(e) => setShippingConfig({ ...shippingConfig, freeShippingThreshold: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">Pedidos mayores a este monto tienen envío gratis</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo de envío por defecto ($)</label>
              <input
                type="number"
                value={shippingConfig.defaultShippingCost}
                onChange={(e) => setShippingConfig({ ...shippingConfig, defaultShippingCost: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">Se usa si no hay zona configurada</p>
            </div>
          </div>
        </div>

        {/* Local Pickup */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package size={20} />
              Retiro en Local
            </h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={shippingConfig.enableLocalPickup}
                onChange={(e) => setShippingConfig({ ...shippingConfig, enableLocalPickup: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="text-sm">Habilitado</span>
            </label>
          </div>
          
          {shippingConfig.enableLocalPickup && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de retiro</label>
                <input
                  type="text"
                  value={shippingConfig.pickupAddress}
                  onChange={(e) => setShippingConfig({ ...shippingConfig, pickupAddress: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horarios de retiro</label>
                <input
                  type="text"
                  value={shippingConfig.pickupHours}
                  onChange={(e) => setShippingConfig({ ...shippingConfig, pickupHours: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Origin Address */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Dirección de Origen (Remitente)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre/Empresa</label>
              <input
                type="text"
                value={shippingConfig.origin.name}
                onChange={(e) => setShippingConfig({
                  ...shippingConfig,
                  origin: { ...shippingConfig.origin, name: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Mi Tienda"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="text"
                value={shippingConfig.origin.phone}
                onChange={(e) => setShippingConfig({
                  ...shippingConfig,
                  origin: { ...shippingConfig.origin, phone: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="+54 9 11 1234-5678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input
                type="text"
                value={shippingConfig.origin.address}
                onChange={(e) => setShippingConfig({
                  ...shippingConfig,
                  origin: { ...shippingConfig.origin, address: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Av. Ejemplo 1234"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <input
                type="text"
                value={shippingConfig.origin.city}
                onChange={(e) => setShippingConfig({
                  ...shippingConfig,
                  origin: { ...shippingConfig.origin, city: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Buenos Aires"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
              <input
                type="text"
                value={shippingConfig.origin.province}
                onChange={(e) => setShippingConfig({
                  ...shippingConfig,
                  origin: { ...shippingConfig.origin, province: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Buenos Aires"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
              <input
                type="text"
                value={shippingConfig.origin.postalCode}
                onChange={(e) => setShippingConfig({
                  ...shippingConfig,
                  origin: { ...shippingConfig.origin, postalCode: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="1234"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={shippingConfig.origin.email}
                onChange={(e) => setShippingConfig({
                  ...shippingConfig,
                  origin: { ...shippingConfig.origin, email: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="envios@mitienda.com"
              />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminShipping;
