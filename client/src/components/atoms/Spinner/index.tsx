import React from 'react';
import { Loader2 } from 'lucide-react';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  color?: string;
}

const sizeMap: Record<SpinnerSize, number> = {
  xs: 12,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className = '',
  color,
}) => {
  return (
    <Loader2
      className={`animate-spin ${className}`}
      size={sizeMap[size]}
      style={color ? { color } : undefined}
    />
  );
};

// Orbit-style animated spinner for loading screens
export const OrbitSpinner: React.FC<{ size?: number; className?: string }> = ({
  size = 48,
  className = '',
}) => {
  return (
    <div
      className={`orbit-spinner ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="orbit" />
      <div className="orbit" />
      <div className="orbit" />
      <style>{`
        .orbit-spinner {
          position: relative;
        }
        .orbit-spinner .orbit {
          position: absolute;
          inset: 0;
          border: 2px solid transparent;
          border-top-color: var(--color-accent);
          border-radius: 50%;
          animation: orbit-spin 1.2s linear infinite;
        }
        .orbit-spinner .orbit:nth-child(2) {
          inset: 4px;
          animation-delay: 0.1s;
          border-top-color: var(--color-primary);
        }
        .orbit-spinner .orbit:nth-child(3) {
          inset: 8px;
          animation-delay: 0.2s;
          border-top-color: var(--color-gray-400);
        }
        @keyframes orbit-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Spinner;
