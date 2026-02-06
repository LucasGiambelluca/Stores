import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Loader2, User, Sparkles, RefreshCw } from 'lucide-react';
import { Product, AIModel } from '../types';
import { useStore } from '../context/StoreContext';

// Default AI models (used when no custom models are uploaded)
const DEFAULT_AI_MODELS: AIModel[] = [
  // Mujeres - diversidad de cuerpos
  {
    id: 'female-1',
    name: 'Mujer - Delgada',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=900&fit=crop',
    type: 'female',
    order: 0,
    isActive: true
  },
  {
    id: 'female-2', 
    name: 'Mujer - Curvy',
    image: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=600&h=900&fit=crop',
    type: 'female',
    order: 1,
    isActive: true
  },
  {
    id: 'female-3',
    name: 'Mujer - Plus Size',
    image: 'https://images.unsplash.com/photo-1611432579699-484f7990b127?w=600&h=900&fit=crop',
    type: 'female',
    order: 2,
    isActive: true
  },
  {
    id: 'female-4',
    name: 'Mujer - Atlética',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&h=900&fit=crop',
    type: 'female',
    order: 3,
    isActive: true
  },
  // Hombres - diversidad de cuerpos
  {
    id: 'male-1',
    name: 'Hombre - Delgado', 
    image: 'https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?w=600&h=900&fit=crop',
    type: 'male',
    order: 4,
    isActive: true
  },
  {
    id: 'male-2',
    name: 'Hombre - Robusto',
    image: 'https://images.unsplash.com/photo-1507680434567-5739c80be1ac?w=600&h=900&fit=crop',
    type: 'male',
    order: 5,
    isActive: true
  },
  {
    id: 'male-3',
    name: 'Hombre - Atlético',
    image: 'https://images.unsplash.com/photo-1519058082700-08a0b56da9b4?w=600&h=900&fit=crop',
    type: 'male',
    order: 6,
    isActive: true
  },
  {
    id: 'male-4',
    name: 'Hombre - Casual',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=900&fit=crop',
    type: 'male',
    order: 7,
    isActive: true
  },
];

interface VirtualTryOnProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

type TryOnStatus = 'idle' | 'loading' | 'success' | 'error';

