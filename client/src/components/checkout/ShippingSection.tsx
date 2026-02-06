import React from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface ShippingQuote {
  carrier: string;
  carrierName: string;
  service: string;
  price: number;
  estimatedDays: { min: number; max: number };
  isFree: boolean;
}

interface ShippingForm {
  address: string;
  city: string;
  postalCode: string;
}

interface ShippingSectionProps {
  form: ShippingForm;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoadingShipping: boolean;
  shippingQuotes: ShippingQuote[];
  selectedShipping: ShippingQuote | null;
  onSelectShipping: (quote: ShippingQuote) => void;
}

export const ShippingSection: React.FC<ShippingSectionProps> = ({
  form,
  onFormChange,
  isLoadingShipping,
  shippingQuotes,
  selectedShipping,
  onSelectShipping,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <MapPin size={20} /> Dirección de Envío
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
          <input 
            type="text" 
            name="address" 
            required 
            value={form.address}
            onChange={onFormChange}
            placeholder="Av. Alem 1234"
            className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:border-black" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
          <input 
            type="text" 
            name="city" 
            required 
            value={form.city}
            onChange={onFormChange}
            placeholder="Bahía Blanca"
            className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:border-black" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal *</label>
          <input 
            type="text" 
            name="postalCode" 
            required 
            maxLength={4}
            value={form.postalCode}
            onChange={onFormChange}
            placeholder="8000"
            className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:border-black" 
          />
        </div>
      </div>

      {/* Shipping Options */}
      {isLoadingShipping && (
        <div className="mt-4 flex items-center gap-2 text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          Calculando opciones de envío...
        </div>
      )}
      
      {shippingQuotes.length > 0 && (
        <div className="mt-4 space-y-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Método de Envío *
          </label>
          {shippingQuotes.map((quote) => (
            <label 
              key={quote.carrier} 
              className={`flex items-center justify-between p-4 border rounded cursor-pointer transition-colors ${
                selectedShipping?.carrier === quote.carrier 
                  ? 'border-accent bg-accent/10' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="shipping"
                  checked={selectedShipping?.carrier === quote.carrier}
                  onChange={() => onSelectShipping(quote)}
                  className="accent-theme"
                />
                <div>
                  <p className="font-medium">{quote.carrierName}</p>
                  <p className="text-sm text-gray-500">{quote.service}</p>
                  <p className="text-xs text-gray-400">
                    {quote.estimatedDays.min}-{quote.estimatedDays.max} días hábiles
                  </p>
                </div>
              </div>
              <span className={`font-bold ${quote.isFree ? 'text-green-600' : ''}`}>
                {quote.isFree ? 'GRATIS' : formatPrice(quote.price)}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};
