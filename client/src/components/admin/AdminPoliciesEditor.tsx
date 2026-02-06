import React, { useState, useEffect } from 'react';
import { Save, FileText, CheckCircle, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { AdminLayout } from './AdminLayout';

// Default policy configuration
const DEFAULT_RETURN_CONFIG = {
  arrepentimientoDias: 10,
  arrepentimientoCondiciones: 'El producto debe estar sin uso, con etiquetas y empaque original.',
  defectosDias: 30,
  defectosDescripcion: 'Si recibiste un producto con fallas de fabricación o diferente al solicitado.',
  talleDias: 15,
  talleCondiciones: 'Sujeto a disponibilidad de stock. El producto debe estar sin uso.',
  reintegroPlazo: 10,
  reintegroMedio: 'el mismo medio de pago utilizado en la compra original',
  costoArrepentimiento: 'vendedor',
  costoDefectos: 'vendedor',
  costoTalle: 'comprador',
  contactoTexto: 'Para cualquier consulta sobre devoluciones, contactanos y te ayudamos.',
};

const DEFAULT_TERMS_CONFIG = {
  nombreTienda: '',
  email: '',
  telefono: '',
  ciudad: '',
  cuotasSinInteres: 6,
  descuentoTransferencia: 15,
  envioGratisDesde: 200000,
  plazoEntregaTexto: 'Los plazos de entrega son estimativos y varían según la zona.',
  garantiaMeses: 6,
  datosUso: 'Procesar pedidos, enviar comunicaciones de compra, y enviar promociones (solo con consentimiento).',
};

export const AdminPoliciesEditor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'return' | 'terms'>('return');
  const [returnConfig, setReturnConfig] = useState(DEFAULT_RETURN_CONFIG);
  const [termsConfig, setTermsConfig] = useState(DEFAULT_TERMS_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    const savedReturn = sessionStorage.getItem('store_returnConfig');
    const savedTerms = sessionStorage.getItem('store_termsConfig');
    if (savedReturn) setReturnConfig({ ...DEFAULT_RETURN_CONFIG, ...JSON.parse(savedReturn) });
    if (savedTerms) setTermsConfig({ ...DEFAULT_TERMS_CONFIG, ...JSON.parse(savedTerms) });
  };

  const handleSave = () => {
    setIsSaving(true);
    sessionStorage.setItem('store_returnConfig', JSON.stringify(returnConfig));
    sessionStorage.setItem('store_termsConfig', JSON.stringify(termsConfig));
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setIsSaving(false);
    }, 1500);
  };

  const updateReturn = (key: keyof typeof returnConfig, value: any) => {
    setReturnConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateTerms = (key: keyof typeof termsConfig, value: any) => {
    setTermsConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Políticas y Términos</h1>
          <p className="text-gray-600">Configurá las políticas de tu tienda de forma simple</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl p-1 inline-flex gap-1 shadow-sm">
          <button
            onClick={() => setActiveTab('return')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'return' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'
            }`}
          >
            <FileText size={16} className="inline mr-2" />
            Devoluciones
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'terms' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'
            }`}
          >
            <FileText size={16} className="inline mr-2" />
            Términos
          </button>
        </div>

        {/* Return Policy Editor */}
        {activeTab === 'return' && (
          <div className="space-y-6">
            {/* Arrepentimiento Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm">1</span>
                Derecho de Arrepentimiento
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Días para arrepentimiento</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={returnConfig.arrepentimientoDias}
                      onChange={e => updateReturn('arrepentimientoDias', parseInt(e.target.value))}
                      className="w-20 px-3 py-2 border rounded-lg"
                    />
                    <span className="text-gray-600">días corridos</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Condiciones</label>
                  <textarea
                    value={returnConfig.arrepentimientoCondiciones}
                    onChange={e => updateReturn('arrepentimientoCondiciones', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Defectos Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm">2</span>
                Cambios por Defectos
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Días para reclamo</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={returnConfig.defectosDias}
                      onChange={e => updateReturn('defectosDias', parseInt(e.target.value))}
                      className="w-20 px-3 py-2 border rounded-lg"
                    />
                    <span className="text-gray-600">días</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Descripción</label>
                  <textarea
                    value={returnConfig.defectosDescripcion}
                    onChange={e => updateReturn('defectosDescripcion', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Cambio Talle Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm">3</span>
                Cambios por Talle o Color
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Días para cambio</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={returnConfig.talleDias}
                      onChange={e => updateReturn('talleDias', parseInt(e.target.value))}
                      className="w-20 px-3 py-2 border rounded-lg"
                    />
                    <span className="text-gray-600">días</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Condiciones</label>
                  <textarea
                    value={returnConfig.talleCondiciones}
                    onChange={e => updateReturn('talleCondiciones', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Costos de Envío */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-sm">4</span>
                Costos de Envío de Devolución
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Arrepentimiento</label>
                  <select
                    value={returnConfig.costoArrepentimiento}
                    onChange={e => updateReturn('costoArrepentimiento', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="vendedor">Lo paga el vendedor</option>
                    <option value="comprador">Lo paga el comprador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Defectos</label>
                  <select
                    value={returnConfig.costoDefectos}
                    onChange={e => updateReturn('costoDefectos', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="vendedor">Lo paga el vendedor</option>
                    <option value="comprador">Lo paga el comprador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cambio de talle</label>
                  <select
                    value={returnConfig.costoTalle}
                    onChange={e => updateReturn('costoTalle', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="vendedor">Lo paga el vendedor</option>
                    <option value="comprador">Lo paga el comprador</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reintegros */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-sm">5</span>
                Reintegros
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Plazo máximo</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={returnConfig.reintegroPlazo}
                      onChange={e => updateReturn('reintegroPlazo', parseInt(e.target.value))}
                      className="w-20 px-3 py-2 border rounded-lg"
                    />
                    <span className="text-gray-600">días hábiles</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Medio de reintegro</label>
                  <input
                    type="text"
                    value={returnConfig.reintegroMedio}
                    onChange={e => updateReturn('reintegroMedio', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Terms Editor */}
        {activeTab === 'terms' && (
          <div className="space-y-6">
            {/* Datos de la tienda */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4">Datos de la Tienda</h3>
              <p className="text-gray-600 text-sm mb-4">Estos datos se mostrarán en los términos y condiciones</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre de la tienda</label>
                  <input
                    type="text"
                    value={termsConfig.nombreTienda}
                    onChange={e => updateTerms('nombreTienda', e.target.value)}
                    placeholder="Mi Tienda"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={termsConfig.ciudad}
                    onChange={e => updateTerms('ciudad', e.target.value)}
                    placeholder="Buenos Aires"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={termsConfig.email}
                    onChange={e => updateTerms('email', e.target.value)}
                    placeholder="contacto@mitienda.com"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono/WhatsApp</label>
                  <input
                    type="text"
                    value={termsConfig.telefono}
                    onChange={e => updateTerms('telefono', e.target.value)}
                    placeholder="+54 11 1234-5678"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Pagos y Envíos */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4">Pagos y Envíos</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cuotas sin interés</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={termsConfig.cuotasSinInteres}
                      onChange={e => updateTerms('cuotasSinInteres', parseInt(e.target.value))}
                      className="w-20 px-3 py-2 border rounded-lg"
                    />
                    <span className="text-gray-600">cuotas</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Descuento transferencia</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={termsConfig.descuentoTransferencia}
                      onChange={e => updateTerms('descuentoTransferencia', parseInt(e.target.value))}
                      className="w-20 px-3 py-2 border rounded-lg"
                    />
                    <span className="text-gray-600">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Envío gratis desde</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">$</span>
                    <input
                      type="number"
                      value={termsConfig.envioGratisDesde}
                      onChange={e => updateTerms('envioGratisDesde', parseInt(e.target.value))}
                      className="w-32 px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Garantía */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4">Garantía</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Meses de garantía</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={termsConfig.garantiaMeses}
                      onChange={e => updateTerms('garantiaMeses', parseInt(e.target.value))}
                      className="w-20 px-3 py-2 border rounded-lg"
                    />
                    <span className="text-gray-600">meses</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Plazo de entrega</label>
                  <input
                    type="text"
                    value={termsConfig.plazoEntregaTexto}
                    onChange={e => updateTerms('plazoEntregaTexto', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Info legal */}
            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
              <strong>ℹ️ Información legal:</strong> Los términos incluyen automáticamente referencias a la Ley 24.240 
              de Defensa del Consumidor y Ley 25.326 de Protección de Datos, como corresponde.
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
          >
            {saved ? (
              <>
                <CheckCircle size={18} />
                ¡Guardado!
              </>
            ) : isSaving ? (
              'Guardando...'
            ) : (
              <>
                <Save size={18} />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPoliciesEditor;
