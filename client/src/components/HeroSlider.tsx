import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Truck, CreditCard, Banknote, RefreshCcw, ArrowRight, Sparkles, MessageCircle } from 'lucide-react';
import { useBanners, usePromoCards, useStoreConfig, useCategories } from '../context/StoreContext';

export const HeroSlider: React.FC<{ config?: any }> = ({ config }) => {
  const { banners } = useBanners();
  const activeBanners = banners.filter(b => b.isActive !== false);
  console.log('[HeroSlider] banners:', banners);
  console.log('[HeroSlider] activeBanners:', activeBanners);
  const [current, setCurrent] = useState(0);

  const slides = activeBanners;
  const height = config?.height || '600px';

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const prevSlide = () => {
    setCurrent(current === 0 ? slides.length - 1 : current - 1);
  };

  const nextSlide = () => {
    setCurrent((current + 1) % slides.length);
  };

  if (slides.length === 0) {
    return null;
  }

  return (
    <section className="hm-hero" style={{ height: height, minHeight: height }}>
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`hm-hero-slide ${index === current ? 'active' : ''}`}
        >
          <img
            src={slide.image}
            alt={slide.title || 'Banner'}
            className="hm-hero-image"
          />
          <div className="hm-hero-content">
            {slide.title && (
              <h2 className="hm-hero-title animate-slide-up">
                {slide.title}
              </h2>
            )}
            {slide.subtitle && (
              <p className="hm-hero-subtitle animate-slide-up" style={{ animationDelay: '100ms' }}>
                {slide.subtitle}
              </p>
            )}
            {slide.buttonText && (
              <a 
                href={slide.buttonLink || '#productos'} 
                className="hm-hero-btn animate-slide-up" 
                style={{ animationDelay: '200ms' }}
              >
                {slide.buttonText}
              </a>
            )}
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="hm-hero-arrow prev"
            aria-label="Anterior"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextSlide}
            className="hm-hero-arrow next"
            aria-label="Siguiente"
          >
            <ChevronRight size={24} />
          </button>

          {/* Dots Navigation */}
          <div className="hm-hero-nav">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={`hm-hero-dot ${index === current ? 'active' : ''}`}
                aria-label={`Ir a slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

// Features/Benefits Section with dynamic config
export const FeaturesSection: React.FC = () => {
  const { config } = useStoreConfig();

  const features = [
    {
      icon: Truck,
      title: 'Envío Gratis',
      description: `En compras mayores a $${config.freeShippingFrom.toLocaleString('es-AR')}`
    },
    {
      icon: CreditCard,
      title: `${config.installments} Cuotas`,
      description: 'Sin interés con tarjeta'
    },
    {
      icon: Banknote,
      title: `${config.transferDiscount} OFF`,
      description: 'Pagando con transferencia'
    },
    {
      icon: RefreshCcw,
      title: 'Devolución',
      description: `${config.returnDays} días para cambios`
    }
  ];

  return (
    <section className="bg-white py-8 border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-2">
                  <IconComponent size={28} strokeWidth={1.5} className="text-gray-700" />
                </div>
                <h3 className="font-bold text-sm uppercase tracking-wide">{feature.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ============================================
// PROMO SECTION - Uses dynamic promo cards with slider
// Supports up to 2 sets of promo cards (6 cards total)
// ============================================
export const PromoSection: React.FC = () => {
  const { promoCards } = usePromoCards();
  const { config } = useStoreConfig();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const scrollToProducts = () => {
    const el = document.getElementById('productos');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent('Hola! Quiero consultar por precios mayoristas');
    window.open(`https://wa.me/${config.whatsapp.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  // Default promo cards if none configured
  const cards = promoCards.length > 0 ? promoCards : [
    {
      id: '1',
      type: 'large' as const,
      title: 'NEW DROP',
      subtitle: 'Remeras desde $6.500',
      image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200',
      buttonText: 'Ver Colección',
      buttonLink: '#productos',
      order: 1,
      isActive: true,
    },
    {
      id: '2',
      type: 'small' as const,
      title: '¿Querés estampar?',
      subtitle: 'tus remeras?',
      image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800',
      buttonText: 'Consultar',
      buttonLink: 'whatsapp',
      order: 2,
      isActive: true,
    },
    {
      id: '3',
      type: 'small' as const,
      title: 'TODOS NUESTROS PRODUCTOS',
      subtitle: 'xmenosmasprendas.com',
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
      buttonText: 'Ver todo',
      buttonLink: '#productos',
      order: 3,
      isActive: true,
    },
  ];

  // Sort cards by order
  const sortedCards = [...cards].sort((a, b) => a.order - b.order);

  // Group cards into slides (each slide = 1 large + 2 small = 3 cards)
  // A "large" card starts a new slide group, or every 3 cards
  const slides: typeof cards[] = [];
  let currentGroup: typeof cards = [];
  
  for (const card of sortedCards) {
    if (card.type === 'large' && currentGroup.length > 0) {
      // Start new slide when encountering a large card (if current group has content)
      slides.push(currentGroup);
      currentGroup = [card];
    } else {
      currentGroup.push(card);
      // If we have 3 cards or this is the last card, close the group
      if (currentGroup.length === 3) {
        slides.push(currentGroup);
        currentGroup = [];
      }
    }
  }
  
  // Push any remaining cards
  if (currentGroup.length > 0) {
    slides.push(currentGroup);
  }

  // Limit to 2 slides maximum
  const limitedSlides = slides.slice(0, 2);
  const totalSlides = limitedSlides.length;

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setHoveredCard(null);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
    setHoveredCard(null);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
    setHoveredCard(null);
  };

  // Render a single slide
  const renderSlide = (slideCards: typeof cards, slideIndex: number) => {
    const largeCard = slideCards.find(c => c.type === 'large') || slideCards[0];
    const smallCards = slideCards.filter(c => c.type !== 'large' || c.id !== largeCard.id).slice(0, 2);
    const baseIndex = slideIndex * 10; // Unique index for hover state

    return (
      <div 
        key={slideIndex}
        className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6"
        style={{
          display: currentSlide === slideIndex ? 'grid' : 'none',
          animation: currentSlide === slideIndex ? 'fadeIn 0.5s ease-out' : 'none',
        }}
      >
        {/* Card 1: Large Left */}
        <div 
          className="md:col-span-7 relative overflow-hidden group cursor-pointer"
          style={{ minHeight: '400px' }}
          onMouseEnter={() => setHoveredCard(baseIndex + 1)}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={scrollToProducts}
        >
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
            style={{ 
              backgroundImage: `url(${largeCard.image})`,
              transform: hoveredCard === baseIndex + 1 ? 'scale(1.05)' : 'scale(1)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          {/* Badge */}
          <div className="absolute top-6 left-6 flex items-center gap-2 bg-white text-black px-4 py-2">
            <Sparkles size={18} className="animate-pulse" />
            <span className="text-sm font-bold tracking-wider">{largeCard.title}</span>
          </div>
          
          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <h3 className="text-4xl md:text-5xl font-bold text-white mb-2" style={{ lineHeight: 1.1 }}>
              {largeCard.subtitle}
            </h3>
            
            <div 
              className="inline-flex items-center gap-2 text-white border-b-2 border-white pb-1 transition-all"
              style={{ 
                transform: hoveredCard === baseIndex + 1 ? 'translateX(8px)' : 'translateX(0)',
                transition: 'transform 0.3s ease'
              }}
            >
              <span className="font-semibold">{largeCard.buttonText}</span>
              <ArrowRight size={18} />
            </div>
          </div>
        </div>

        {/* Right Column - Small Cards */}
        <div className="md:col-span-5 flex flex-col gap-4 md:gap-6">
          {smallCards.map((card, index) => (
            <div 
              key={card.id}
              className="relative overflow-hidden flex-1 group cursor-pointer"
              style={{ minHeight: '190px' }}
              onMouseEnter={() => setHoveredCard(baseIndex + index + 2)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={card.buttonLink === 'whatsapp' ? openWhatsApp : scrollToProducts}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
                style={{ 
                  backgroundImage: `url(${card.image})`,
                  transform: hoveredCard === baseIndex + index + 2 ? 'scale(1.05)' : 'scale(1)'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-l from-black/70 to-transparent" />
              
              <div className="absolute inset-0 flex items-center justify-end p-6">
                <div className="text-right">
                  <p className="text-white/80 text-sm mb-1">{card.title}</p>
                  <h3 className="text-2xl md:text-3xl font-bold text-white">{card.subtitle}</h3>
                  
                  {card.buttonLink === 'whatsapp' ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); openWhatsApp(); }}
                      className="mt-4 bg-white text-black px-4 py-2 text-sm font-semibold flex items-center gap-2 ml-auto hover:bg-gray-100 transition-colors"
                    >
                      <MessageCircle size={16} />
                      {card.buttonText}
                    </button>
                  ) : (
                    <div 
                      className="mt-4 inline-flex items-center gap-2 text-white font-semibold"
                      style={{ 
                        transform: hoveredCard === baseIndex + index + 2 ? 'translateX(8px)' : 'translateX(0)',
                        transition: 'transform 0.3s ease'
                      }}
                    >
                      <span>{card.buttonText}</span>
                      <ArrowRight size={18} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Fill empty space if only 1 small card */}
          {smallCards.length === 1 && (
            <div 
              className="relative overflow-hidden flex-1 bg-gray-200"
              style={{ minHeight: '190px' }}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="py-12 px-4 max-w-6xl mx-auto">
      {/* Render all slides */}
      {limitedSlides.map((slideCards, index) => renderSlide(slideCards, index))}

      {/* Navigation - Only show if more than 1 slide */}
      {totalSlides > 1 && (
        <>
          {/* Navigation Arrows */}
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={prevSlide}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={nextSlide}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Siguiente"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Dots Navigation */}
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-2">
              {limitedSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    currentSlide === index 
                      ? 'bg-gray-800 w-6' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Ir a slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Single slide indicator (3 dots animation) */}
      {totalSlides === 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center gap-1">
            {[0, 1, 2].map(i => (
              <div 
                key={i}
                className="w-2 h-2 rounded-full bg-gray-300"
                style={{
                  animation: 'pulse 1.5s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

// Category Cards Section - Dynamic from useCategories
interface CategoryCardProps {
  image: string;
  title: string;
  count: number;
  link?: string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ image, title, count, link = '#productos' }) => (
  <a href={link} className="hm-category-card group">
    <img src={image} alt={title} className="transition-transform duration-500 group-hover:scale-105" />
    <div className="hm-category-card-content">
      <h3 className="hm-category-card-title">{title}</h3>
      <p className="text-white/80 text-sm mt-1">{count} productos</p>
    </div>
  </a>
);

export const CategorySection: React.FC = () => {
  const { categories } = useCategories();

  // Filter active categories with images
  const displayCategories = categories
    .filter(cat => cat.isActive !== false && cat.image)
    .slice(0, 4);

  if (displayCategories.length === 0) return null;

  return (
    <section className="py-12 px-4 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-2">Categorías</h2>
      <p className="text-gray-500 text-center mb-8">Explorá nuestro catálogo por categoría</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {displayCategories.map((cat) => (
          <CategoryCard 
            key={cat.id} 
            image={cat.image || ''}
            title={cat.name}
            count={cat.productCount || 0}
          />
        ))}
      </div>
    </section>
  );
};