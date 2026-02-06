/**
 * ProductGallery Widget
 * 
 * Handles image display with carousel, thumbnails, lightbox and zoom functionality.
 * Extracted from ProductDetail.tsx for use with the Product Page Builder.
 * 
 * @plan free - Available to all plans
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Product } from '../../types';

interface ProductGalleryProps {
  product: Product;
  layout?: 'carousel' | 'grid' | 'stack';
  imageRatio?: '1:1' | '3:4' | '4:3' | '16:9';
  showThumbnails?: boolean;
  enableZoom?: boolean;
  enableLightbox?: boolean;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  product,
  layout = 'carousel',
  imageRatio = '3:4',
  showThumbnails = true,
  enableZoom = true,
  enableLightbox = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Get all product images
  const allImages = product.images && product.images.length > 0
    ? product.images
    : [product.image];

  const goToPrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1);
  };

  const goToNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1);
  };

  const openLightbox = () => {
    if (enableLightbox) setIsLightboxOpen(true);
  };
  
  const closeLightbox = () => setIsLightboxOpen(false);

  // Handle keyboard navigation in lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isLightboxOpen]);

  // Calculate aspect ratio class
  const getAspectRatioClass = () => {
    switch (imageRatio) {
      case '1:1': return 'aspect-square';
      case '3:4': return 'aspect-[3/4]';
      case '4:3': return 'aspect-[4/3]';
      case '16:9': return 'aspect-video';
      default: return 'aspect-[3/4]';
    }
  };

  // Render grid layout
  if (layout === 'grid') {
    return (
      <div className="grid grid-cols-2 gap-2">
        {allImages.map((img, index) => (
          <div
            key={index}
            className={`${getAspectRatioClass()} bg-white overflow-hidden cursor-zoom-in`}
            onClick={() => { setCurrentIndex(index); openLightbox(); }}
          >
            <img
              src={img}
              alt={`${product.name} - Image ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        ))}
      </div>
    );
  }

  // Render stack layout
  if (layout === 'stack') {
    return (
      <div className="flex flex-col gap-4">
        {allImages.map((img, index) => (
          <div
            key={index}
            className="bg-white overflow-hidden cursor-zoom-in"
            onClick={() => { setCurrentIndex(index); openLightbox(); }}
          >
            <img
              src={img}
              alt={`${product.name} - Image ${index + 1}`}
              className="w-full h-auto object-cover transition-transform duration-300 hover:scale-[1.02]"
            />
          </div>
        ))}
      </div>
    );
  }

  // Default: Carousel layout
  return (
    <>
      {/* Main Carousel */}
      <div className="relative">
        {/* Main image - clickable */}
        <div
          className={`${getAspectRatioClass()} bg-white overflow-hidden ${enableLightbox ? 'cursor-zoom-in' : ''}`}
          onClick={openLightbox}
        >
          <img
            src={allImages[currentIndex]}
            alt={`${product.name} - Image ${currentIndex + 1}`}
            className={`w-full h-full object-cover transition-transform duration-300 ${enableZoom ? 'hover:scale-105' : ''}`}
          />
        </div>

        {/* Navigation arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Thumbnails */}
        {showThumbnails && allImages.length > 1 && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {allImages.map((img, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-20 h-24 bg-white overflow-hidden border-2 transition-all ${
                  index === currentIndex ? 'border-black' : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img
                  src={img}
                  alt={`${product.name} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Image counter */}
        {allImages.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
            {currentIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ animation: 'fade-in 0.2s ease-out forwards' }}
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/90"
            onClick={closeLightbox}
          />

          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 z-10 text-white/80 hover:text-white transition-colors"
            aria-label="Close lightbox"
          >
            <X size={32} />
          </button>

          {/* Image counter */}
          <div className="absolute top-6 left-6 text-white/80 text-sm">
            {currentIndex + 1} / {allImages.length}
          </div>

          {/* Navigation arrows */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 transition-all z-10"
                aria-label="Previous image"
              >
                <ChevronLeft size={48} />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 transition-all z-10"
                aria-label="Next image"
              >
                <ChevronRight size={48} />
              </button>
            </>
          )}

          {/* Main lightbox image */}
          <div
            className="relative z-10 max-w-[90vw] max-h-[85vh] flex items-center justify-center"
            style={{ animation: 'slide-up 0.3s ease-out forwards' }}
          >
            <img
              src={allImages[currentIndex]}
              alt={`${product.name} - Image ${currentIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain shadow-2xl"
              style={{ transition: 'opacity 0.3s ease' }}
            />
          </div>

          {/* Thumbnail strip at bottom */}
          {allImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {allImages.map((img, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                  className={`w-16 h-20 overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? 'border-white opacity-100'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ProductGallery;
