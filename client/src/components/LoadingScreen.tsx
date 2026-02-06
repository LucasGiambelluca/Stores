import React, { useState, useEffect, useRef } from 'react';
import { useStoreConfig } from '../context/StoreContext';

interface LoadingScreenProps {
  onComplete: () => void;
  duration?: number; // Duration in ms before auto-skip
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  onComplete, 
  duration = 6000 // 6 seconds default
}) => {
  const { config } = useStoreConfig();
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // YouTube video ID from URL (can be configured later)
  const videoId = 'nkDLssObY_M';

  useEffect(() => {
    // Show content after brief delay for smooth entrance
    setTimeout(() => setShowContent(true), 100);

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + (100 / (duration / 50));
      });
    }, 50);

    // Auto-complete after duration
    timerRef.current = setTimeout(() => {
      handleExit();
    }, duration);

    return () => {
      clearInterval(progressInterval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [duration]);

  const handleExit = () => {
    if (isExiting) return;
    setIsExiting(true);
    
    // Wait for exit animation
    setTimeout(() => {
      onComplete();
    }, 800);
  };

  return (
    <div 
      className={`loading-screen ${isExiting ? 'exiting' : ''} ${showContent ? 'visible' : ''}`}
      onClick={handleExit}
    >
      {/* Video Background */}
      <div className="loading-video-container">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1`}
          title={config.name}
          allow="autoplay; encrypted-media"
          className="loading-video"
        />
        <div className="loading-video-overlay" />
      </div>

      {/* Content */}
      <div className="loading-content">
        {/* Logo - Use config logo or fallback */}
        <div className={`loading-logo ${showContent ? 'animate' : ''}`}>
          <img 
            src={config.logo || '/logo.webp'}
            alt={config.name}
          />
        </div>

        {/* Brand Tagline - Use config tagline */}
        <p className={`loading-tagline ${showContent ? 'animate' : ''}`}>
          {config.tagline || 'Bienvenido'}
        </p>

        {/* Progress Bar */}
        <div className={`loading-progress-container ${showContent ? 'animate' : ''}`}>
          <div 
            className="loading-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Skip Text */}
        <p className={`loading-skip ${showContent ? 'animate' : ''}`}>
          Click para continuar
        </p>
      </div>

      {/* Decorative Elements */}
      <div className="loading-corner loading-corner-tl" />
      <div className="loading-corner loading-corner-tr" />
      <div className="loading-corner loading-corner-bl" />
      <div className="loading-corner loading-corner-br" />
    </div>
  );
};
