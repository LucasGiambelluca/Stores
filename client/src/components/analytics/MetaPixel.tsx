import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export const MetaPixel: React.FC = () => {
  const { pathname } = useLocation();
  const { state: { config } } = useStore();
  const pixelId = config.facebookPixelId;

  // Initialize Pixel only if consent granted
  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    
    if (consent === 'granted' && pixelId) {
      // Facebook Pixel Code
      (function(f: any, b: any, e: string, v: string, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function() {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      
      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');
    }
  }, [pixelId]); // Re-run if pixelId changes

  // Track PageView on route changes
  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (consent === 'granted' && window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [pathname]);

  return null;
};
