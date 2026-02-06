import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useStoreConfig } from '../context/StoreContext';
import { useCoupon } from '../context/CouponContext';
import { CheckCircle, ArrowLeft, Lock, Loader2, Upload, FileCheck } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { getStoreHeaders } from '../utils/storeDetection';
import { ConfettiCelebration, useConfetti } from './ConfettiCelebration';

// Subcomponents
import { CheckoutOrderSummary } from './checkout/CheckoutOrderSummary';
import { PaymentMethodSelector } from './checkout/PaymentMethodSelector';
import { ShippingSection } from './checkout/ShippingSection';

interface ShippingQuote {
  carrier: string;
  carrierName: string;
  service: string;
  price: number;
  estimatedDays: { min: number; max: number };
  isFree: boolean;
}

interface ShippingForm {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

export const CheckoutForm: React.FC = () => {
  const { items, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { config } = useStoreConfig();
  const { discountAmount } = useCoupon();
  const [searchParams] = useSearchParams();
  const { isActive: showConfetti, celebrate, onComplete: onConfettiComplete } = useConfetti();
  
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'transfer' | 'modo'>('mercadopago');
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [confirmedTotal, setConfirmedTotal] = useState<number>(0);
  
  const [form, setForm] = useState<ShippingForm>({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });

  // Check for return from MercadoPago
  useEffect(() => {
    const status = searchParams.get('status');
    const order = searchParams.get('order');
    
    if (status === 'approved' && order) {
      setOrderNumber(order);
      setStep('success');
      clearCart();
      celebrate(); // Trigger confetti!
    } else if (status === 'failure') {
      setError('El pago fue rechazado. Por favor, intentá con otro método.');
      setStep('error');
    } else if (status === 'pending') {
      setOrderNumber(order || '');
      setStep('success');
      clearCart();
      celebrate(); // Trigger confetti!
    }
  }, [searchParams, clearCart, celebrate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Fetch shipping quotes when postal code changes
  const fetchShippingQuotes = async () => {
    if (form.postalCode.length !== 4) return;
    
    setIsLoadingShipping(true);
    try {
      const response = await fetch('/api/shipping/quote', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getStoreHeaders()
        },
        body: JSON.stringify({
          postalCode: form.postalCode,
          items: items.map(item => ({ quantity: item.quantity, weight: 500 })),
          subtotal: cartTotal,
        }),
      });
      
      const data = await response.json();
      setShippingQuotes(data.quotes || []);
      
      // Auto-select first option
      if (data.quotes?.length > 0) {
        setSelectedShipping(data.quotes[0]);
      }
    } catch (err) {
      console.error('Error fetching shipping:', err);
    } finally {
      setIsLoadingShipping(false);
    }
  };

  useEffect(() => {
    if (form.postalCode.length === 4) {
      fetchShippingQuotes();
    }
  }, [form.postalCode]);

  // Calculate totals
  const subtotal = cartTotal;
  const shippingCost = selectedShipping?.price || 0;
  const transferDiscount = paymentMethod === 'transfer' ? Math.round(subtotal * 0.15) : 0;
  const total = Math.max(0, subtotal - transferDiscount - discountAmount + shippingCost);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStep('processing');

    try {
      // 1. Create order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getStoreHeaders()
        },
        body: JSON.stringify({
          customerEmail: form.email,
          customerName: form.fullName,
          customerPhone: form.phone,
          shippingAddress: `${form.address}, ${form.city} (${form.postalCode})`,
          shippingMethod: selectedShipping?.service || 'Standard',
          shippingCost: shippingCost,
          paymentMethod: paymentMethod,
          items: items.map(item => ({
            productId: String(item.id),
            productName: item.name,
            productImage: item.image,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          })),
        }),
      });

