import React, { useState } from 'react';
import { Ruler, X, Check, AlertCircle } from 'lucide-react';
import { Product } from '../types';

// Standard size chart (can be customized per product later)
const STANDARD_SIZES = {
  ropa_superior: [
    { name: 'XS', pecho: [80, 84], cintura: [60, 64] },
    { name: 'S', pecho: [85, 89], cintura: [65, 69] },
    { name: 'M', pecho: [90, 94], cintura: [70, 74] },
    { name: 'L', pecho: [95, 99], cintura: [75, 79] },
    { name: 'XL', pecho: [100, 104], cintura: [80, 84] },
    { name: 'XXL', pecho: [105, 110], cintura: [85, 90] },
  ],
  ropa_inferior: [
    { name: 'XS', cintura: [60, 64], cadera: [84, 88] },
    { name: 'S', cintura: [65, 69], cadera: [89, 93] },
    { name: 'M', cintura: [70, 74], cadera: [94, 98] },
    { name: 'L', cintura: [75, 79], cadera: [99, 103] },
    { name: 'XL', cintura: [80, 84], cadera: [104, 108] },
    { name: 'XXL', cintura: [85, 90], cadera: [109, 114] },
  ],
};

interface SizeCalculatorProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSelectSize?: (size: string) => void;
}

interface Measurements {
  pecho: number;
  cintura: number;
  cadera: number;
}

type SizeResult = {
  size: string;
  fit: 'perfecto' | 'ajustado' | 'holgado';
  confidence: number;
} | null;

