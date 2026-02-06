import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useStoreConfig } from '../context/StoreContext';

interface ThemeToggleProps {
  variant?: 'floating' | 'inline';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'inline' }) => {
  const { config } = useStoreConfig();
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage or default to Light
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      // Default to LIGHT as per user request (ignoring system preference)
      return false; 
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Don't render if explicitly disabled in config
  if (config.showDarkModeToggle === false) {
    return null;
  }

  // Inline version for navbar
  if (variant === 'inline') {
    return (
      <button
        onClick={() => setIsDark(!isDark)}
        className="hm-icon-btn hidden sm:flex"
        aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
        title={isDark ? 'Modo claro' : 'Modo oscuro'}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    );
  }

  // Floating version (legacy)
  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="theme-toggle"
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};
