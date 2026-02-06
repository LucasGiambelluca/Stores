/**
 * Store Config Context
 * Provides store branding, address, social links, and theme from the API
 * This makes the template fully reusable for different stores
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getStoreHeaders, buildApiUrl } from '../utils/storeDetection';

interface StoreInfo {
  name: string;
  description: string;
  slogan: string | null;
  logo: string | null;
  favicon: string | null;
  email: string | null;
  phone: string | null;
  url: string;
}

interface AddressInfo {
  street: string | null;
  city: string | null;
  province: string | null;
  postal: string | null;
  full: string | null;
}

interface SocialInfo {
  whatsapp: string | null;
  whatsappUrl: string | null;
  instagram: string | null;
  instagramUrl: string | null;
  facebook: string | null;
  facebookUrl: string | null;
  tiktok: string | null;
  tiktokUrl: string | null;
}

interface ThemeInfo {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  iconColor: string;
}

interface StoreConfig {
  store: StoreInfo;
  address: AddressInfo;
  social: SocialInfo;
  theme: ThemeInfo;
  isLoading: boolean;
}

// Default values (used while loading)
const defaultConfig: StoreConfig = {
  store: {
    name: '',
    description: 'Tu tienda online',
    slogan: null,
    logo: null,
    favicon: null,
    email: null,
    phone: null,
    url: 'http://localhost:3000',
  },
  address: {
    street: null,
    city: null,
    province: null,
    postal: null,
    full: null,
  },
  social: {
    whatsapp: null,
    whatsappUrl: null,
    instagram: null,
    instagramUrl: null,
    facebook: null,
    facebookUrl: null,
    tiktok: null,
    tiktokUrl: null,
  },
  theme: {
    primaryColor: '#E5B800',
    secondaryColor: '#1a1a1a',
    accentColor: '#10B981',
    backgroundColor: '#0a0a0a',
    textColor: '#ffffff',
    iconColor: '#E5B800',
  },
  isLoading: true,
};

const StoreConfigContext = createContext<StoreConfig>(defaultConfig);

export const useStoreConfig = () => useContext(StoreConfigContext);

interface StoreConfigProviderProps {
  children: ReactNode;
}

export const StoreConfigProvider: React.FC<StoreConfigProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<StoreConfig>(defaultConfig);

  useEffect(() => {

    const fetchConfig = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/config'), {
          headers: getStoreHeaders()
        });
        if (response.ok) {
          const data = await response.json();
          setConfig({
            store: data.store,
            address: data.address,
            social: data.social,
            theme: data.theme,
            isLoading: false,
          });

          // Update document title
          if (data.store.name) {
            document.title = data.store.name;
          }

          // Update favicon if provided
          if (data.store.favicon) {
            const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
            link.type = 'image/x-icon';
            link.rel = 'shortcut icon';
            link.href = data.store.favicon;
            document.head.appendChild(link);
          }

          // Apply CSS custom properties for theming
          document.documentElement.style.setProperty('--color-primary', data.theme.primaryColor);
          document.documentElement.style.setProperty('--color-secondary', data.theme.secondaryColor);
          document.documentElement.style.setProperty('--color-accent', data.theme.accentColor);
          document.documentElement.style.setProperty('--color-accent-hover', data.theme.accentHoverColor || data.theme.accentColor);
          document.documentElement.style.setProperty('--color-background', data.theme.backgroundColor);
          document.documentElement.style.setProperty('--color-text', data.theme.textColor);
          document.documentElement.style.setProperty('--color-icon', data.theme.iconColor);
        }
      } catch (error) {
        console.error('Error fetching store config:', error);
        setConfig(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchConfig();
  }, []);

  return (
    <StoreConfigContext.Provider value={config}>
      {children}
    </StoreConfigContext.Provider>
  );
};

export default StoreConfigContext;
