import React, { useState } from 'react';
import { Sparkles, Loader2, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getStoreHeaders } from '../../utils/storeDetection';
import { API_BASE } from '../../context/storeApi';

// Updated model images (full body with diverse body types)
const MODEL_OPTIONS = [
  // Mujeres
  {
    id: 'female-1',
    name: 'Mujer - Casual',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
  },
  {
    id: 'female-2',
    name: 'Mujer - Elegante',
    image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800&q=80',
  },
  {
    id: 'female-3',
    name: 'Mujer - Urbana',
    image: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=800&q=80',
  },
  {
    id: 'female-4',
    name: 'Mujer - Sport',
    image: 'https://images.unsplash.com/photo-1518331483807-f64201c8e149?w=800&q=80',
  },
  // Hombres
  {
    id: 'male-1',
    name: 'Hombre - Casual',
    image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&q=80',
  },
  {
    id: 'male-2',
    name: 'Hombre - Formal',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  },
  {
    id: 'male-3',
    name: 'Hombre - Urbano',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
  },
  {
    id: 'male-4',
    name: 'Hombre - Sport',
    image: 'https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?w=800&q=80',
  },
];

interface AIModelGeneratorProps {
  garmentImageUrl: string;
  onImageGenerated: (imageUrl: string) => void;
  onClose: () => void;
}

export const AIModelGenerator: React.FC<AIModelGeneratorProps> = ({
  garmentImageUrl,
  onImageGenerated,
  onClose,
}) => {
  const { token } = useAuth();
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [resultImage, setResultImage] = useState<string | null>(null);

  const generateModelImage = async () => {
    if (!selectedModel) {
      setError('Seleccioná un modelo');
      return;
    }

    const modelData = MODEL_OPTIONS.find(m => m.id === selectedModel);
    if (!modelData) return;

    setIsGenerating(true);
    setError('');

    try {
      const storeHeaders = getStoreHeaders();
      
      const response = await fetch(`${API_BASE}/ai/try-on`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...storeHeaders
        },
        body: JSON.stringify({
          modelImage: modelData.image,
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

  const handleUseImage = () => {
    if (resultImage) {
      onImageGenerated(resultImage);
      onClose();
    }
  };

  const reset = () => {
    setResultImage(null);
    setSelectedModel(null);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-pink-500 text-white shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={20} />
            <h3 className="font-bold">Generar Imagen con Modelo IA</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Current garment preview */}
          <div className="mb-6 flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <img 
              src={garmentImageUrl} 
              alt="Prenda"
              className="w-20 h-24 object-cover rounded-lg border"
            />
            <div>
              <p className="font-medium">Tu prenda</p>
              <p className="text-sm text-gray-500">Se aplicará al modelo seleccionado</p>
            </div>
          </div>

          {/* Result display */}
          {resultImage && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3 text-green-600 flex items-center gap-2">
                <Sparkles size={18} />
                ¡Imagen generada!
              </h4>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4">
                <img 
                  src={resultImage} 
                  alt="Resultado"
                  className="w-full max-h-[400px] object-contain mx-auto"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleUseImage}
                  className="flex-1 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600"
                >
                  Usar esta imagen
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                >
                  <RefreshCw size={18} />
                  Generar otra
                </button>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isGenerating && (
            <div className="mb-6 p-8 bg-purple-50 rounded-lg text-center">
              <Loader2 size={40} className="animate-spin mx-auto mb-4 text-purple-600" />
              <p className="font-medium text-purple-800">Generando imagen con IA...</p>
              <p className="text-sm text-gray-600 mt-1">Esto puede tardar 30-60 segundos</p>
              <p className="text-xs text-gray-500 mt-2">Procesando en servidor seguro...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Model selection (only when not showing result) */}
          {!resultImage && !isGenerating && (
            <>
              <h4 className="font-semibold mb-3">Seleccioná un modelo:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {MODEL_OPTIONS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`relative aspect-[3/4] rounded-lg overflow-hidden border-3 transition-all ${
                      selectedModel === model.id
                        ? 'border-purple-500 ring-4 ring-purple-200'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={model.image}
                      alt={model.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
                      <p className="text-white text-xs font-medium truncate">{model.name}</p>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={generateModelImage}
                disabled={!selectedModel}
                className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                  selectedModel
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Sparkles size={20} />
                Generar con IA
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIModelGenerator;
