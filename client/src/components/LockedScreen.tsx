import React from 'react';
import { Wrench, AlertTriangle, Clock } from 'lucide-react';

export default function LockedScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4 text-center">
      {/* Maintenance Icon */}
      <div className="relative mb-8">
        <div className="bg-amber-500/20 p-8 rounded-full animate-pulse">
          <Wrench className="w-16 h-16 text-amber-400" />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-gray-800 p-2 rounded-full border-4 border-gray-900">
          <Clock className="w-6 h-6 text-amber-400" />
        </div>
      </div>
      
      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
        🚧 En Mantenimiento
      </h1>
      
      <div className="max-w-lg space-y-6">
        <p className="text-gray-300 text-lg md:text-xl">
          Estamos trabajando para mejorar tu experiencia.
          <br />
          La tienda estará disponible muy pronto.
        </p>
        
        {/* Info Card */}
        <div className="bg-gray-800/80 backdrop-blur border border-gray-700 rounded-2xl p-6 flex items-start gap-4 text-left shadow-2xl">
          <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-white font-semibold mb-2">¿Por qué ves esto?</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Esta tienda está temporalmente suspendida. Esto puede deberse a 
              mantenimiento programado, actualización de licencia, o revisión administrativa.
            </p>
          </div>
        </div>

        {/* Contact Info */}
        <p className="text-gray-500 text-sm pt-4">
          Si eres el administrador de esta tienda, contacta a <span className="text-amber-400">soporte</span> para más información.
        </p>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-6 text-gray-600 text-xs">
        Tiendita SaaS Platform
      </div>
    </div>
  );
}
