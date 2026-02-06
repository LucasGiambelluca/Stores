import { CreditCard, Zap, Crown, Rocket } from 'lucide-react';

// Read payment links from environment variables (set in .env)
const getPaymentLink = (plan: string): string => {
  const envKey = `VITE_PAYMENT_LINK_${plan.toUpperCase()}`;
  return (import.meta as any).env?.[envKey] || '#';
};

export const PRICING_PLANS = [
  {
    id: 'starter',
    name: 'Emprendedor',
    price: 30000,
    period: 'anual',
    description: 'Ideal para validar tu idea o catálogos pequeños.',
    icon: Rocket,
    features: [
      'Hasta 50 productos',
      'Hasta 100 órdenes/mes',
      'Dominio .tiendita.app',
      'Soporte por Email (48hs)',
      'Panel de administración básico',
      'Pasarela de pagos estándar',
    ],
    highlight: false,
    buttonText: 'Comenzar',
    get paymentLink() { return getPaymentLink('starter'); },
  },
  {
    id: 'pro',
    name: 'Negocio',
    price: 60000,
    period: 'anual',
    description: 'Para tiendas en crecimiento sin límites.',
    icon: Zap,
    features: [
      'Todo lo de Emprendedor',
      'Hasta 2000 productos',
      'Órdenes Ilimitadas',
      'Dominio personalizado',
      '0% Comisión por transacción',
      'Soporte Prioritario (12hs)',
      'Herramientas de Marketing',
      'Recuperación de carritos',
    ],
    highlight: true,
    buttonText: 'Elegir Plan Negocio',
    get paymentLink() { return getPaymentLink('pro'); },
  },
  {
    id: 'enterprise',
    name: 'Imperio',
    price: 160000,
    period: 'anual',
    description: 'Para franquicias y marcas grandes.',
    icon: Crown,
    features: [
      'Todo lo de Negocio',
      'Soporte Dedicado 24/7 (WhatsApp)',
      'White Glove Onboarding',
      'API Access completo',
      'Múltiples administradores',
      'Auditoría de logs',
      'SLA garantizado',
    ],
    highlight: false,
    buttonText: 'Contactar Ventas',
    get paymentLink() { return getPaymentLink('enterprise'); },
  },
];

export const FOUNDER_OFFER = {
  id: 'founder',
  name: 'Licencia Fundador',
  price: 80000,
  originalPrice: 120000,
  period: 'único (2 años)',
  description: 'Oferta exclusiva de lanzamiento. Solo 10 unidades.',
  icon: CreditCard,
  features: [
    'Licencia PRO por 2 años',
    'Ahorro del 33% OFF',
    'Badge "Fundador" en el panel',
    'Acceso anticipado a Betas',
    '1 Hora de consultoría inicial',
  ],
  maxQuantity: 10,
  get paymentLink() { return getPaymentLink('founder'); },
};
