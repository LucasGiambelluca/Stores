/**
 * OptimizedImage Component
 * 
 * A performant image component with:
 * - Native lazy loading
 * - Loading placeholder
 * - Error fallback
 * - Aspect ratio container
 */

import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  fallbackSrc?: string;
  aspectRatio?: 'square' | '4:3' | '16:9' | 'auto';
  priority?: boolean; // For above-the-fold images
}

const FALLBACK_IMAGE = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%2394a3b8" font-size="12">Sin imagen</text></svg>';

const aspectRatioClasses = {
  'square': 'aspect-square',
  '4:3': 'aspect-[4/3]',
  '16:9': 'aspect-video',
  'auto': '',
};

export default function OptimizedImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  fallbackSrc = FALLBACK_IMAGE,
  aspectRatio = 'square',
  priority = false,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => setIsLoaded(true);
  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const imageSrc = hasError ? fallbackSrc : (src || fallbackSrc);
  const aspectClass = aspectRatioClasses[aspectRatio];

  return (
    <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${aspectClass} ${containerClassName}`}>
      {/* Loading placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-primary-500 rounded-full animate-spin" />
        </div>
      )}
      
      <img
        src={imageSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`
          w-full h-full object-cover
          transition-opacity duration-300
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
          ${className}
        `}
      />
    </div>
  );
}
