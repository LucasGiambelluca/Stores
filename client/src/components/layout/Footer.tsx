import React from 'react';
import { Instagram, MapPin, Mail, MessageCircle, Check } from 'lucide-react';
import { useStoreConfig } from '../../context/StoreContext';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  const { config } = useStoreConfig();

  // Safe defaults for unconfigured stores
  const safeConfig = {
    whatsapp: config?.whatsapp || '',
    instagram: config?.instagram || '',
    colors: config?.colors || { primary: '#111111', secondary: '#f4f4f4', accent: '#66FF00' },
    logo: config?.logo || '',
    name: config?.name || 'Mi Tienda',
    tagline: config?.tagline || '',
    city: config?.city || '',
    address: config?.address || '',
    email: config?.email || '',
    transferDiscount: config?.transferDiscount || '10%',
    paymentMethods: config?.paymentMethods || [],
  };

  // Helper to format whatsapp number
  const whatsappNumber = safeConfig.whatsapp.replace(/[^0-9]/g, '');
  const instagramHandle = safeConfig.instagram.replace('@', '');

  return (
    <>
      {/* Footer - Industrial Gray */}
      <footer className="border-t border-gray-300 py-12 px-6" style={{ backgroundColor: safeConfig.colors.secondary }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Logo & Description */}
            <div className="md:col-span-1">
              <img 
                src={safeConfig.logo} 
                alt={safeConfig.name} 
                className="h-16 w-auto mb-4"
              />
              <p className="text-sm text-gray-600">
                {safeConfig.tagline}. {safeConfig.city}.
                Los mejores precios con la mejor calidad.
              </p>
            </div>

            {/* Información */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4">Información</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/nosotros" className="hover:text-black">Sobre Nosotros</Link></li>
                <li><Link to="/preguntas-frecuentes" className="hover:text-black">Preguntas Frecuentes</Link></li>
                <li><Link to="/politicas-devolucion" className="hover:text-black">Política de Devolución</Link></li>
                <li><Link to="/terminos-condiciones" className="hover:text-black">Términos y Condiciones</Link></li>
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4">Contacto</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <MapPin size={16} strokeWidth={1.5} />
                  <span>{safeConfig.address}, {safeConfig.city}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail size={16} strokeWidth={1.5} />
                  <span>{safeConfig.email}</span>
                </li>
                <li>
                  <a 
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-black flex items-center gap-2"
                  >
                    <MessageCircle size={16} strokeWidth={1.5} />
                    <span>WhatsApp</span>
                  </a>
                </li>
                <li>
                  <a 
                    href={`https://instagram.com/${instagramHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-black flex items-center gap-2"
                  >
                    <Instagram size={16} strokeWidth={1.5} />
                    <span>{safeConfig.instagram}</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Métodos de Pago */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4">Formas de Pago</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                {safeConfig.paymentMethods.map((method, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check size={14} strokeWidth={2} className="text-green-600" />
                    <span>{method}</span>
                  </li>
                ))}
                <li className="text-green-600 font-semibold flex items-center gap-2 mt-2">
                  <span className="text-lg">%</span>
                  <span>{safeConfig.transferDiscount} OFF con transferencia</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Legal Section - Defensa al Consumidor */}
          <div className="border-t border-gray-200 pt-6 mt-6 mb-6">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
              <a 
                href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded transition-colors"
              >
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 14l-4-4 4-4"/>
                    <path d="M5 10h11a4 4 0 1 1 0 8h-1"/>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-500">Ley 24.240</p>
                  <p className="text-sm font-semibold">Botón de Arrepentimiento</p>
                </div>
              </a>

              <a 
                href="https://www.argentina.gob.ar/produccion/defensadelconsumidor"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="text-left">
                  <p className="text-xs text-gray-500">Dirección Nacional de</p>
                  <p className="text-sm font-semibold">Defensa del Consumidor</p>
                </div>
              </a>
            </div>
            
            <p className="text-xs text-gray-400 text-center mt-4">
              Para reclamos ingrese <a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">aquí</a>
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500">
              © 2024 {safeConfig.name}. Todos los derechos reservados.
            </p>
            <div className="flex gap-4">
              <a 
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-70"
                style={{ color: safeConfig.colors.accent }}
              >
                <MessageCircle size={24} />
              </a>
              <a 
                href={`https://instagram.com/${instagramHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-70"
                style={{ color: safeConfig.colors.accent }}
              >
                <Instagram size={24} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};