export const SizeCalculator: React.FC<SizeCalculatorProps> = ({ 
  product, 
  isOpen, 
  onClose,
  onSelectSize 
}) => {
  const [measurements, setMeasurements] = useState<Measurements>({
    pecho: 0,
    cintura: 0,
    cadera: 0,
  });
  const [result, setResult] = useState<SizeResult>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Determine what type of garment this is
  const isUpperBody = product.category?.toLowerCase().includes('remera') || 
                       product.category?.toLowerCase().includes('buzo') ||
                       product.category?.toLowerCase().includes('camisa') ||
                       product.subcategory?.toLowerCase().includes('remera') ||
                       product.subcategory?.toLowerCase().includes('buzo') ||
                       true; // Default to upper body

  const sizeChart = isUpperBody ? STANDARD_SIZES.ropa_superior : STANDARD_SIZES.ropa_inferior;

  const calculateSize = () => {
    if (measurements.pecho === 0 && measurements.cintura === 0 && measurements.cadera === 0) {
      return;
    }

    let bestMatch: SizeResult = null;
    let bestScore = -Infinity;

    for (const size of sizeChart) {
      let score = 0;
      let count = 0;

      // Check pecho
      if (measurements.pecho > 0 && (size as any).pecho) {
        const [min, max] = (size as any).pecho;
        if (measurements.pecho >= min && measurements.pecho <= max) {
          score += 100;
        } else if (measurements.pecho < min) {
          score += Math.max(0, 100 - (min - measurements.pecho) * 10);
        } else {
          score += Math.max(0, 100 - (measurements.pecho - max) * 10);
        }
        count++;
      }

      // Check cintura
      if (measurements.cintura > 0 && size.cintura) {
        const [min, max] = size.cintura;
        if (measurements.cintura >= min && measurements.cintura <= max) {
          score += 100;
        } else if (measurements.cintura < min) {
          score += Math.max(0, 100 - (min - measurements.cintura) * 10);
        } else {
          score += Math.max(0, 100 - (measurements.cintura - max) * 10);
        }
        count++;
      }

      // Check cadera
      if (measurements.cadera > 0 && (size as any).cadera) {
        const [min, max] = (size as any).cadera;
        if (measurements.cadera >= min && measurements.cadera <= max) {
          score += 100;
        } else if (measurements.cadera < min) {
          score += Math.max(0, 100 - (min - measurements.cadera) * 10);
        } else {
          score += Math.max(0, 100 - (measurements.cadera - max) * 10);
        }
        count++;
      }

      const avgScore = count > 0 ? score / count : 0;

      if (avgScore > bestScore) {
        bestScore = avgScore;
        
        let fit: 'perfecto' | 'ajustado' | 'holgado' = 'perfecto';
        if (avgScore < 80) {
          // Check if too small or too big
          const pechoMid = (size as any).pecho ? ((size as any).pecho[0] + (size as any).pecho[1]) / 2 : 0;
          if (measurements.pecho > pechoMid) {
            fit = 'ajustado';
          } else {
            fit = 'holgado';
          }
        }

        bestMatch = {
          size: size.name,
          fit,
          confidence: Math.round(avgScore),
        };
      }
    }

    setResult(bestMatch);
  };

  const handleSelectSize = () => {
    if (result && onSelectSize) {
      onSelectSize(result.size);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
          <div className="flex items-center gap-2">
            <Ruler size={20} />
            <h3 className="font-bold">Calculador de Talle</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Product info */}
          <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-16 h-20 object-cover rounded-lg"
            />
            <div>
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-gray-500">
                Talles disponibles: {product.sizes?.join(', ') || 'S, M, L, XL'}
              </p>
            </div>
          </div>

          {/* How to measure guide toggle */}
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full text-left text-sm text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-1"
          >
            <AlertCircle size={16} />
            ¿Cómo me tomo las medidas?
          </button>

          {showGuide && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
              <p className="font-medium mb-2">📏 Guía de medidas:</p>
              <ul className="space-y-1 text-gray-700">
                <li><strong>Pecho:</strong> Medir la parte más ancha del pecho</li>
                <li><strong>Cintura:</strong> Medir a la altura del ombligo</li>
                <li><strong>Cadera:</strong> Medir la parte más ancha de la cadera</li>
              </ul>
            </div>
          )}

          {/* Measurement inputs */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Contorno de pecho (cm)
              </label>
              <input
                type="number"
                value={measurements.pecho || ''}
                onChange={(e) => setMeasurements({ ...measurements, pecho: Number(e.target.value) })}
                placeholder="Ej: 92"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Contorno de cintura (cm)
              </label>
              <input
                type="number"
                value={measurements.cintura || ''}
                onChange={(e) => setMeasurements({ ...measurements, cintura: Number(e.target.value) })}
                placeholder="Ej: 72"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Contorno de cadera (cm)
              </label>
              <input
                type="number"
                value={measurements.cadera || ''}
                onChange={(e) => setMeasurements({ ...measurements, cadera: Number(e.target.value) })}
                placeholder="Ej: 96"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Calculate button */}
          <button
            onClick={calculateSize}
            disabled={measurements.pecho === 0 && measurements.cintura === 0}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Ruler size={20} />
            Calcular mi talle
          </button>

          {/* Result */}
          {result && (
            <div className={`mt-6 p-4 rounded-xl border-2 ${
              result.fit === 'perfecto' 
                ? 'border-green-500 bg-green-50' 
                : 'border-yellow-500 bg-yellow-50'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${
                  result.fit === 'perfecto' ? 'bg-green-500' : 'bg-yellow-500'
                } text-white`}>
                  <Check size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold">
                    Tu talle recomendado: <span className="text-2xl">{result.size}</span>
                  </p>
                  <p className={`text-sm ${
                    result.fit === 'perfecto' ? 'text-green-700' : 'text-yellow-700'
                  }`}>
                    {result.fit === 'perfecto' && '✨ Calce perfecto para tus medidas'}
                    {result.fit === 'ajustado' && '⚡ Puede quedar algo ajustado'}
                    {result.fit === 'holgado' && '💨 Puede quedar algo holgado'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Confianza: {result.confidence}%
                  </p>
                </div>
              </div>

              {onSelectSize && product.sizes?.includes(result.size) && (
                <button
                  onClick={handleSelectSize}
                  className="w-full mt-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
                >
                  Seleccionar talle {result.size}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SizeCalculator;
