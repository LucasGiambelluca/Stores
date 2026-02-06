import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';
import { useStoreConfig } from '../../context/StoreContext';

interface PremiumHeroBannerProps {
  config: {
    // Content
    title?: string;
    subtitle?: string;
    pretitle?: string;
    buttonText?: string;
    buttonLink?: string;
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
    
    // Media
    backgroundImage?: string;
    videoUrl?: string; // YouTube, Vimeo, or direct MP4
    posterImage?: string;
    
    // Style
    height?: string;
    overlayColor?: string;
    overlayOpacity?: number;
    gradientType?: 'none' | 'top' | 'bottom' | 'left' | 'right' | 'center';
    contentPosition?: 'left' | 'center' | 'right';
    textAlign?: 'left' | 'center' | 'right';
    
    // Effects
    parallaxIntensity?: number; // 0 to 100
    enableTilt?: boolean;
    enableTextReveal?: boolean;
    enableScrollIndicator?: boolean;
  };
}

export const PremiumHeroBanner: React.FC<PremiumHeroBannerProps> = ({ config }) => {
  const { config: storeConfig } = useStoreConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Parallax Effect
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", `${config.parallaxIntensity || 30}%`]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  // 3D Tilt Effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!config.enableTilt) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };
  
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), { stiffness: 150, damping: 20 });
  
  // Video Handling
  const getVideoElement = () => {
    const videoUrl = config.videoUrl || '';
    
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
          className="absolute w-[150%] h-[150%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          frameBorder="0"
          allow="autoplay; encrypted-media"
        />
      );
    }
    
    return (
      <video
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
        className="absolute w-full h-full object-cover"
        poster={config.posterImage}
      />
    );
  };

  // Text Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden w-full perspective-1000"
      style={{ height: config.height || '85vh', minHeight: '600px' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Layer with Parallax */}
      <motion.div 
        className="absolute inset-0 z-0"
        style={{ y, scale }}
      >
        {config.videoUrl ? (
          getVideoElement()
        ) : (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${config.backgroundImage})` }}
          />
        )}
        
        {/* Overlays */}
        <div 
          className="absolute inset-0 transition-colors duration-500"
          style={{ 
            backgroundColor: config.overlayColor || '#000', 
            opacity: config.overlayOpacity ?? 0.4 
          }} 
        />
        
        {/* Gradient */}
        <div className={`absolute inset-0 ${
          config.gradientType === 'top' ? 'bg-gradient-to-b from-black/80 to-transparent' :
          config.gradientType === 'bottom' ? 'bg-gradient-to-t from-black/80 to-transparent' :
          config.gradientType === 'left' ? 'bg-gradient-to-r from-black/80 to-transparent' :
          config.gradientType === 'right' ? 'bg-gradient-to-l from-black/80 to-transparent' :
          config.gradientType === 'center' ? 'bg-radial-gradient from-transparent to-black/80' : ''
        }`} />
      </motion.div>

      {/* Content Layer with 3D Tilt */}
      <motion.div 
        className="relative z-10 h-full flex flex-col justify-center px-6 md:px-12 max-w-7xl mx-auto"
        style={{
          rotateX: config.enableTilt ? rotateX : 0,
          rotateY: config.enableTilt ? rotateY : 0,
          alignItems: config.contentPosition === 'center' ? 'center' : config.contentPosition === 'right' ? 'flex-end' : 'flex-start',
          textAlign: config.textAlign || 'left'
        }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-3xl"
        >
          {/* Pretitle */}
          {config.pretitle && (
            <motion.div variants={itemVariants} className="mb-4">
              <span 
                className="inline-block px-4 py-1 rounded-full text-sm font-medium tracking-wider uppercase backdrop-blur-md"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.1)', 
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                {config.pretitle}
              </span>
            </motion.div>
          )}

          {/* Title */}
          {config.title && (
            <motion.h1 
              variants={itemVariants}
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
              style={{ textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
            >
              {config.enableTextReveal ? (
                config.title.split(" ").map((word, i) => (
                  <motion.span
                    key={i}
                    className="inline-block mr-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 + 0.5 }}
                  >
                    {word}
                  </motion.span>
                ))
              ) : (
                config.title
              )}
            </motion.h1>
          )}

          {/* Subtitle */}
          {config.subtitle && (
            <motion.p 
              variants={itemVariants}
              className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed max-w-2xl"
            >
              {config.subtitle}
            </motion.p>
          )}

          {/* Buttons */}
          <motion.div variants={itemVariants} className="flex flex-wrap gap-4" style={{
            justifyContent: config.textAlign === 'center' ? 'center' : config.textAlign === 'right' ? 'flex-end' : 'flex-start'
          }}>
            {config.buttonText && (
              <motion.a
                href={config.buttonLink || '#'}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl"
                style={{ 
                  backgroundColor: storeConfig.colors.accent, 
                  color: storeConfig.colors.primary 
                }}
              >
                {config.buttonText}
              </motion.a>
            )}
            
            {config.secondaryButtonText && (
              <motion.a
                href={config.secondaryButtonLink || '#'}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-full font-bold text-lg transition-all border-2 border-white/30 text-white backdrop-blur-sm"
              >
                {config.secondaryButtonText}
              </motion.a>
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      {config.enableScrollIndicator && (
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ delay: 2, duration: 2, repeat: Infinity }}
        >
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent" />
        </motion.div>
      )}
    </div>
  );
};
