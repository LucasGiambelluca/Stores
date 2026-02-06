
import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ProductBannerProps {
  image?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  height?: string;
}

const ProductBanner: React.FC<ProductBannerProps> = ({
  image,
  title,
  subtitle,
  buttonText,
  buttonLink,
  height = '300px'
}) => {
  if (!image && !title) return null;

  return (
    <div className="py-8">
      <div 
        className="relative w-full rounded-2xl overflow-hidden flex items-center"
        style={{ height }}
      >
        {/* Background Image */}
        {image ? (
          <div className="absolute inset-0">
            <img 
              src={image} 
              alt={title || 'Banner'} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gray-900" />
        )}

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-8 w-full text-white">
          {title && (
            <h3 className="text-3xl md:text-4xl font-bold mb-3">{title}</h3>
          )}
          {subtitle && (
            <p className="text-lg text-gray-200 mb-6 max-w-xl">{subtitle}</p>
          )}
          {buttonText && (
            <a 
              href={buttonLink || '#'} 
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              {buttonText}
              <ArrowRight size={18} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductBanner;
