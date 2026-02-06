
import React, { useState, useRef } from 'react';
import { Sparkles, Loader2, X, Upload, Camera, RefreshCw } from 'lucide-react';
import { getStoreHeaders } from '../utils/storeDetection';

interface StorefrontAIGeneratorProps {
  garmentImageUrl: string;
  onClose: () => void;
}

export const StorefrontAIGenerator: React.FC<StorefrontAIGeneratorProps> = ({
  garmentImageUrl,
  onClose,
}) => {
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen es muy pesada (máx 5MB)');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserImage(reader.result as string);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const generateTryOn = async () => {
    if (!userImage) {
      setError('Por favor subí una foto tuya');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const storeHeaders = getStoreHeaders();
      
      const response = await fetch('/api/ai/try-on', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...storeHeaders
        },
        body: JSON.stringify({
          modelImage: userImage,
          garmentImage: garmentImageUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar imagen');
      }

      if (data.success && data.imageUrl) {
        setResultImage(data.imageUrl);
      } else {
        throw new Error('Respuesta inválida del servidor');
      }

    } catch (err: any) {
      console.error('AI generation error:', err);
      setError(err.message || 'Error al generar. Intentá de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setResultImage(null);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-pink-500 text-white shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={20} />
            <h3 className="font-bold">Probador Virtual IA</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Result display */}
          {resultImage ? (
            <div className="animate-in fade-in duration-300">
              <h4 className="font-semibold mb-3 text-green-600 flex items-center gap-2 justify-center">
                <Sparkles size={18} />
                ¡Te queda genial!
              </h4>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-6 shadow-inner">
                <img 
                  src={resultImage} 
                  alt="Resultado"
                  className="w-full max-h-[400px] object-contain mx-auto"
                />
              </div>
              <div className="flex gap-3">
                <a 
                  href={resultImage} 
                  download="mi-look.png"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 text-center transition-colors"
                >
                  Descargar Foto
                </a>
                <button
                  onClick={reset}
                  className="px-4 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center gap-2 transition-colors"
                >
                  <RefreshCw size={18} />
                  Probar otra
                </button>
              </div>
            </div>
          ) : (
            /* Upload & Generate Interface */
            <div className="flex flex-col gap-6">
              {/* Garment Preview */}
              <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                <img 
                  src={garmentImageUrl} 
                  alt="Prenda"
                  className="w-16 h-20 object-cover rounded-md bg-white shadow-sm"
                />
                <div>
                  <p className="font-medium text-purple-900">Estás probando:</p>
                  <p className="text-sm text-purple-700">Esta prenda se adaptará a tu foto</p>
                </div>
              </div>

              {/* User Image Upload */}
              <div className="space-y-4">
                <label className="block font-medium text-gray-700">1. Subí tu foto</label>
                
                {!userImage ? (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3 text-gray-500 hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-all group"
                  >
                    <div className="p-3 bg-gray-100 rounded-full group-hover:bg-white transition-colors">
                      <Camera size={32} />
                    </div>
                    <div className="text-center">
                      <p className="font-medium">Hacé clic para subir foto</p>
                      <p className="text-xs mt-1">Cuerpo completo funciona mejor</p>
                    </div>
                  </button>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
                    <img 
                      src={userImage} 
                      alt="Tu foto" 
                      className="w-full h-64 object-cover"
                    />
                    <button 
                      onClick={() => setUserImage(null)}
                      className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white text-xs text-center">
                      Tu foto seleccionada
                    </div>
                  </div>
                )}
                
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={generateTryOn}
                disabled={!userImage || isGenerating}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all ${
                  userImage && !isGenerating
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:scale-[1.02] hover:shadow-xl'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    Creando tu look...
                  </>
                ) : (
                  <>
                    <Sparkles size={24} />
                    ¡Probarme la ropa!
                  </>
                )}
              </button>

              {/* Tips */}
              <div className="text-xs text-gray-500 text-center px-4">
                <p>💡 Tip: Usá una foto donde se vea bien tu cuerpo y estés de frente.</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center animate-in slide-in-from-bottom-2">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
