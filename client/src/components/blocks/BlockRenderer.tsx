import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { HomepageBlock, PopupConfig } from '../../types';
import { HeroSlider, FeaturesSection, PromoSection, CategorySection } from '../HeroSlider';
import { ProductGrid, ProductSkeleton } from '../ProductComponents';
import { useProducts, useBanners, usePromoCards, useStoreConfig } from '../../context/StoreContext';
import { PopupRenderer } from './PopupRenderer';

// Icon map for features section
import * as LucideIcons from 'lucide-react';

interface BlockRendererProps {
  block: HomepageBlock;
}

// Individual block components
const HeroBlock: React.FC<{ config: any }> = ({ config }) => {
  return <HeroSlider config={config} />;
};

const FeaturesBlock: React.FC<{ config: any }> = ({ config }) => {
  const items = config.items || [];
  
  // Icon mapping
  const iconMap: Record<string, React.ElementType> = {
    Truck: (LucideIcons as any).Truck,
    CreditCard: (LucideIcons as any).CreditCard,
    Banknote: (LucideIcons as any).Banknote,
    RefreshCcw: (LucideIcons as any).RefreshCcw,
    Shield: (LucideIcons as any).Shield,
    Clock: (LucideIcons as any).Clock,
    Gift: (LucideIcons as any).Gift,
    Star: (LucideIcons as any).Star,
    Phone: (LucideIcons as any).Phone,
    Check: (LucideIcons as any).Check,
  };

  if (items.length === 0) {
    // Fallback to original component
    return <FeaturesSection />;
  }

  return (
    <section className="bg-white py-8 border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className={`grid grid-cols-2 md:grid-cols-${Math.min(items.length, 4)} gap-6`}>
          {items.map((item: any, index: number) => {
            const IconComponent = iconMap[item.icon] || (LucideIcons as any).Star;
            return (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-2">
                  <IconComponent size={28} strokeWidth={1.5} className="text-gray-700" />
                </div>
                <h3 className="font-bold text-sm uppercase tracking-wide">{item.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{item.subtitle}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const PromoCardsBlock: React.FC<{ config: any }> = ({ config }) => {
  const { config: storeConfig } = useStoreConfig();
  const cards = config.cards || [];
  
  // If no configured cards or using legacy mode, use existing PromoSection
  if (cards.length === 0 || config.usePromoCards) {
    return <PromoSection />;
  }

  const scrollToProducts = () => {
    const el = document.getElementById('productos');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent('Hola! Quiero consultar');
    window.open(`https://wa.me/${storeConfig.whatsapp?.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  // Separate large and small cards
  const largeCards = cards.filter((c: any) => c.type === 'large');
  const smallCards = cards.filter((c: any) => c.type === 'small');

  return (
    <section className="py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Large cards - left side */}
          {largeCards.length > 0 && (
            <div className="space-y-4">
              {largeCards.map((card: any, index: number) => (
                <div 
                  key={index}
                  className="relative rounded-2xl overflow-hidden h-[350px] md:h-[500px] group"
                >
                  {card.image && (
                    <img 
                      src={card.image} 
                      alt={card.title} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end p-8">
                    {card.title && (
                      <span className="inline-flex items-center gap-2 text-white text-sm mb-4">
                        ✨ {card.title}
                      </span>
                    )}
                    {card.subtitle && (
                      <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">{card.subtitle}</h2>
                    )}
                    {card.buttonText && (
                      <button
                        onClick={() => {
                          if (card.buttonLink === 'whatsapp') openWhatsApp();
                          else if (card.buttonLink?.startsWith('#')) scrollToProducts();
                          else if (card.buttonLink) window.location.href = card.buttonLink;
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm w-fit transition-transform hover:scale-105"
                        style={{ backgroundColor: storeConfig.colors.accent, color: storeConfig.colors.primary }}
                      >
                        {card.buttonText} →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Small cards - right side */}
          {smallCards.length > 0 && (
            <div className="space-y-4">
              {smallCards.map((card: any, index: number) => (
                <div 
                  key={index}
                  className="relative rounded-2xl overflow-hidden h-[180px] md:h-[240px] group"
                >
                  {card.image && (
                    <img 
                      src={card.image} 
                      alt={card.title} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-center p-6">
                    <div className="max-w-[60%]">
                      {card.title && <p className="text-xs text-gray-300 mb-1">{card.title}</p>}
                      {card.subtitle && <h3 className="text-lg font-bold text-white mb-3">{card.subtitle}</h3>}
                      {card.buttonText && (
                        <button
                          onClick={() => {
                            if (card.buttonLink === 'whatsapp') openWhatsApp();
                            else if (card.buttonLink?.startsWith('#')) scrollToProducts();
                            else if (card.buttonLink) window.location.href = card.buttonLink;
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-white/20 hover:bg-white/30 text-white transition-colors"
                        >
                          {card.buttonText} →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const CategoriesBlock: React.FC<{ config: any }> = () => {
  return <CategorySection />;
};

const ProductGridBlock: React.FC<{ config: any }> = ({ config }) => {
  const { products, isLoading } = useProducts();
  
  let filteredProducts = products;
  
  // Handle category filter (format: category:slug)
  if (config.filter?.startsWith('category:')) {
    const categorySlug = config.filter.replace('category:', '');
    filteredProducts = products.filter(p => p.category === categorySlug);
  } else if (config.filter === 'bestsellers') {
    filteredProducts = products.filter(p => p.isBestSeller);
  } else if (config.filter === 'new') {
    filteredProducts = products.filter(p => p.isNew);
  } else if (config.filter === 'sale') {
    filteredProducts = products.filter(p => p.discountPercent);
  }
  
  if (config.limit) {
    filteredProducts = filteredProducts.slice(0, config.limit);
  }

  // URL Parameter Override (Higher priority)
  const [searchParams] = useSearchParams();
  const urlCategory = searchParams.get('category');
  
  if (urlCategory) {
    if (urlCategory.includes('/')) {
       // Category/Subcategory format
       const [catSlug, subSlug] = urlCategory.split('/');
       filteredProducts = products.filter(p => 
         (p.category === catSlug || p.category?.toLowerCase() === catSlug.toLowerCase()) && 
         (p.subcategory?.toLowerCase().replace(/\s+/g, '-') === subSlug.toLowerCase())
       );
    } else {
       // Just Category
       filteredProducts = products.filter(p => 
         p.category === urlCategory || p.category?.toLowerCase() === urlCategory.toLowerCase()
       );
    }
  }

  return (
    <ProductGrid 
      id="productos" 
      title={config.title || 'Productos'} 
      products={filteredProducts} 
      showFilters={config.showFilters ?? true}
      isLoading={isLoading}
    />
  );
};

const BestsellersBlock: React.FC<{ config: any }> = ({ config }) => {
  const { products } = useProducts();
  const bestSellers = products.filter(p => p.isBestSeller);
  
  if (bestSellers.length === 0) return null;
  
  return (
    <div className="bg-white">
      <ProductGrid title={config.title || 'Los Más Vendidos'} products={bestSellers} />
    </div>
  );
};

const MapBlock: React.FC<{ config: any }> = ({ config }) => {
  const encodedAddress = encodeURIComponent(config.address || '');
  const iframeSrc = config.address 
    ? `https://maps.google.com/maps?q=${encodedAddress}&t=&z=${config.zoom || 15}&ie=UTF8&iwloc=&output=embed`
    : '';

  if (!config.address) {
    return (
      <section className="py-16 px-4 bg-gray-50 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-500">Configurá la dirección del mapa en el editor</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4" style={{ backgroundColor: config.backgroundColor || '#f9fafb' }}>
      <div className="max-w-6xl mx-auto">
        {config.showTitle && config.title && (
          <h2 className="text-3xl font-bold text-center mb-8">{config.title}</h2>
        )}
        <div className="rounded-xl overflow-hidden shadow-lg">
          <iframe
            width="100%"
            height={config.height || '400px'}
            frameBorder="0"
            scrolling="no"
            marginHeight={0}
            marginWidth={0}
            src={iframeSrc}
            title="Mapa de ubicación"
            style={{ border: 0 }}
          />
        </div>
      </div>
    </section>
  );
};

const BannerBlock: React.FC<{ config: any }> = ({ config }) => {
  const { config: storeConfig } = useStoreConfig();
  
  return (
    <section 
      className="relative w-full h-[400px] bg-cover bg-center"
      style={{ backgroundImage: `url(${config.image})` }}
    >
      <div 
        className="absolute inset-0"
        style={{ backgroundColor: config.overlayColor || 'rgba(0,0,0,0.4)' }}
      />
      <div className={`relative h-full flex flex-col justify-center px-8 max-w-7xl mx-auto ${
        config.textAlign === 'center' ? 'items-center text-center' : 
        config.textAlign === 'right' ? 'items-end text-right' : 'items-start'
      }`}>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">{config.title}</h2>
        {config.subtitle && (
          <p className="text-xl text-white/90 mb-6">{config.subtitle}</p>
        )}
        {config.buttonText && (
          <a 
            href={config.buttonLink || '#'} 
            className="px-8 py-3 font-semibold transition-colors"
            style={{ 
              backgroundColor: storeConfig.colors.accent, 
              color: storeConfig.colors.primary 
            }}
          >
            {config.buttonText}
          </a>
        )}
      </div>
    </section>
  );
};

const ImageBannerBlock: React.FC<{ config: any }> = ({ config }) => {
  const content = (
    <img 
      src={config.image} 
      alt={config.alt || 'Banner'} 
      className="w-full object-cover"
      style={{ height: config.height || '300px' }}
    />
  );
  
  if (config.link) {
    return <a href={config.link} className="block">{content}</a>;
  }
  return <div>{content}</div>;
};

const TextBlock: React.FC<{ config: any }> = ({ config }) => {
  return (
    <section 
      className="py-12 px-6"
      style={{ 
        backgroundColor: config.backgroundColor || 'transparent',
        color: config.textColor || 'inherit',
        padding: config.padding || '3rem 1.5rem'
      }}
    >
      <div 
        className="max-w-4xl mx-auto prose prose-lg"
        dangerouslySetInnerHTML={{ __html: config.content || '' }}
      />
    </section>
  );
};

import { PremiumHeroBanner } from './PremiumHeroBanner';

// ... existing imports

const PremiumHeroBlock: React.FC<{ config: any }> = ({ config }) => {
  return <PremiumHeroBanner config={config} />;
};

// ... existing code

const CountdownBlock: React.FC<{ config: any }> = ({ config }) => {
  const { config: storeConfig } = useStoreConfig();
  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  React.useEffect(() => {
    const endDate = new Date(config.endDate).getTime();
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endDate - now;
      
      if (distance < 0) {
        clearInterval(timer);
        return;
      }
      
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [config.endDate]);
  
  return (
    <section 
      className="py-12 px-6 text-center"
      style={{ backgroundColor: config.backgroundColor || storeConfig.colors.accent }}
    >
      <h2 className="text-3xl font-bold mb-2" style={{ color: config.textColor || storeConfig.colors.primary }}>
        {config.title}
      </h2>
      {config.subtitle && (
        <p className="text-lg mb-6" style={{ color: config.textColor || storeConfig.colors.primary }}>
          {config.subtitle}
        </p>
      )}
      <div className="flex justify-center gap-4">
        {[
          { value: timeLeft.days, label: 'Días' },
          { value: timeLeft.hours, label: 'Horas' },
          { value: timeLeft.minutes, label: 'Min' },
          { value: timeLeft.seconds, label: 'Seg' },
        ].map((item, i) => (
          <div 
            key={i} 
            className="w-20 h-20 flex flex-col items-center justify-center rounded-lg shadow-sm"
            style={{ backgroundColor: config.boxColor || storeConfig.colors.primary }}
          >
            <span className="text-2xl font-bold" style={{ color: config.numberColor || '#ffffff' }}>{item.value}</span>
            <span className="text-xs opacity-80" style={{ color: config.numberColor || '#ffffff' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

// Social Feed Block - Instagram/TikTok embeds
const SocialFeedBlock: React.FC<{ config: any }> = ({ config }) => {
  const { config: storeConfig } = useStoreConfig();
  const embedUrls: string[] = config.urls || [];
  
  // Parse embed URLs and convert to proper embed format
  const getEmbedHtml = (url: string) => {
    // Instagram
    if (url.includes('instagram.com')) {
      // Extract post ID and create embed URL
      const embedUrl = url.replace('/reel/', '/reel/').replace('/?', '/embed/?');
      return (
        <iframe 
          src={url.includes('/embed') ? url : `${url}embed/`}
          className="instagram-embed"
          allowFullScreen
          style={{ 
            border: 'none', 
            overflow: 'hidden',
            width: '100%',
            maxWidth: '400px',
            height: '500px',
            borderRadius: '12px'
          }}
        />
      );
    }
    
    // TikTok
    if (url.includes('tiktok.com')) {
      // TikTok embeds require their script - we'll use an iframe approach
      const videoId = url.split('/video/')[1]?.split('?')[0];
      if (videoId) {
        return (
          <iframe 
            src={`https://www.tiktok.com/embed/v2/${videoId}`}
            className="tiktok-embed"
            allowFullScreen
            style={{ 
              border: 'none',
              width: '100%',
              maxWidth: '325px',
              height: '580px',
              borderRadius: '12px'
            }}
          />
        );
      }
    }
    
    // Fallback - show link
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-center"
      >
        Ver contenido →
      </a>
    );
  };

  if (embedUrls.length === 0) {
    return null;
  }

  return (
    <section className="py-12 px-6" style={{ backgroundColor: config.backgroundColor || '#f5f5f5' }}>
      <div className="max-w-6xl mx-auto">
        {config.title && (
          <h2 className="text-2xl font-bold text-center mb-8" style={{ color: storeConfig.colors.primary }}>
            {config.title}
          </h2>
        )}
        
        <div className="flex flex-wrap justify-center gap-6">
          {embedUrls.map((url: string, i: number) => (
            <div key={i} className="flex-shrink-0">
              {getEmbedHtml(url)}
            </div>
          ))}
        </div>
        
        {config.showFollowButton && config.instagramHandle && (
          <div className="text-center mt-8">
            <a
              href={`https://instagram.com/${config.instagramHandle.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-colors"
              style={{ backgroundColor: storeConfig.colors.accent, color: storeConfig.colors.primary }}
            >
              Seguinos en Instagram
            </a>
          </div>
        )}
      </div>
    </section>
  );
};

// Newsletter Block - Email subscription
const NewsletterBlock: React.FC<{ config: any }> = ({ config }) => {
  const { config: storeConfig } = useStoreConfig();
  const [email, setEmail] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      // TODO: Integrate with email service
    }
  };

  return (
    <section className="text-white py-16 px-6" style={{ backgroundColor: storeConfig.colors.primary }}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">{config.title || 'Suscribite a nuestro newsletter'}</h2>
        <p className="text-gray-400 mb-6">{config.subtitle || 'Recibí ofertas exclusivas'}</p>
        
        {submitted ? (
          <p className="text-lg" style={{ color: storeConfig.colors.accent }}>
            {config.successMessage || '¡Gracias por suscribirte!'}
          </p>
        ) : (
          <form className="flex flex-col sm:flex-row max-w-md mx-auto gap-3" onSubmit={handleSubmit}>
            <input 
              type="email" 
              placeholder={config.placeholder || 'Tu correo electrónico'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none"
              style={{ borderColor: `${storeConfig.colors.accent}50` }}
            />
            <button 
              type="submit"
              className="px-6 py-3 font-semibold transition-colors"
              style={{ backgroundColor: storeConfig.colors.accent, color: storeConfig.colors.primary }}
            >
              {config.buttonText || 'Suscribirme'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

// Video Hero Block - Full width video with overlay, gradient, text and CTA buttons
const VideoHeroBlock: React.FC<{ config: any }> = ({ config }) => {
  const { config: storeConfig } = useStoreConfig();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);
  
  // Parse video URL for embeds
  const getVideoElement = () => {
    const videoUrl = config.videoUrl || '';
    
    // YouTube - scale more to hide black bars
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      let videoId = '';
      if (videoUrl.includes('youtube.com/watch')) {
        videoId = new URL(videoUrl).searchParams.get('v') || '';
      } else if (videoUrl.includes('youtu.be/')) {
        videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0] || '';
      }
      
      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
          className="absolute pointer-events-none"
          style={{ 
            top: '50%',
            left: '50%',
            width: '180%',
            height: '180%',
            transform: 'translate(-50%, -50%)',
            minWidth: '100%',
            minHeight: '100%'
          }}
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      );
    }
    
    // Vimeo
    if (videoUrl.includes('vimeo.com')) {
      const videoId = videoUrl.split('vimeo.com/')[1]?.split('?')[0] || '';
      return (
        <iframe
          src={`https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&background=1`}
          className="absolute pointer-events-none"
          style={{ 
            top: '50%',
            left: '50%',
            width: '180%',
            height: '180%',
            transform: 'translate(-50%, -50%)'
          }}
          frameBorder="0"
          allow="autoplay"
          allowFullScreen
        />
      );
    }
    
    // Direct video file (mp4, webm, etc)
    return (
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        poster={config.posterImage}
      />
    );
  };
  
  // Gradient presets
  const getGradient = () => {
    switch (config.gradientType) {
      case 'top':
        return 'bg-gradient-to-b from-black/70 via-black/30 to-transparent';
      case 'bottom':
        return 'bg-gradient-to-t from-black/70 via-black/30 to-transparent';
      case 'left':
        return 'bg-gradient-to-r from-black/70 via-black/30 to-transparent';
      case 'right':
        return 'bg-gradient-to-l from-black/70 via-black/30 to-transparent';
      case 'center':
        return 'bg-black/40';
      case 'custom':
        return ''; // Will use inline style
      case 'none':
        return '';
      default:
        return 'bg-gradient-to-t from-black/70 via-black/30 to-transparent';
    }
  };
  
  // Content alignment
  const getContentAlignment = () => {
    switch (config.contentPosition) {
      case 'top-left':
        return 'items-start justify-start';
      case 'top-center':
        return 'items-start justify-center text-center';
      case 'top-right':
        return 'items-start justify-end text-right';
      case 'center-left':
        return 'items-center justify-start';
      case 'center':
        return 'items-center justify-center text-center';
      case 'center-right':
        return 'items-center justify-end text-right';
      case 'bottom-left':
        return 'items-end justify-start';
      case 'bottom-center':
        return 'items-end justify-center text-center';
      case 'bottom-right':
        return 'items-end justify-end text-right';
      default:
        return 'items-end justify-start'; // Default: bottom-left
    }
  };
  
  const height = config.height || '80vh';
  const minHeight = config.minHeight || '500px';
  const maxHeight = config.maxHeight || '900px';
  
  // Check if hover mode is enabled (default: true for new behavior)
  const showOnHover = config.showOnHover !== false;
  
  return (
    <section 
      className="relative overflow-hidden group"
      style={{ 
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        height,
        minHeight,
        maxHeight
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Video Background */}
      <div className="absolute inset-0 overflow-hidden">
        {getVideoElement()}
      </div>
      
      {/* Gradient Overlay - intensifies on hover */}
      <div 
        className={`absolute inset-0 transition-all duration-500 ${getGradient()}`}
        style={{
          ...(config.gradientType === 'custom' && config.customGradient ? {
            background: config.customGradient
          } : {}),
          opacity: showOnHover ? (isHovered ? 1 : 0.3) : 1
        }}
      />
      
      {/* Hover Overlay - additional darkening on hover */}
      {showOnHover && (
        <div 
          className={`absolute inset-0 bg-black/40 transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      
      {/* Color Overlay (optional) */}
      {config.overlayColor && (
        <div 
          className="absolute inset-0 transition-opacity duration-500"
          style={{ 
            backgroundColor: config.overlayColor,
            opacity: showOnHover ? (isHovered ? 1 : 0.5) : 1
          }}
        />
      )}
      
      {/* Content - appears on hover with animation */}
      <div 
        className={`relative z-10 h-full flex flex-col ${getContentAlignment()} px-6 md:px-12 lg:px-16 py-12 md:py-16 transition-all duration-500 ${
          showOnHover 
            ? isHovered 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
            : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="max-w-3xl">
          {/* Pre-title / Tag */}
          {config.pretitle && (
            <span 
              className={`inline-block text-sm md:text-base font-medium mb-3 px-3 py-1 rounded-full transition-all duration-500 delay-100 ${
                showOnHover && !isHovered ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'
              }`}
              style={{ 
                backgroundColor: config.pretitleBg || 'rgba(255,255,255,0.2)',
                color: config.pretitleColor || '#ffffff'
              }}
            >
              {config.pretitle}
            </span>
          )}
          
          {/* Main Title */}
          {config.title && (
            <h1 
              className={`text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight transition-all duration-500 delay-150 ${
                showOnHover && !isHovered ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'
              }`}
              style={{ color: config.titleColor || '#ffffff' }}
            >
              {config.title}
            </h1>
          )}
          
          {/* Subtitle */}
          {config.subtitle && (
            <p 
              className={`text-lg md:text-xl lg:text-2xl mb-8 opacity-90 max-w-2xl transition-all duration-500 delay-200 ${
                showOnHover && !isHovered ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'
              }`}
              style={{ color: config.subtitleColor || 'rgba(255,255,255,0.9)' }}
            >
              {config.subtitle}
            </p>
          )}
          
          {/* Action Buttons */}
          {(config.primaryButtonText || config.secondaryButtonText) && (
            <div 
              className={`flex flex-wrap gap-4 transition-all duration-500 delay-300 ${
                config.contentPosition?.includes('center') ? 'justify-center' : config.contentPosition?.includes('right') ? 'justify-end' : 'justify-start'
              } ${showOnHover && !isHovered ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
            >
              {/* Primary Button */}
              {config.primaryButtonText && (
                <a
                  href={config.primaryButtonLink || '#'}
                  className="inline-flex items-center gap-2 px-8 py-4 font-semibold text-base md:text-lg rounded-lg transition-all hover:scale-105 hover:shadow-lg"
                  style={{ 
                    backgroundColor: config.primaryButtonBg || storeConfig.colors.accent,
                    color: config.primaryButtonColor || storeConfig.colors.primary
                  }}
                  onClick={(e) => {
                    if (config.primaryButtonLink === '#productos') {
                      e.preventDefault();
                      const el = document.getElementById('productos');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    } else if (config.primaryButtonLink === 'whatsapp') {
                      e.preventDefault();
                      const msg = encodeURIComponent(config.whatsappMessage || 'Hola! Quiero consultar');
                      window.open(`https://wa.me/${storeConfig.whatsapp?.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
                    }
                  }}
                >
                  {config.primaryButtonText}
                  {config.showArrow !== false && <span>→</span>}
                </a>
              )}
              
              {/* Secondary Button */}
              {config.secondaryButtonText && (
                <a
                  href={config.secondaryButtonLink || '#'}
                  className="inline-flex items-center gap-2 px-8 py-4 font-semibold text-base md:text-lg rounded-lg border-2 transition-all hover:scale-105"
                  style={{ 
                    borderColor: config.secondaryButtonBorder || 'rgba(255,255,255,0.5)',
                    color: config.secondaryButtonColor || '#ffffff',
                    backgroundColor: config.secondaryButtonBg || 'transparent'
                  }}
                  onClick={(e) => {
                    if (config.secondaryButtonLink === '#productos') {
                      e.preventDefault();
                      const el = document.getElementById('productos');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  {config.secondaryButtonText}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Scroll indicator (optional) */}
      {config.showScrollIndicator && (
        <div className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce transition-opacity duration-300 ${
          showOnHover && !isHovered ? 'opacity-30' : 'opacity-100'
        }`}>
          <div className="w-8 h-12 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/80 rounded-full animate-pulse" />
          </div>
        </div>
      )}
    </section>
  );
};

// Layout Block - Multi-column layouts
const LayoutBlock: React.FC<{ config: any; type: string }> = ({ config, type }) => {
  const { config: storeConfig } = useStoreConfig();
  const slots = config.slots || [];
  
  // Determine grid classes based on layout type
  const getGridClasses = () => {
    switch (type) {
      case 'two-column':
        return 'grid-cols-1 md:grid-cols-2';
      case 'three-column':
        return 'grid-cols-1 md:grid-cols-3';
      case 'asymmetric-left':
        return 'grid-cols-1 md:grid-cols-3'; // Will use col-span for 1/3 - 2/3
      case 'asymmetric-right':
        return 'grid-cols-1 md:grid-cols-3'; // Will use col-span for 2/3 - 1/3
      default:
        return 'grid-cols-1 md:grid-cols-2';
    }
  };

  // Get slot column span for asymmetric layouts
  const getSlotClasses = (index: number) => {
    if (type === 'asymmetric-left') {
      return index === 0 ? 'md:col-span-1' : 'md:col-span-2';
    }
    if (type === 'asymmetric-right') {
      return index === 0 ? 'md:col-span-2' : 'md:col-span-1';
    }
    return '';
  };

  // Render individual slot content
  const renderSlot = (slot: any, index: number) => {
    // Text slot - user-friendly version
    if (slot.type === 'text' || (!slot.type && slot.title)) {
      const alignment = {
        'left': 'text-left items-start',
        'center': 'text-center items-center',
        'right': 'text-right items-end',
      }[slot.textAlign || 'center'];

      return (
        <div 
          className={`h-full flex flex-col justify-center p-8 ${alignment}`}
          style={{ 
            backgroundColor: slot.backgroundColor || '#f3f4f6',
            color: slot.textColor || '#1f2937'
          }}
        >
          {slot.title && (
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              {slot.title}
            </h3>
          )}
          {slot.body && (
            <p className="text-base md:text-lg opacity-80 mb-6 max-w-md">
              {slot.body}
            </p>
          )}
          {slot.showButton && slot.buttonText && (
            <a 
              href={slot.buttonLink || '#'}
              className="inline-block px-6 py-3 font-semibold rounded-lg transition-transform hover:scale-105"
              style={{ 
                backgroundColor: storeConfig.colors.accent, 
                color: storeConfig.colors.primary 
              }}
            >
              {slot.buttonText}
            </a>
          )}
          {!slot.title && !slot.body && (
            <p className="text-gray-400">Contenido vacío</p>
          )}
        </div>
      );
    }

    // Legacy HTML slot
    if (slot.type === 'html') {
      return (
        <div 
          className="prose max-w-none h-full flex items-center justify-center p-6 bg-white"
          dangerouslySetInnerHTML={{ __html: slot.content || '<p class="text-gray-400">Contenido vacío</p>' }}
        />
      );
    }

    if (slot.type === 'image') {
      const overlayPosition = {
        'center': 'items-center justify-center text-center',
        'bottom-left': 'items-end justify-start pb-4 pl-4 text-left',
        'bottom-center': 'items-end justify-center pb-4 text-center',
        'bottom-right': 'items-end justify-end pb-4 pr-4 text-right',
      }[slot.overlayPosition || 'center'];

      const overlayGradient = {
        'dark': 'bg-gradient-to-t from-black/70 via-black/30 to-transparent',
        'light': 'bg-gradient-to-t from-white/70 via-white/30 to-transparent',
        'accent': `bg-gradient-to-t from-[var(--color-accent)]/70 via-transparent to-transparent`,
        'none': '',
      }[slot.overlayGradient || 'dark'];

      const imageContent = (
        <div className="relative group overflow-hidden h-full min-h-[200px]">
          <img 
            src={slot.imageUrl} 
            alt={slot.overlayTitle || 'Imagen'} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Overlay with gradient and text */}
          {slot.showOverlay && (
            <div className={`absolute inset-0 flex ${overlayPosition} ${overlayGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6`}>
              <div>
                {slot.overlayTitle && (
                  <h3 className={`text-2xl font-bold ${slot.overlayGradient === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {slot.overlayTitle}
                  </h3>
                )}
                {slot.overlaySubtitle && (
                  <p className={`text-sm mt-1 ${slot.overlayGradient === 'light' ? 'text-gray-700' : 'text-white/90'}`}>
                    {slot.overlaySubtitle}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Always visible gradient for readability */}
          {!slot.showOverlay && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          )}

          {/* CTA Button */}
          {slot.showCTA && slot.ctaText && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <a 
                href={slot.ctaLink || '#'}
                className="px-6 py-3 font-semibold rounded-lg shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                style={{ 
                  backgroundColor: storeConfig.colors.accent, 
                  color: storeConfig.colors.primary 
                }}
              >
                {slot.ctaText}
              </a>
            </div>
          )}
        </div>
      );

      if (slot.imageLink) {
        return <a href={slot.imageLink} className="block h-full">{imageContent}</a>;
      }
      return imageContent;
    }

    if (slot.type === 'video') {
      // Parse YouTube/Vimeo URL
      let embedUrl = slot.videoUrl || '';
      if (embedUrl.includes('youtube.com/watch')) {
        const videoId = new URL(embedUrl).searchParams.get('v');
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (embedUrl.includes('youtu.be/')) {
        const videoId = embedUrl.split('youtu.be/')[1]?.split('?')[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (embedUrl.includes('vimeo.com/')) {
        const videoId = embedUrl.split('vimeo.com/')[1]?.split('?')[0];
        embedUrl = `https://player.vimeo.com/video/${videoId}`;
      }

      return (
        <div className="relative aspect-video">
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    if (slot.type === 'product') {
      // For now, show a placeholder - would need product data
      return (
        <div className="bg-gray-100 h-full min-h-[200px] flex items-center justify-center text-gray-500">
          <p>Producto: {slot.productId || 'Sin ID'}</p>
        </div>
      );
    }

    return null;
  };

  if (slots.length === 0) {
    return null;
  }

  // Determine min height based on layout type
  const getSlotMinHeight = () => {
    switch (type) {
      case 'two-column':
        return '350px'; // Match promo cards height
      case 'three-column':
        return '280px';
      default:
        return '300px';
    }
  };

  return (
    <section 
      className="py-6 px-4"
      style={{ backgroundColor: config.backgroundColor || 'transparent' }}
    >
      <div className="max-w-7xl mx-auto">
        <div 
          className={`grid ${getGridClasses()}`}
          style={{ gap: config.gap || '1rem' }}
        >
          {slots.map((slot: any, index: number) => (
            <div 
              key={index} 
              className={`${getSlotClasses(index)} overflow-hidden rounded-xl bg-gray-100`}
              style={{ minHeight: getSlotMinHeight() }}
            >
              {renderSlot(slot, index)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Main BlockRenderer component
export const BlockRenderer: React.FC<BlockRendererProps> = ({ block }) => {
  if (!block.isActive) return null;
  
  switch (block.type) {
    case 'hero-slider':
      return <HeroBlock config={block.config} />;
    case 'features':
      return <FeaturesBlock config={block.config} />;
    case 'promo-cards':
      return <PromoCardsBlock config={block.config} />;
    case 'categories':
      return <CategoriesBlock config={block.config} />;
    case 'product-grid':
      return <ProductGridBlock config={block.config} />;
    case 'bestsellers':
      return <BestsellersBlock config={block.config} />;
    case 'banner':
      return <BannerBlock config={block.config} />;
    case 'image-banner':
      return <ImageBannerBlock config={block.config} />;
    case 'text-block':
      return <TextBlock config={block.config} />;
    case 'countdown':
      return <CountdownBlock config={block.config} />;
    case 'social-feed':
      return <SocialFeedBlock config={block.config} />;
    case 'popup':
      // Popups are rendered but don't take space in the layout
      return <PopupRenderer config={block.config as PopupConfig} blockId={block.id} />;
    case 'newsletter':
      return <NewsletterBlock config={block.config} />;
    case 'video-hero':
      return <VideoHeroBlock config={block.config} />;
    case 'premium_hero':
      return <PremiumHeroBlock config={block.config} />;
    case 'map':
      return <MapBlock config={block.config} />;
    // Layout blocks
    case 'two-column':
    case 'three-column':
    case 'asymmetric-left':
    case 'asymmetric-right':
      return <LayoutBlock config={block.config} type={block.type} />;
    default:
      return null;
  }
};

// Render all active blocks in order
export const HomepageRenderer: React.FC = () => {
  // Import inside to avoid circular dependency
  const { useHomepageBlocks } = require('../../context/StoreContext');
  const { blocks } = useHomepageBlocks();
  
  return (
    <>
      {blocks.map((block: HomepageBlock) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </>
  );
};
