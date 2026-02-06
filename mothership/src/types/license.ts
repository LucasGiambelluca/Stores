export interface License {
  serial: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  status: 'generated' | 'activated' | 'suspended' | 'expired' | 'revoked';
  storeId?: string | null;
  expiresAt?: string | Date | null;
  maxProducts?: number | null;
  maxOrders?: number | null;
  ownerEmail?: string | null;
  ownerName?: string | null;
  notes?: string | null;
  createdAt: string | Date;
  activatedAt?: string | Date | null;
  lastCheckIn?: string | Date | null;
}

export interface CreateLicenseInput {
  plan: string;
  duration: string; // '1month', '1year', 'lifetime'
  ownerName?: string;
  ownerEmail?: string;
  notes?: string;
  maxProducts?: number;
  maxOrders?: number;
}

export interface UpdateLicenseInput {
  action?: 'suspend' | 'activate' | 'revoke' | 'renew';
  notes?: string;
  duration?: string;
  plan?: string;
}

export interface LicenseStats {
  total: number;
  active: number;
  generated: number;
  suspended: number;
  expired: number;
  revenue: number;
}
