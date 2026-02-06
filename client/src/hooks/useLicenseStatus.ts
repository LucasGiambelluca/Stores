import { useEffect, useState } from 'react';
import { licenseApi, LicenseInfo } from '../api/license';

export function useLicenseStatus() {
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [isActivated, setIsActivated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    checkStatus();
  }, []);
  
  const checkStatus = async () => {
    try {
      const data = await licenseApi.getStatus();
      setIsActivated(data.activated);
      if (data.license) {
        setLicense(data.license);
      }
    } catch (error) {
      console.error('Error checking license:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return { license, isActivated, loading, refetch: checkStatus };
}