export const VirtualTryOn: React.FC<VirtualTryOnProps> = ({ product, isOpen, onClose }) => {
  const { state } = useStore();
  
  // Use custom models from admin if available, otherwise use defaults
  const customModels = (state.aiModels || []).filter(m => m.isActive);
  const AI_MODELS = customModels.length > 0 ? customModels : DEFAULT_AI_MODELS;
  
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [status, setStatus] = useState<TryOnStatus>('idle');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [useCamera, setUseCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Get the model image URL (either selected preset or custom photo)
  const getModelImage = (): string | null => {
    if (customPhoto) return customPhoto;
    if (selectedModel) {
      const model = AI_MODELS.find(m => m.id === selectedModel);
      return model?.image || null;
    }
    return null;
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomPhoto(event.target?.result as string);
        setSelectedModel(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Start camera (with option for front or back on mobile)
  const startCamera = async (facingMode: 'user' | 'environment' = 'user') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode,
          width: { ideal: 720 },
          height: { ideal: 1080 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setUseCamera(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setErrorMessage('No se pudo acceder a la cámara');
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setCustomPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setUseCamera(false);
  };

  // Call IDM-VTON API via HuggingFace Spaces
  const generateTryOn = async () => {
    const modelImage = getModelImage();
    if (!modelImage) {
      setErrorMessage('Seleccioná un modelo o subí tu foto');
      return;
    }

    setStatus('loading');
    setErrorMessage('');
    setResultImage(null);

    try {
      // Dynamic import to avoid SSR issues
      const { Client, handle_file } = await import('@gradio/client');
      
      // Get HuggingFace token from environment (for more GPU quota)
      // @ts-ignore - Vite env vars
      const hfToken = (import.meta as any).env?.VITE_HUGGINGFACE_TOKEN;
      
      // Connect to IDM-VTON space (best quality virtual try-on)
      const client = await Client.connect("yisol/IDM-VTON", 
        hfToken ? { hf_token: hfToken } as any : undefined
      );

      // Fetch model image as blob
      let modelBlob: Blob;
      if (modelImage.startsWith('data:')) {
        const response = await fetch(modelImage);
        modelBlob = await response.blob();
      } else {
        const response = await fetch(modelImage);
        modelBlob = await response.blob();
      }

      // Fetch garment image as blob
      let garmentBlob: Blob;
      if (product.image.startsWith('data:')) {
        const response = await fetch(product.image);
        garmentBlob = await response.blob();
      } else {
        const response = await fetch(product.image);
        garmentBlob = await response.blob();
      }

      // Call IDM-VTON API
      const result = await client.predict("/tryon", {
        dict: {
          background: handle_file(modelBlob),
          layers: [],
          composite: null
        },
        garm_img: handle_file(garmentBlob),
        garment_des: product.name || "clothing item",
        is_checked: true,
        is_checked_crop: false,
        denoise_steps: 30,
        seed: 42
      });

      // Extract result image URL
      if (result.data && Array.isArray(result.data) && result.data[0]) {
        const resultData = result.data[0];
        if (typeof resultData === 'string') {
          setResultImage(resultData);
        } else if (resultData.url) {
          setResultImage(resultData.url);
        } else if (typeof resultData === 'object' && resultData.path) {
          setResultImage(resultData.path);
        }
        setStatus('success');
      } else {
        throw new Error('No se recibió imagen de resultado');
      }
    } catch (error: any) {
      console.error('Try-on error:', error);
      setStatus('error');
      
      // Better error messages
      const errMsg = error.message || '';
      if (errMsg.includes('quota') || errMsg.includes('ZeroGPU')) {
        setErrorMessage('Límite de GPU agotado. Esperá unos minutos o iniciá sesión en huggingface.co/login para más cuota.');
      } else if (errMsg.includes('config')) {
        setErrorMessage('Servicio temporalmente no disponible. Intentá de nuevo en unos minutos.');
      } else {
        setErrorMessage(errMsg || 'Error al generar. Intentá de nuevo.');
      }
    }
  };

  // Reset state
  const reset = () => {
    setSelectedModel(null);
    setCustomPhoto(null);
    setResultImage(null);
    setStatus('idle');
    setErrorMessage('');
    stopCamera();
  };

  // Cleanup on close
  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-pink-500 text-white">
          <div className="flex items-center gap-2">
            <Sparkles size={24} />
            <h2 className="text-xl font-bold">Probador Virtual con IA</h2>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-white/20 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Product info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl flex gap-4 items-center">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-20 h-24 object-cover rounded-lg"
            />
            <div>
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-gray-500 text-sm">Prenda seleccionada</p>
            </div>
          </div>

          {/* Result display */}
          {resultImage && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-green-600 flex items-center gap-2">
                <Sparkles size={20} />
                ¡Resultado generado!
              </h3>
              <div className="relative rounded-xl overflow-hidden bg-gray-100">
                <img 
                  src={resultImage} 
                  alt="Resultado Virtual Try-On"
                  className="w-full max-h-[500px] object-contain mx-auto"
                />
              </div>
              <button
                onClick={reset}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
              >
                <RefreshCw size={18} />
                Probar de nuevo
              </button>
            </div>
          )}

          {/* Loading state */}
          {status === 'loading' && (
            <div className="mb-6 p-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl text-center">
              <Loader2 size={48} className="animate-spin mx-auto mb-4 text-purple-600" />
              <p className="text-lg font-medium text-purple-800">Generando imagen con IA...</p>
              <p className="text-sm text-gray-600 mt-2">Esto puede tardar 30-60 segundos</p>
            </div>
          )}

          {/* Error message */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Model selection (only when not showing result) */}
          {!resultImage && status !== 'loading' && (
            <>
              {/* Camera view */}
              {useCamera && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Camera size={20} className="text-purple-600" />
                    Tu cámara - Posicionáte de cuerpo completo
                  </h3>
                  <div className="relative rounded-xl overflow-hidden bg-gray-900 border-4 border-purple-500 shadow-lg">
                    {/* Camera preview frame */}
                    <div className="aspect-[3/4] max-h-[450px] flex items-center justify-center">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        muted
                        playsInline 
                        onLoadedMetadata={(e) => (e.target as HTMLVideoElement).play()}
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                      />
                    </div>
                    {/* Capture button overlay */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                      <button
                        onClick={capturePhoto}
                        className="px-8 py-4 bg-white text-black rounded-full font-bold shadow-lg hover:bg-gray-100 text-lg flex items-center gap-2"
                      >
                        <Camera size={24} />
                        Tomar Foto
                      </button>
                      <button
                        onClick={stopCamera}
                        className="px-6 py-4 bg-red-500/90 text-white rounded-full font-semibold shadow-lg hover:bg-red-600"
                      >
                        <X size={24} />
                      </button>
                    </div>
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    💡 Tip: Aseguráte de que se vea todo tu cuerpo en el recuadro
                  </p>
                </div>
              )}

              {/* Custom photo preview */}
              {customPhoto && !useCamera && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Tu foto:</h3>
                  <div className="relative inline-block">
                    <img 
                      src={customPhoto} 
                      alt="Tu foto"
                      className="w-40 h-52 object-cover rounded-xl border-4 border-purple-500"
                    />
                    <button
                      onClick={() => setCustomPhoto(null)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Upload options */}
              {!useCamera && !customPhoto && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Subí tu foto:</h3>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => startCamera('user')}
                      className="flex items-center gap-2 px-5 py-3 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition"
                    >
                      <Camera size={20} />
                      Cámara frontal
                    </button>
                    <button
                      onClick={() => startCamera('environment')}
                      className="flex items-center gap-2 px-5 py-3 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition"
                    >
                      <Camera size={20} />
                      Cámara trasera
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
                    >
                      <Upload size={20} />
                      Subir archivo
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}

              {/* Pre-made models */}
              {!customPhoto && !useCamera && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User size={20} />
                    O elegí un modelo:
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {AI_MODELS.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setSelectedModel(model.id);
                          setCustomPhoto(null);
                        }}
                        className={`relative aspect-[3/4] rounded-xl overflow-hidden border-4 transition-all ${
                          selectedModel === model.id 
                            ? 'border-purple-500 ring-4 ring-purple-200' 
                            : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <img 
                          src={model.image} 
                          alt={model.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <p className="text-white text-xs font-medium">{model.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate button */}
              <div className="flex justify-center">
                <button
                  onClick={generateTryOn}
                  disabled={!getModelImage() || status === 'loading'}
                  className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                    getModelImage() && status !== 'loading'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90 shadow-lg'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Sparkles size={24} />
                  Generar con IA
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VirtualTryOn;
