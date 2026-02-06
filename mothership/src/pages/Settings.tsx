import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Mail, Bug, Cloud, Save, TestTube, Check, X, Loader2, Eye, EyeOff } from 'lucide-react';
import { systemSettingsApi, type SystemSettingsResponse } from '../api/system-settings';

export default function Settings() {
  const [settings, setSettings] = useState<SystemSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [smtpForm, setSmtpForm] = useState({
    host: '', port: '587', secure: true, user: '', pass: '', fromEmail: '', fromName: ''
  });
  const [sentryForm, setSentryForm] = useState({ enabled: false, dsn: '' });
  const [cloudinaryForm, setCloudinaryForm] = useState({ cloudName: '', apiKey: '', apiSecret: '' });
  
  // Password visibility
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await systemSettingsApi.getSettings();
      setSettings(data);
      
      // Populate forms
      setSmtpForm({
        host: data.smtp.host,
        port: data.smtp.port,
        secure: data.smtp.secure,
        user: data.smtp.user,
        pass: '', // Don't populate password
        fromEmail: data.smtp.fromEmail,
        fromName: data.smtp.fromName,
      });
      setSentryForm({
        enabled: data.sentry.enabled,
        dsn: '', // Don't populate DSN
      });
      setCloudinaryForm({
        cloudName: data.cloudinary.cloudName,
        apiKey: '', // Don't populate secrets
        apiSecret: '',
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Error al cargar configuración' });
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSaveSmtp = async () => {
    setSaving('smtp');
    try {
      await systemSettingsApi.updateSmtp(smtpForm);
      await loadSettings();
      showMessage('success', 'Configuración SMTP guardada');
    } catch (error: any) {
      showMessage('error', error.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(null);
    }
  };

  const handleTestSmtp = async () => {
    setTesting('smtp');
    try {
      const result = await systemSettingsApi.testSmtp();
      showMessage(result.success ? 'success' : 'error', result.message || result.error || 'Test completado');
    } catch (error: any) {
      showMessage('error', error.response?.data?.error || 'Error en test SMTP');
    } finally {
      setTesting(null);
    }
  };

  const handleSaveSentry = async () => {
    setSaving('sentry');
    try {
      await systemSettingsApi.updateSentry(sentryForm);
      await loadSettings();
      showMessage('success', 'Configuración Sentry guardada');
    } catch (error: any) {
      showMessage('error', error.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(null);
    }
  };

  const handleSaveCloudinary = async () => {
    setSaving('cloudinary');
    try {
      await systemSettingsApi.updateCloudinary(cloudinaryForm);
      await loadSettings();
      showMessage('success', 'Configuración Cloudinary guardada');
    } catch (error: any) {
      showMessage('error', error.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(null);
    }
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-2">Configuración</h1>
        <p className="text-slate-600 ">Ajustes del sistema Mothership</p>
      </div>

      {/* Message Toast */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200 '
            : 'bg-red-50 text-red-700 border border-red-200 '
        }`}>
          {message.type === 'success' ? <Check size={20} /> : <X size={20} />}
          {message.text}
        </div>
      )}
      
      <div className="grid gap-6">
        {/* SMTP Configuration */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 ">
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-xl border-2 ${
              settings?.smtp.configured 
                ? 'bg-green-50 border-green-200 '
                : 'bg-slate-50 border-slate-200 '
            }`}>
              <Mail className={settings?.smtp.configured ? 'text-green-600 ' : 'text-slate-400'} size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Email SMTP
                {settings?.smtp.configured && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Configurado</span>}
              </h2>
              <p className="text-sm text-slate-600 ">Configuración para envío de emails</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Host SMTP</label>
              <input
                type="text"
                value={smtpForm.host}
                onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                placeholder="smtp.gmail.com"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Puerto</label>
              <input
                type="text"
                value={smtpForm.port}
                onChange={(e) => setSmtpForm({ ...smtpForm, port: e.target.value })}
                placeholder="587"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
              <input
                type="email"
                value={smtpForm.user}
                onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                placeholder="tu-email@gmail.com"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPasswords.smtpPass ? 'text' : 'password'}
                  value={smtpForm.pass}
                  onChange={(e) => setSmtpForm({ ...smtpForm, pass: e.target.value })}
                  placeholder={settings?.smtp.configured ? '••••••••' : 'App Password'}
                  className="w-full px-4 py-2 pr-10 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('smtpPass')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords.smtpPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email remitente</label>
              <input
                type="email"
                value={smtpForm.fromEmail}
                onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                placeholder="noreply@tiendita.com"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre remitente</label>
              <input
                type="text"
                value={smtpForm.fromName}
                onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                placeholder="Tiendita"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="smtpSecure"
              checked={smtpForm.secure}
              onChange={(e) => setSmtpForm({ ...smtpForm, secure: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="smtpSecure" className="text-sm text-slate-700 ">
              Usar conexión segura (SSL/TLS)
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSaveSmtp}
              disabled={saving === 'smtp'}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50"
            >
              {saving === 'smtp' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Guardar
            </button>
            <button
              onClick={handleTestSmtp}
              disabled={testing === 'smtp' || !settings?.smtp.configured}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              {testing === 'smtp' ? <Loader2 size={16} className="animate-spin" /> : <TestTube size={16} />}
              Probar conexión
            </button>
          </div>
        </div>

        {/* Sentry Configuration */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 ">
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-xl border-2 ${
              settings?.sentry.configured && settings?.sentry.enabled
                ? 'bg-green-50 border-green-200 '
                : 'bg-slate-50 border-slate-200 '
            }`}>
              <Bug className={settings?.sentry.configured && settings?.sentry.enabled ? 'text-green-600 ' : 'text-slate-400'} size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Sentry
                {settings?.sentry.configured && settings?.sentry.enabled && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Activo</span>}
              </h2>
              <p className="text-sm text-slate-600 ">Monitoreo de errores en tiempo real</p>
            </div>
          </div>
          
          <div className="space-y-4 mb-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="sentryEnabled"
                checked={sentryForm.enabled}
                onChange={(e) => setSentryForm({ ...sentryForm, enabled: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="sentryEnabled" className="text-sm text-slate-700 ">
                Habilitar monitoreo de errores
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">DSN de Sentry</label>
              <div className="relative">
                <input
                  type={showPasswords.sentryDsn ? 'text' : 'password'}
                  value={sentryForm.dsn}
                  onChange={(e) => setSentryForm({ ...sentryForm, dsn: e.target.value })}
                  placeholder={settings?.sentry.configured ? '••••••••' : 'https://xxx@xxx.ingest.sentry.io/xxx'}
                  className="w-full px-4 py-2 pr-10 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('sentryDsn')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords.sentryDsn ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">Obtené tu DSN en <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">sentry.io</a></p>
            </div>
          </div>

          <button
            onClick={handleSaveSentry}
            disabled={saving === 'sentry'}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50"
          >
            {saving === 'sentry' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Guardar
          </button>
        </div>

        {/* Cloudinary Configuration */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 ">
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-xl border-2 ${
              settings?.cloudinary.configured 
                ? 'bg-green-50 border-green-200 '
                : 'bg-slate-50 border-slate-200 '
            }`}>
              <Cloud className={settings?.cloudinary.configured ? 'text-green-600 ' : 'text-slate-400'} size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Cloudinary
                {settings?.cloudinary.configured && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Configurado</span>}
              </h2>
              <p className="text-sm text-slate-600 ">Almacenamiento de imágenes en la nube</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cloud Name</label>
              <input
                type="text"
                value={cloudinaryForm.cloudName}
                onChange={(e) => setCloudinaryForm({ ...cloudinaryForm, cloudName: e.target.value })}
                placeholder="tu-cloud-name"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
              <div className="relative">
                <input
                  type={showPasswords.cloudinaryKey ? 'text' : 'password'}
                  value={cloudinaryForm.apiKey}
                  onChange={(e) => setCloudinaryForm({ ...cloudinaryForm, apiKey: e.target.value })}
                  placeholder={settings?.cloudinary.configured ? '••••••••' : 'API Key'}
                  className="w-full px-4 py-2 pr-10 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('cloudinaryKey')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords.cloudinaryKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">API Secret</label>
              <div className="relative">
                <input
                  type={showPasswords.cloudinarySecret ? 'text' : 'password'}
                  value={cloudinaryForm.apiSecret}
                  onChange={(e) => setCloudinaryForm({ ...cloudinaryForm, apiSecret: e.target.value })}
                  placeholder={settings?.cloudinary.configured ? '••••••••' : 'API Secret'}
                  className="w-full px-4 py-2 pr-10 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('cloudinarySecret')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords.cloudinarySecret ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveCloudinary}
            disabled={saving === 'cloudinary'}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50"
          >
            {saving === 'cloudinary' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Guardar
          </button>
        </div>

        {/* System Info */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-lg p-6 border border-slate-200 ">
          <div className="flex items-center gap-3 mb-4">
            <SettingsIcon className="text-slate-600 " size={24} />
            <h2 className="text-xl font-bold text-slate-900 ">Sistema</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-500 ">Versión:</span>
              <span className="ml-2 font-medium text-slate-900 ">1.0.0</span>
            </div>
            <div>
              <span className="text-slate-500 ">Última actualización:</span>
              <span className="ml-2 font-medium text-slate-900 ">
                {settings?.updatedAt ? new Date(settings.updatedAt).toLocaleString() : 'Nunca'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 ">Actualizado por:</span>
              <span className="ml-2 font-medium text-slate-900 ">{settings?.updatedBy || '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
