import React, { useState, useEffect } from 'react';
import { CreditCard, Banknote, QrCode, Check, AlertCircle, Wallet } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { getStoreHeaders } from '../../utils/storeDetection';
import { API_BASE } from '../../context/storeApi';

// Payments configuration admin page
export const AdminPayments: React.FC = () => {
  const [paymentsConfig, setPaymentsConfig] = useState({
    // MercadoPago
    mercadoPago: {
      enabled: true,
      publicKey: '',
      accessToken: '',
      mode: 'sandbox', // 'sandbox' | 'production'
    },
    // MODO
    modo: {
      enabled: false,
      mode: 'sandbox',
      storeId: '',
      clientId: '',
      clientSecret: '',
      apiKey: '',
    },
    // Bank Transfer
    bankTransfer: {
      enabled: true,
      discount: 10, // percentage
      bankName: '',
      accountHolder: '',
      cbu: '',
      alias: '',
      cuit: '',
    },
    // Cash on Delivery
    cashOnDelivery: {
      enabled: false,
      extraCharge: 0,
    },
    // Local Pickup Payment
    localPickupPayment: {
      enabled: true,
      cashEnabled: true,
      cardEnabled: true,
      transferEnabled: true,
    },
    // Installments
    installments: {
      enabled: true,
      maxInstallments: 12,
      interestFree: 3,
    },
  });
  
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    // Load saved config from API
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${API_BASE}/admin/payments/config`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            ...getStoreHeaders()
          }
        });
        if (response.ok) {
          const data = await response.json();
          // Merge with default structure to ensure all fields exist
          setPaymentsConfig(prev => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error('Error loading payment config:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchConfig();
    }
  }, [token]);

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/payments/config`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...getStoreHeaders()
        },
        body: JSON.stringify(paymentsConfig)
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        alert('Error al guardar la configuración');
      }
    } catch (err) {
      console.error('Error saving config:', err);
      alert('Error de conexión');
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Configuración de Pagos</h1>
          <p className="text-gray-600">Configurá los métodos de pago aceptados</p>
        </div>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          {saved ? <Check size={20} /> : null}
          {saved ? 'Guardado!' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="grid gap-6">
        {/* MercadoPago */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Wallet size={20} className="text-blue-500" />
              MercadoPago
            </h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={paymentsConfig.mercadoPago.enabled}
                onChange={(e) => setPaymentsConfig({
                  ...paymentsConfig,
                  mercadoPago: { ...paymentsConfig.mercadoPago, enabled: e.target.checked }
                })}
                className="w-5 h-5"
              />
              <span className="text-sm font-medium">Habilitado</span>
            </label>
          </div>
          
          {paymentsConfig.mercadoPago.enabled && (
            <div className="space-y-4">
              <div className="flex gap-4 mb-4">
                {['sandbox', 'production'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setPaymentsConfig({
                      ...paymentsConfig,
                      mercadoPago: { ...paymentsConfig.mercadoPago, mode }
                    })}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      paymentsConfig.mercadoPago.mode === mode
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                        : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                    }`}
                  >
                    {mode === 'sandbox' ? '🧪 Sandbox (Testing)' : '🚀 Producción'}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Public Key</label>
                  <input
                    type="text"
                    value={paymentsConfig.mercadoPago.publicKey}
                    onChange={(e) => setPaymentsConfig({
                      ...paymentsConfig,
                      mercadoPago: { ...paymentsConfig.mercadoPago, publicKey: e.target.value }
                    })}
                    className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                    placeholder="APP_USR-xxxxxxxx-xxxx-xxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
                  <input
                    type="password"
                    value={paymentsConfig.mercadoPago.accessToken}
                    onChange={(e) => setPaymentsConfig({
                      ...paymentsConfig,
                      mercadoPago: { ...paymentsConfig.mercadoPago, accessToken: e.target.value }
                    })}
                    className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                    placeholder="APP_USR-xxxxxxxx..."
                  />
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
                <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">¿Cómo obtener las credenciales?</p>
                  <ol className="list-decimal ml-4 space-y-1">
                    <li>Ingresá a <a href="https://www.mercadopago.com.ar/developers" target="_blank" rel="noopener" className="underline">mercadopago.com.ar/developers</a></li>
                    <li>Creá una aplicación o usá la existente</li>
                    <li>Copiá las credenciales de producción o sandbox según corresponda</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bank Transfer */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Banknote size={20} className="text-green-500" />
              Transferencia Bancaria
            </h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={paymentsConfig.bankTransfer.enabled}
                onChange={(e) => setPaymentsConfig({
                  ...paymentsConfig,
                  bankTransfer: { ...paymentsConfig.bankTransfer, enabled: e.target.checked }
                })}
                className="w-5 h-5"
              />
              <span className="text-sm font-medium">Habilitado</span>
            </label>
          </div>
          
          {paymentsConfig.bankTransfer.enabled && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium text-green-800">Descuento por transferencia:</label>
                  <input
                    type="number"
                    value={paymentsConfig.bankTransfer.discount}
                    onChange={(e) => setPaymentsConfig({
                      ...paymentsConfig,
                      bankTransfer: { ...paymentsConfig.bankTransfer, discount: parseInt(e.target.value) || 0 }
                    })}
                    className="w-20 px-3 py-1 border rounded-lg"
                    min="0"
                    max="50"
                  />
                  <span className="text-green-700">%</span>
                </div>
                <p className="text-sm text-green-700">Los clientes verán este descuento al elegir transferencia</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
                  <input
                    type="text"
                    value={paymentsConfig.bankTransfer.bankName}
                    onChange={(e) => setPaymentsConfig({
                      ...paymentsConfig,
                      bankTransfer: { ...paymentsConfig.bankTransfer, bankName: e.target.value }
                    })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Banco Galicia"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titular</label>
                  <input
                    type="text"
                    value={paymentsConfig.bankTransfer.accountHolder}
                    onChange={(e) => setPaymentsConfig({
                      ...paymentsConfig,
                      bankTransfer: { ...paymentsConfig.bankTransfer, accountHolder: e.target.value }
                    })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Juan Pérez"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CBU</label>
                  <input
                    type="text"
                    value={paymentsConfig.bankTransfer.cbu}
                    onChange={(e) => setPaymentsConfig({
                      ...paymentsConfig,
                      bankTransfer: { ...paymentsConfig.bankTransfer, cbu: e.target.value }
                    })}
                    className="w-full px-4 py-2 border rounded-lg font-mono"
                    placeholder="0000000000000000000000"
                    maxLength={22}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alias</label>
                  <input
                    type="text"
                    value={paymentsConfig.bankTransfer.alias}
                    onChange={(e) => setPaymentsConfig({
                      ...paymentsConfig,
                      bankTransfer: { ...paymentsConfig.bankTransfer, alias: e.target.value }
                    })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="MI.TIENDA.MP"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">CUIT (opcional)</label>
                  <input
                    type="text"
                    value={paymentsConfig.bankTransfer.cuit}
                    onChange={(e) => setPaymentsConfig({
                      ...paymentsConfig,
                      bankTransfer: { ...paymentsConfig.bankTransfer, cuit: e.target.value }
                    })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="20-12345678-9"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Installments */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard size={20} className="text-purple-500" />
              Cuotas con Tarjeta
            </h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={paymentsConfig.installments.enabled}
                onChange={(e) => setPaymentsConfig({
                  ...paymentsConfig,
                  installments: { ...paymentsConfig.installments, enabled: e.target.checked }
                })}
                className="w-5 h-5"
              />
              <span className="text-sm font-medium">Habilitado</span>
            </label>
          </div>
          
          {paymentsConfig.installments.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Máximo de cuotas</label>
                <select
                  value={paymentsConfig.installments.maxInstallments}
                  onChange={(e) => setPaymentsConfig({
                    ...paymentsConfig,
                    installments: { ...paymentsConfig.installments, maxInstallments: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {[1, 3, 6, 9, 12, 18, 24].map((n) => (
                    <option key={n} value={n}>{n} cuotas</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cuotas sin interés</label>
                <select
                  value={paymentsConfig.installments.interestFree}
                  onChange={(e) => setPaymentsConfig({
                    ...paymentsConfig,
                    installments: { ...paymentsConfig.installments, interestFree: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {[0, 1, 3, 6, 9, 12].map((n) => (
                    <option key={n} value={n}>{n === 0 ? 'Sin cuotas sin interés' : `${n} cuotas sin interés`}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Las cuotas sin interés las absorbe el vendedor</p>
              </div>
            </div>
          )}
        </div>

        {/* Cash on Delivery */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Banknote size={20} className="text-orange-500" />
              Pago Contra Entrega
            </h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={paymentsConfig.cashOnDelivery.enabled}
                onChange={(e) => setPaymentsConfig({
                  ...paymentsConfig,
                  cashOnDelivery: { ...paymentsConfig.cashOnDelivery, enabled: e.target.checked }
                })}
                className="w-5 h-5"
              />
              <span className="text-sm font-medium">Habilitado</span>
            </label>
          </div>
          
          {paymentsConfig.cashOnDelivery.enabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recargo adicional ($)</label>
              <input
                type="number"
                value={paymentsConfig.cashOnDelivery.extraCharge}
                onChange={(e) => setPaymentsConfig({
                  ...paymentsConfig,
                  cashOnDelivery: { ...paymentsConfig.cashOnDelivery, extraCharge: parseInt(e.target.value) || 0 }
                })}
                className="w-40 px-4 py-2 border rounded-lg"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Se suma al total si el cliente elige pago contra entrega</p>
            </div>
          )}
        </div>

        {/* Local Pickup Payment Methods */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <QrCode size={20} className="text-teal-500" />
              Métodos de Pago en Local
            </h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={paymentsConfig.localPickupPayment.enabled}
                onChange={(e) => setPaymentsConfig({
                  ...paymentsConfig,
                  localPickupPayment: { ...paymentsConfig.localPickupPayment, enabled: e.target.checked }
                })}
                className="w-5 h-5"
              />
              <span className="text-sm font-medium">Habilitado</span>
            </label>
          </div>
          
          {paymentsConfig.localPickupPayment.enabled && (
            <div className="flex flex-wrap gap-4">
              {[
                { key: 'cashEnabled', label: '💵 Efectivo', icon: Banknote },
                { key: 'cardEnabled', label: '💳 Tarjeta', icon: CreditCard },
                { key: 'transferEnabled', label: '🏦 Transferencia', icon: Banknote },
              ].map((method) => (
                <label
                  key={method.key}
                  className={`flex items-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentsConfig.localPickupPayment[method.key as keyof typeof paymentsConfig.localPickupPayment]
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={paymentsConfig.localPickupPayment[method.key as keyof typeof paymentsConfig.localPickupPayment] as boolean}
                    onChange={(e) => setPaymentsConfig({
                      ...paymentsConfig,
                      localPickupPayment: { ...paymentsConfig.localPickupPayment, [method.key]: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span>{method.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;
