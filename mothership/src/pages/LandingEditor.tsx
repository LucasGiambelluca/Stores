import { useState, useEffect } from 'react';
import { landingApi, type LandingContent } from '../api/landing';
import { Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function LandingEditor() {
  const [content, setContent] = useState<string>('{}');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await landingApi.getConfig();
      setContent(JSON.stringify(data.content, null, 2));
    } catch (err) {
      setError('Error al cargar el contenido');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      let parsedContent: LandingContent;
      try {
        parsedContent = JSON.parse(content);
      } catch (e) {
        setError('JSON inválido');
        setSaving(false);
        return;
      }

      await landingApi.updateConfig(parsedContent);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Error al guardar');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 ">Landing Page CMS</h1>
          <p className="text-slate-500 ">Editar contenido de la landing page (JSON)</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Cambios
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Guardado exitosamente
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg border border-slate-200 h-[600px] flex flex-col">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 w-full p-4 font-mono text-sm bg-slate-50 text-slate-900 resize-none focus:outline-none"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
