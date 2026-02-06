import { useState, useEffect } from 'react';
import { licenseApi, type LicenseInfo } from '../api/license';

interface UseActivationReturn {
  isActivated: boolean;
  isSuspended: boolean;
  isExpired: boolean;
  license: LicenseInfo | null;
  loading: boolean;
  error: string | null;
  checkStatus: () => Promise<void>;
  activate: (serial: string) => Promise<void>;
}

/**
 * Hook to manage license activation state
 * 
 * Features:
 * - Checks activation status on mount
 * - Periodic check-ins (every 24h)
 * - Session storage caching (isolated per tab)
 * - Auto-activation detection
 */
export function useActivation(): UseActivationReturn {
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [isSuspended, setIsSuspended] = useState<boolean>(false);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check license status
  const checkStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await licenseApi.getStatus();
      
      setIsActivated(result.activated);
      setLicense(result.license || null);
      
      // Check license status for suspension/expiration
      if (result.license) {
        setIsSuspended(result.license.status === 'suspended');
        setIsExpired(result.license.status === 'expired' || 
          (result.license.expiresAt && new Date(result.license.expiresAt) < new Date()));
      } else {
        setIsSuspended(false);
        setIsExpired(false);
      }
      
      // Cache in localStorage (but always re-verify from API)
      if (result.activated && result.license) {
        sessionStorage.setItem('license_cached', JSON.stringify({
          activated: true,
          license: result.license,
          cachedAt: new Date().toISOString(),
        }));
      } else {
        sessionStorage.removeItem('license_cached');
      }
    } catch (err: any) {
      console.error('License status check failed:', err);
      setError(err.message || 'Failed to check license status');
      
      // Fallback to cache if API fails
      const cached = sessionStorage.getItem('license_cached');
      if (cached) {
        try {
          const data = JSON.parse(cached);
          setIsActivated(data.activated);
          setLicense(data.license);
        } catch (parseErr) {
          console.error('Failed to parse cached license:', parseErr);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Activate license
  const activate = async (serial: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await licenseApi.activate(serial);
      
      // Refresh status after activation
      await checkStatus();
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to activate license';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Periodic check-in (health check)
  useEffect(() => {
    if (!isActivated || !license?.serial) return;

    const performCheckIn = async () => {
      try {
        await licenseApi.checkIn(license.serial, {
          timestamp: new Date().toISOString(),
        });
        console.log('✅ License check-in successful');
      } catch (err) {
        console.warn('⚠️ License check-in failed:', err);
      }
    };

    // Immediate check-in
    performCheckIn();

    // Schedule check-in every 5 minutes (to detect suspension quickly)
    const interval = setInterval(performCheckIn, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isActivated, license?.serial]);

  // Initial status check on mount
  useEffect(() => {
    checkStatus();
  }, []);

  return {
    isActivated,
    isSuspended,
    isExpired,
    license,
    loading,
    error,
    checkStatus,
    activate,
  };
}
