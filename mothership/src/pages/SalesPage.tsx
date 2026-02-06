import React, { useState, useEffect } from 'react';
import { Check, Star, Clock, ShieldCheck } from 'lucide-react';
import { PRICING_PLANS, FOUNDER_OFFER } from '../data/pricing';
import Badge from '../components/ui/Badge';

export const SalesPage = () => {
  const [founderSlotsLeft, setFounderSlotsLeft] = useState(10);

  // Mocking the scarcity counter - in a real app this would come from the backend
  useEffect(() => {
    // Simulate a slot being taken every few hours or just static for now
    // For now, let's keep it at 8 to show some urgency
    setFounderSlotsLeft(8);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-20 pb-16 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl -z-10" />
        <Badge variant="outline" className="mb-6 border-indigo-500/50 text-indigo-300 px-4 py-1 text-sm uppercase tracking-wider">
          Lanzamiento Oficial
        </Badge>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
          Tu Tienda, Tu Imperio.
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          La plataforma de comercio electrónico diseñada para escalar. Sin comisiones ocultas, sin límites absurdos.
        </p>
      </div>

      {/* Founder Offer Section */}
      <div className="max-w-5xl mx-auto px-4 mb-24">
        <div className="relative bg-gradient-to-br from-indigo-900/50 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 md:p-12 overflow-hidden group hover:border-indigo-500/50 transition-all duration-500">
          <div className="absolute top-0 right-0 p-4 bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest rounded-bl-2xl">
            Oferta Limitada
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                <span className="text-yellow-400 font-bold tracking-wide">LICENCIA FUNDADOR</span>
              </div>
              <h2 className="text-4xl font-bold mb-4">Acceso Pro por 2 Años</h2>
              <p className="text-slate-300 mb-6 text-lg">
                Asegura el futuro de tu negocio con un descuento masivo y beneficios exclusivos de por vida.
              </p>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <span className="block text-xs text-slate-400 uppercase">Precio Normal</span>
                  <span className="text-xl font-bold text-slate-400 line-through">${FOUNDER_OFFER.originalPrice.toLocaleString()}</span>
                </div>
                <div className="bg-indigo-600/20 rounded-lg p-3 border border-indigo-500/50">
                  <span className="block text-xs text-indigo-300 uppercase">Precio Fundador</span>
                  <span className="text-3xl font-bold text-white">${FOUNDER_OFFER.price.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 mb-8">
                {FOUNDER_OFFER.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="bg-indigo-500/20 p-1 rounded-full">
                      <Check className="w-4 h-4 text-indigo-400" />
                    </div>
                    <span className="text-slate-200">{feature}</span>
                  </div>
                ))}
              </div>

              <a 
                href={FOUNDER_OFFER.paymentLink}
                className="inline-flex w-full md:w-auto items-center justify-center gap-2 bg-white text-indigo-950 px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-colors shadow-lg shadow-indigo-900/20"
              >
                Reclamar Licencia Fundador
                <Clock className="w-5 h-5" />
              </a>
              <p className="mt-4 text-sm text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Pago único, acceso inmediato.
              </p>
            </div>

            <div className="relative">
              {/* Scarcity Counter */}
              <div className="bg-slate-950/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 text-center shadow-2xl">
                <h3 className="text-slate-400 text-sm uppercase tracking-widest mb-4">Cupos Restantes</h3>
                <div className="flex justify-center gap-2 mb-6">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-3 h-12 rounded-full transition-all duration-500 ${
                        i < founderSlotsLeft 
                          ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' 
                          : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-4xl font-black text-white mb-2">
                  {founderSlotsLeft} <span className="text-xl text-slate-500 font-normal">/ 10</span>
                </div>
                <p className="text-slate-400 text-sm">
                  Personas viendo esta oferta: <span className="text-indigo-400 font-bold animate-pulse">24</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Standard Pricing Table */}
      <div className="max-w-7xl mx-auto px-4 pb-24">
        <h2 className="text-3xl font-bold text-center mb-12">Planes Anuales Flexibles</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {PRICING_PLANS.map((plan) => (
            <div 
              key={plan.id}
              className={`relative bg-slate-900/50 border rounded-2xl p-8 flex flex-col ${
                plan.highlight 
                  ? 'border-indigo-500 shadow-xl shadow-indigo-900/10 scale-105 z-10' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                  Más Popular
                </div>
              )}

              <div className="mb-8">
                <plan.icon className={`w-10 h-10 mb-4 ${plan.highlight ? 'text-indigo-400' : 'text-slate-500'}`} />
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm h-10">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">${plan.price.toLocaleString()}</span>
                  <span className="text-slate-500">/año</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Equivale a ${(plan.price / 12).toFixed(0)}/mes
                </p>
              </div>

              <div className="flex-1 mb-8">
                <ul className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className={`w-5 h-5 shrink-0 ${plan.highlight ? 'text-indigo-400' : 'text-slate-600'}`} />
                      <span className="text-slate-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={plan.paymentLink}
                className={`w-full py-3 px-6 rounded-xl font-bold text-center transition-all ${
                  plan.highlight
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-900/20'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                {plan.buttonText}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
