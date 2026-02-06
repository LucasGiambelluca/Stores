
import React, { useEffect } from 'react';

// Add type definition for model-viewer
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src?: string;
        poster?: string;
        alt?: string;
        'auto-rotate'?: boolean;
        'camera-controls'?: boolean;
        'shadow-intensity'?: string;
        'environment-image'?: string;
        exposure?: string;
        loading?: 'auto' | 'lazy' | 'eager';
        ar?: boolean;
      }, HTMLElement>;
    }
  }
}

interface Product3DViewerProps {
  modelUrl?: string;
  poster?: string;
  autoRotate?: boolean;
}

const Product3DViewer: React.FC<Product3DViewerProps> = ({
  modelUrl,
  poster,
  autoRotate = true
}) => {
  useEffect(() => {
    // Dynamically load model-viewer script if not present
    if (!document.querySelector('script[src*="model-viewer"]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
      document.head.appendChild(script);
    }
  }, []);

  if (!modelUrl) return null;

  return (
    <div className="py-8 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="w-full h-[400px] md:h-[500px] bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 relative">
          <model-viewer
            src={modelUrl}
            poster={poster}
            alt="Modelo 3D del producto"
            auto-rotate={autoRotate}
            camera-controls
            shadow-intensity="1"
            loading="lazy"
            ar
            style={{ width: '100%', height: '100%' }}
          >
            <div slot="progress-bar"></div>
          </model-viewer>
          
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 shadow-sm pointer-events-none">
            Interactúa para rotar
          </div>
        </div>
      </div>
    </div>
  );
};

export default Product3DViewer;
