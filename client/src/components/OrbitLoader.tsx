import React from 'react';
import { useStoreConfig } from '../context/StoreContext';

interface OrbitLoaderProps {
  /** Size of the loader: 'sm' (40px), 'md' (80px), 'lg' (120px), or custom number */
  size?: 'sm' | 'md' | 'lg' | number;
  /** Show the pulsing logo in the center */
  showLogo?: boolean;
  /** Optional text to display below the loader */
  text?: string;
  /** Makes the loader fill its container and center itself */
  fullscreen?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * OrbitLoader - A modern spinning loader with the store logo
 * 
 * Uses the store's accent color from config and displays
 * the store logo in the center with a pulsing animation.
 */
export const OrbitLoader: React.FC<OrbitLoaderProps> = ({
  size = 'md',
  showLogo = true,
  text,
  fullscreen = false,
  className = '',
}) => {
  const { config } = useStoreConfig();

  // Calculate actual size in pixels
  const sizeMap = { sm: 40, md: 80, lg: 120 };
  const actualSize = typeof size === 'number' ? size : sizeMap[size];
  const logoSize = actualSize * 0.5; // Logo is 50% of container
  const ringWidth = Math.max(2, actualSize * 0.03); // Ring thickness scales with size

  const containerStyle: React.CSSProperties = {
    width: actualSize,
    height: actualSize,
  };

  const ringStyle: React.CSSProperties = {
    borderWidth: ringWidth,
  };

  const logoStyle: React.CSSProperties = {
    width: logoSize,
    height: logoSize,
  };

  return (
    <div className={`orbit-loader-wrapper ${fullscreen ? 'orbit-loader-fullscreen' : ''} ${className}`}>
      <div className="orbit-loader-container" style={containerStyle}>
        {/* Spinning Ring */}
        <div className="orbit-spinner-ring" style={ringStyle} />
        
        {/* Optional Secondary Ring (subtle) */}
        <div className="orbit-spinner-ring-secondary" style={ringStyle} />
        
        {/* Center Logo */}
        {showLogo && (
          <div className="orbit-logo-center" style={logoStyle}>
            <img 
              src={config.logo || '/logo.webp'} 
              alt={config.name || 'Cargando...'}
              onError={(e) => {
                // Fallback if logo fails to load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
      
      {/* Optional Loading Text */}
      {text && <p className="orbit-loader-text">{text}</p>}
    </div>
  );
};

/**
 * Simple inline spinner without logo (for buttons, small spaces)
 */
export const InlineSpinner: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = '' 
}) => {
  const ringWidth = Math.max(2, size * 0.1);
  
  return (
    <div 
      className={`orbit-inline-spinner ${className}`}
      style={{ 
        width: size, 
        height: size,
        borderWidth: ringWidth,
      }}
    />
  );
};

export default OrbitLoader;
