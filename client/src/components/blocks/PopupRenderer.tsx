import React, { useState, useEffect } from 'react';
import { X, Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { PopupConfig } from '../../types';
import { useStoreConfig } from '../../context/StoreContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface PopupRendererProps {
  config: PopupConfig;
  blockId: string;
}

export const PopupRenderer: React.FC<PopupRendererProps> = ({ config, blockId }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const { config: storeConfig } = useStoreConfig();

  // Check if popup should be shown based on device
  const checkDeviceVisibility = () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile && !config.showOnMobile) return false;
    if (!isMobile && !config.showOnDesktop) return false;
    return true;
  };

  // Check if already shown in this session
  const checkSessionVisibility = () => {
    if (config.showOnce) {
      const shownPopups = sessionStorage.getItem('shownPopups') || '';
      if (shownPopups.includes(blockId)) return false;
    }
    return true;
  };

  // Mark as shown in session
  const markAsShown = () => {
    if (config.showOnce) {
      const shownPopups = sessionStorage.getItem('shownPopups') || '';
      sessionStorage.setItem('shownPopups', `${shownPopups},${blockId}`);
    }
  };

  // Trigger popup
  const triggerPopup = () => {
    if (!checkDeviceVisibility() || !checkSessionVisibility() || hasTriggered) return;
    setIsVisible(true);
    setHasTriggered(true);
    markAsShown();
  };

  useEffect(() => {
    // Debug log
    console.log('PopupRenderer mounted:', { 
      blockId, 
      trigger: config.trigger, 
      showOnMobile: config.showOnMobile, 
      showOnDesktop: config.showOnDesktop,
      showOnce: config.showOnce,
      deviceOk: checkDeviceVisibility(),
      sessionOk: checkSessionVisibility()
    });

    // Immediate trigger
    if (config.trigger === 'immediate') {
      const timer = setTimeout(triggerPopup, 500);
      return () => clearTimeout(timer);
    }

    // Delay trigger (default)
    if (config.trigger === 'delay' || !config.trigger) {
      const delay = (config.delaySeconds || 3) * 1000;
      console.log('Popup will trigger in', delay, 'ms');
      const timer = setTimeout(triggerPopup, delay);
      return () => clearTimeout(timer);
    }

    // Scroll trigger
    if (config.trigger === 'scroll') {
      const handleScroll = () => {
        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        if (scrollPercent >= (config.scrollPercent || 50)) {
          triggerPopup();
        }
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }

    // Exit intent trigger
    if (config.trigger === 'exit-intent') {
      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) {
          triggerPopup();
        }
      };
      document.addEventListener('mouseleave', handleMouseLeave);
      return () => document.removeEventListener('mouseleave', handleMouseLeave);
    }
  }, [blockId]); // Only run on mount, not on every config change

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Subscribe to newsletter
      await fetch(`${API_URL}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          source: config.popupType,
          popupId: blockId 
        }),
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsVisible(false);
      }, 2000);
    } catch (err) {
      console.error('Newsletter subscribe error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCTAClick = () => {
    if (config.buttonLink) {
      if (config.buttonLink.startsWith('http')) {
        window.open(config.buttonLink, '_blank');
      } else {
        window.location.hash = config.buttonLink;
      }
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  // Size classes - más grandes
  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-xl',
  };

  // Position classes
  const positionClasses = {
    center: 'items-center justify-center',
    'bottom-right': 'items-end justify-end p-4',
    'bottom-left': 'items-end justify-start p-4',
  };

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex ${positionClasses[config.position || 'center']} p-4`}
      style={{ backgroundColor: config.overlayColor || 'rgba(0,0,0,0.6)' }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      {/* Wrapper para posicionar la X */}
      <div className="relative">
        {/* Close button - afuera del contenedor */}
        <button
          onClick={handleClose}
          className="absolute -top-3 -right-3 p-2 bg-white hover:bg-gray-100 rounded-full z-30 transition-all shadow-lg hover:shadow-xl border border-gray-200"
          style={{ transform: 'translate(50%, -50%)' }}
        >
          <X size={22} className="text-gray-700" />
        </button>
        
        <div 
          className={`bg-white rounded-2xl shadow-2xl overflow-hidden ${sizeClasses[config.size || 'medium']} w-full animate-popup-enter`}
          style={{ backgroundColor: config.backgroundColor || '#ffffff' }}
        >

        {/* Image - más altura */}
        {config.image && (
          <div className="w-full h-48 md:h-56 overflow-hidden">
            <img 
              src={config.image} 
              alt={config.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content - más padding */}
        <div className="p-8 md:p-10">
          {isSuccess ? (
            <div className="text-center py-8">
              <div 
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${storeConfig.colors.accent}20` }}
              >
                <CheckCircle size={32} style={{ color: storeConfig.colors.accent }} />
              </div>
              <p className="text-xl font-semibold" style={{ color: storeConfig.colors.primary }}>
                {config.successMessage || '¡Gracias por suscribirte!'}
              </p>
              <p className="text-gray-500 mt-2">Te enviaremos las mejores ofertas</p>
            </div>
          ) : (
            <>
              {/* Título más grande */}
              <h3 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: storeConfig.colors.primary }}>
                {config.title}
              </h3>
              
              {config.subtitle && (
                <p className="text-lg text-gray-600 mb-4">{config.subtitle}</p>
              )}
              
              {config.description && (
                <p className="text-gray-500 mb-6">{config.description}</p>
              )}

              {/* Newsletter form - mejor estilo */}
              {config.showEmailInput && (
                <form onSubmit={handleSubmit} className="mt-6">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={config.emailPlaceholder || 'Tu email'}
                        className="w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:ring-2 focus:border-transparent text-lg"
                        style={{ 
                          borderColor: '#e5e7eb',
                        }}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-105"
                      style={{ 
                        backgroundColor: storeConfig.colors.accent,
                        color: storeConfig.colors.primary
                      }}
                    >
                      {isSubmitting ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        <>
                          {config.submitButtonText || 'Suscribirme'}
                          <ArrowRight size={20} />
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-3 text-center">
                    No spam, solo ofertas exclusivas
                  </p>
                </form>
              )}

              {/* CTA Button - más prominente */}
              {!config.showEmailInput && config.buttonText && (
                <button
                  onClick={handleCTAClick}
                  className="w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 hover:scale-105"
                  style={{ 
                    backgroundColor: storeConfig.colors.accent,
                    color: storeConfig.colors.primary
                  }}
                >
                  {config.buttonText}
                  <ArrowRight size={20} />
                </button>
              )}
              </>
          )}
        </div>
        </div>
      </div>

      <style>{`
        @keyframes popup-enter {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-popup-enter {
          animation: popup-enter 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PopupRenderer;
