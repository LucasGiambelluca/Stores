import React from 'react';
import { Lock, Banknote, CreditCard } from 'lucide-react';

type PaymentMethod = 'mercadopago' | 'transfer' | 'modo';

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  paymentMethod,
  setPaymentMethod,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Lock size={20} /> Método de Pago
      </h2>
      <div className="space-y-3">
        {/* MercadoPago */}
        <label 
          className={`flex items-center p-4 border rounded cursor-pointer transition-colors ${
            paymentMethod === 'mercadopago' ? 'border-accent bg-accent/10' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name="paymentMethod"
            value="mercadopago"
            checked={paymentMethod === 'mercadopago'}
            onChange={() => setPaymentMethod('mercadopago')}
            className="mr-3 accent-theme"
          />
          <CreditCard size={24} className="mr-3 text-blue-500" />
          <div className="flex-1">
            <span className="font-medium">MercadoPago</span>
            <p className="text-sm text-gray-500">Tarjeta de crédito, débito o dinero en cuenta</p>
          </div>
        </label>

        {/* Transferencia */}
        <label 
          className={`flex items-center p-4 border rounded cursor-pointer transition-colors ${
            paymentMethod === 'transfer' ? 'border-accent bg-accent/10' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name="paymentMethod"
            value="transfer"
            checked={paymentMethod === 'transfer'}
            onChange={() => setPaymentMethod('transfer')}
            className="mr-3 accent-theme"
          />
          <Banknote size={24} className="mr-3 text-green-500" />
          <div className="flex-1">
            <span className="font-medium">Transferencia Bancaria</span>
            <p className="text-sm text-green-600 font-semibold">15% OFF</p>
          </div>
        </label>

        {/* MODO */}
        <label 
          className={`flex items-center p-4 border rounded cursor-pointer transition-colors ${
            paymentMethod === 'modo' ? 'border-accent bg-accent/10' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name="paymentMethod"
            value="modo"
            checked={paymentMethod === 'modo'}
            onChange={() => setPaymentMethod('modo')}
            className="mr-3 accent-theme"
          />
          <div className="mr-3 w-6 h-6 flex items-center justify-center">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Modo_Logo.png/600px-Modo_Logo.png" 
              alt="MODO" 
              className="w-full h-full object-contain" 
            />
          </div>
          <div className="flex-1">
            <span className="font-medium">MODO</span>
            <p className="text-sm text-gray-500">Pagá con QR o App Bancaria</p>
          </div>
        </label>
      </div>
    </div>
  );
};
