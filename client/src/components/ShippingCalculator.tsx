import React, { useState } from 'react';
import { Truck, MapPin, Clock, Check, X } from 'lucide-react';

// Shipping rates by province
const SHIPPING_RATES: Record<string, { cost: number; days: string }> = {
  'CABA': { cost: 2500, days: '1-2 días' },
  'Buenos Aires': { cost: 3500, days: '2-3 días' },
  'Córdoba': { cost: 4500, days: '3-5 días' },
  'Santa Fe': { cost: 4500, days: '3-5 días' },
  'Mendoza': { cost: 5500, days: '4-6 días' },
  'Tucumán': { cost: 5500, days: '4-6 días' },
  'Entre Ríos': { cost: 4500, days: '3-5 días' },
  'Salta': { cost: 6000, days: '5-7 días' },
  'Misiones': { cost: 6000, days: '5-7 días' },
  'Chaco': { cost: 6000, days: '5-7 días' },
  'Corrientes': { cost: 6000, days: '5-7 días' },
  'Santiago del Estero': { cost: 5500, days: '4-6 días' },
  'San Juan': { cost: 5500, days: '4-6 días' },
  'Jujuy': { cost: 6500, days: '5-7 días' },
  'Río Negro': { cost: 7000, days: '6-8 días' },
  'Neuquén': { cost: 7000, days: '6-8 días' },
  'Formosa': { cost: 6500, days: '5-7 días' },
  'Chubut': { cost: 7500, days: '7-10 días' },
  'San Luis': { cost: 5000, days: '4-6 días' },
  'Catamarca': { cost: 5500, days: '4-6 días' },
  'La Rioja': { cost: 5500, days: '4-6 días' },
  'La Pampa': { cost: 5000, days: '4-6 días' },
  'Santa Cruz': { cost: 8500, days: '8-12 días' },
  'Tierra del Fuego': { cost: 9500, days: '10-14 días' },
};

const FREE_SHIPPING_THRESHOLD = 50000; // Free shipping over $50,000

interface ShippingCalculatorProps {
  cartTotal?: number;
  onShippingCalculated?: (cost: number, province: string) => void;
}

export const ShippingCalculator: React.FC<ShippingCalculatorProps> = ({ 
  cartTotal = 0, 
  onShippingCalculated 
}) => {
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [postalCode, setPostalCode] = useState('');
  const [result, setResult] = useState<{ cost: number; days: string; free: boolean } | null>(null);

  const calculateShipping = () => {
    if (!selectedProvince) return;
    
    const rate = SHIPPING_RATES[selectedProvince];
    if (!rate) return;

    const isFree = cartTotal >= FREE_SHIPPING_THRESHOLD;
    const finalCost = isFree ? 0 : rate.cost;
    
    setResult({
      cost: finalCost,
      days: rate.days,
      free: isFree,
    });

    onShippingCalculated?.(finalCost, selectedProvince);
  };

  const amountForFreeShipping = FREE_SHIPPING_THRESHOLD - cartTotal;

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
      <div className="flex items-center gap-2 mb-4">
        <Truck size={20} className="text-blue-600" />
        <h3 className="font-semibold text-gray-800">Calculá tu envío</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Provincia</label>
          <select
            value={selectedProvince}
            onChange={(e) => {
              setSelectedProvince(e.target.value);
              setResult(null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar provincia</option>
            {Object.keys(SHIPPING_RATES).sort().map(province => (
              <option key={province} value={province}>{province}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Código postal (opcional)</label>
          <input
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="Ej: 1414"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={calculateShipping}
          disabled={!selectedProvince}
          className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          Calcular
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`mt-4 p-3 rounded-lg ${result.free ? 'bg-green-100 border border-green-300' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${result.free ? 'bg-green-500' : 'bg-blue-500'} text-white`}>
              {result.free ? <Check size={16} /> : <Truck size={16} />}
            </div>
            <div>
              <p className="font-semibold text-gray-800">
                {result.free ? (
                  <span className="text-green-700">¡Envío GRATIS!</span>
                ) : (
                  <span>${result.cost.toLocaleString()}</span>
                )}
              </p>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Clock size={12} />
                Llega en {result.days}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Free shipping progress */}
      {!result?.free && amountForFreeShipping > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            🚚 Agregá <strong>${amountForFreeShipping.toLocaleString()}</strong> más para envío gratis
          </p>
          <div className="mt-2 h-2 bg-yellow-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-yellow-500 transition-all"
              style={{ width: `${Math.min(100, (cartTotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Compact version for product page
export const ShippingInfo: React.FC<{ province?: string }> = ({ province = 'CABA' }) => {
  const rate = SHIPPING_RATES[province];
  
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Truck size={16} className="text-green-600" />
      <span>
        Envío a {province}: <strong>${rate?.cost.toLocaleString() || '...'}</strong> ({rate?.days || '...'})
      </span>
    </div>
  );
};

export default ShippingCalculator;