      const orderData = await orderResponse.json();
      
      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Error al crear la orden');
      }

      setOrderNumber(orderData.order.orderNumber);
      setOrderId(orderData.order.id);

      // 2. Handle payment based on method
      if (paymentMethod === 'mercadopago') {
        const mpResponse = await fetch('/api/payments/preference', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...getStoreHeaders()
          },
          body: JSON.stringify({
            orderId: orderData.order.id,
            items: items.map(item => ({
              id: String(item.id),
              title: item.name,
              quantity: item.quantity,
              unit_price: item.price,
              picture_url: item.image,
            })),
            payer: {
              name: form.fullName,
              email: form.email,
              phone: form.phone,
            },
          }),
        });

        const mpData = await mpResponse.json();
        
        if (mpData.initPoint) {
          window.location.href = mpData.initPoint;
          return;
        } else {
          throw new Error('Error al crear el pago');
        }
      } else if (paymentMethod === 'modo') {
        const modoResponse = await fetch('/api/payments/modo/intention', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...getStoreHeaders()
          },
          body: JSON.stringify({
            orderId: orderData.order.id,
            items: items.map(item => ({
              id: String(item.id),
              title: item.name,
              quantity: item.quantity,
              unit_price: item.price,
              picture_url: item.image,
            })),
            payer: {
              name: form.fullName,
              email: form.email,
              phone: form.phone,
            },
          }),
        });

        const modoData = await modoResponse.json();
        
        if (modoData.deeplink) {
          window.location.href = modoData.deeplink;
          return;
        } else {
           throw new Error('Error al iniciar pago con MODO');
        }

      } else {
        // Transfer payment - show success with instructions
        setConfirmedTotal(total);
        setStep('success');
        clearCart();
        celebrate(); // Trigger confetti!
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Error al procesar el pedido');
      setStep('error');
    }
  };

  // Processing screen
  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-[#F8F8FA] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-12 rounded-lg shadow-lg max-w-md w-full text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-6" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Procesando tu pedido...</h2>
          <p className="text-gray-500">Por favor, no cierres esta página</p>
        </div>
      </div>
    );
  }

  // Error screen
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-[#F8F8FA] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-red-500 text-4xl">✕</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error en el pedido</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button 
            onClick={() => setStep('form')} 
            className="block w-full bg-black text-white py-4 font-semibold hover:bg-gray-800 transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  // Success screen
  if (step === 'success') {
    return (
      <>
        <ConfettiCelebration isActive={showConfetti} onComplete={onConfettiComplete} />
        <div className="min-h-screen bg-[#F8F8FA] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-500" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pedido Confirmado!</h2>
          <p className="text-gray-500 mb-4">
            Gracias por tu compra, {form.fullName || 'Cliente'}
          </p>
          
          {orderNumber && (
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600 mb-1">Número de orden:</p>
              <p className="text-xl font-bold" style={{ color: 'var(--color-accent)' }}>{orderNumber}</p>
            </div>
          )}

          {paymentMethod === 'transfer' && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6 text-left">
              <p className="font-semibold text-yellow-800 mb-2">Datos para transferencia:</p>
              <p className="text-sm text-yellow-700">
                • Banco: Santander<br />
                • CBU: 0720000000012345678901<br />
                • Alias: XMENOS.PRENDAS<br />
                • Total: <strong>{formatPrice(confirmedTotal)}</strong>
              </p>
              
              {/* Receipt Upload Section */}
              <div className="mt-4 pt-4 border-t border-yellow-200">
                <p className="font-semibold text-yellow-800 mb-2">
                  {receiptUploaded ? '✓ Comprobante enviado' : 'Subí tu comprobante:'}
                </p>
                
                {receiptUploaded ? (
                  <div className="flex items-center gap-2 text-green-700 bg-green-100 p-3 rounded">
                    <FileCheck size={20} />
                    <span className="text-sm">¡Comprobante recibido! Lo verificaremos pronto.</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded file:border-0
                        file:text-sm file:font-semibold
                        file:bg-yellow-100 file:text-yellow-700
                        hover:file:bg-yellow-200"
                    />
                    
                    {receiptFile && (
                      <button
                        type="button"
                        disabled={uploadingReceipt}
                        onClick={async () => {
                          if (!receiptFile || !orderId) return;
                          setUploadingReceipt(true);
                          
                          try {
                            const formData = new FormData();
                            formData.append('file', receiptFile);  // Changed from 'image' to 'file'
                            
                            // Get store headers for multipart - only X-Store-Id header
                            const storeHeaders = getStoreHeaders();
                            
                            // Use public receipt upload endpoint (supports images + PDF)
                            const uploadRes = await fetch('/api/upload/receipt', {
                              method: 'POST',
                              headers: storeHeaders,
                              body: formData,
                            });
                            
                            if (!uploadRes.ok) {
                              const errData = await uploadRes.json().catch(() => ({}));
                              throw new Error(errData.error || 'Error al subir archivo');
                            }
                            
                            const { url } = await uploadRes.json();
                            
                            await fetch(`/api/orders/${orderId}/receipt`, {
                              method: 'POST',
                              headers: { 
                                'Content-Type': 'application/json',
                                ...getStoreHeaders()
                              },
                              body: JSON.stringify({ receiptUrl: url }),
                            });
                            
                            setReceiptUploaded(true);
                          } catch (err) {
                            console.error('Upload error:', err);
                            alert('Error al subir el comprobante. Intentá nuevamente.');
                          } finally {
                            setUploadingReceipt(false);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-white py-2 px-4 rounded font-semibold hover:bg-yellow-600 disabled:opacity-50"
                      >
                        {uploadingReceipt ? (
                          <><Loader2 size={16} className="animate-spin" /> Subiendo...</>
                        ) : (
                          <><Upload size={16} /> Enviar Comprobante</>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="text-sm text-gray-500 mb-6">
            Te enviaremos un email con los detalles del envío.
          </p>
          
          <Link to="/" className="block w-full bg-black text-white py-4 font-semibold hover:bg-gray-800 transition-colors">
            Volver a la Tienda
          </Link>
        </div>
      </div>
      </>
    );
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F8FA] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tu carrito está vacío</h2>
          <Link to="/" className="inline-block bg-black text-white px-8 py-3 font-semibold hover:bg-gray-800 transition-colors">
            Ir a comprar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8FA] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="text-gray-500 hover:text-black flex items-center text-sm font-medium mb-4">
            <ArrowLeft size={16} className="mr-2"/> Volver a la tienda
          </Link>
          <h1 className="text-3xl font-bold">Checkout</h1>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Form */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Info */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-bold mb-4">Información de Contacto</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                    <input 
                      type="text" 
                      name="fullName" 
                      required 
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="Juan Pérez"
                      className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:border-black" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input 
                      type="email" 
                      name="email" 
                      required 
                      value={form.email}
                      onChange={handleChange}
                      placeholder="juan@email.com"
                      className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:border-black" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      required 
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="291 4123456"
                      className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:border-black" 
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Section - Using subcomponent */}
              <ShippingSection
                form={form}
                onFormChange={handleChange}
                isLoadingShipping={isLoadingShipping}
                shippingQuotes={shippingQuotes}
                selectedShipping={selectedShipping}
                onSelectShipping={setSelectedShipping}
              />

              {/* Payment Method - Using subcomponent */}
              <PaymentMethodSelector
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
              />

              {/* Submit */}
              <button
                type="submit"
                disabled={!selectedShipping && form.postalCode.length === 4}
                className="w-full py-4 font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-accent"
              >
                <Lock size={20} />
                Finalizar Compra - {formatPrice(total)}
              </button>
            </form>
          </div>

          {/* Order Summary - Using subcomponent */}
          <div className="lg:col-span-5 mt-8 lg:mt-0">
            <CheckoutOrderSummary
              items={items}
              subtotal={subtotal}
              shippingCost={shippingCost}
              transferDiscount={transferDiscount}
              discountAmount={discountAmount}
              total={total}
              selectedShipping={selectedShipping}
            />
          </div>
        </div>
      </div>
    </div>
  );
};