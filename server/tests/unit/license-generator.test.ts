import { describe, it, expect } from 'vitest';
import { LicenseGenerator } from '../../src/utils/license-generator.js';

describe('LicenseGenerator', () => {
  describe('generate()', () => {
    it('should generate a serial in TND-XXXX-XXXX-XXXX format', () => {
      const serial = LicenseGenerator.generate();
      
      expect(serial).toMatch(/^TND-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);
    });

    it('should generate unique serials', () => {
      const serials = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        serials.add(LicenseGenerator.generate());
      }
      
      // All 100 should be unique
      expect(serials.size).toBe(100);
    });
  });

  describe('validate()', () => {
    it('should validate correct serial format', () => {
      expect(LicenseGenerator.validate('TND-ABCD-1234-EF56')).toBe(true);
      expect(LicenseGenerator.validate('TND-0000-0000-0000')).toBe(true);
      expect(LicenseGenerator.validate('TND-FFFF-FFFF-FFFF')).toBe(true);
    });

    it('should reject invalid serial formats', () => {
      expect(LicenseGenerator.validate('TND-ABC-1234-EF56')).toBe(false); // 3 chars
      expect(LicenseGenerator.validate('TND-ABCDE-1234-EF56')).toBe(false); // 5 chars
      expect(LicenseGenerator.validate('XXX-ABCD-1234-EF56')).toBe(false); // Wrong prefix
      expect(LicenseGenerator.validate('TNDABCD1234EF56')).toBe(false); // No dashes
      expect(LicenseGenerator.validate('')).toBe(false);
      expect(LicenseGenerator.validate('invalid')).toBe(false);
    });

    it('should reject lowercase serials', () => {
      expect(LicenseGenerator.validate('TND-abcd-1234-ef56')).toBe(false);
    });
  });

  describe('getExpirationDate()', () => {
    it('should return null for lifetime duration', () => {
      const result = LicenseGenerator.getExpirationDate('lifetime');
      expect(result).toBeNull();
    });

    it('should return correct date for 1year duration', () => {
      const now = new Date();
      const result = LicenseGenerator.getExpirationDate('1year');
      
      expect(result).toBeInstanceOf(Date);
      const diffDays = Math.round((result!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBeGreaterThanOrEqual(364);
      expect(diffDays).toBeLessThanOrEqual(366);
    });

    it('should return correct date for 6months duration', () => {
      const now = new Date();
      const result = LicenseGenerator.getExpirationDate('6months');
      
      expect(result).toBeInstanceOf(Date);
      const diffDays = Math.round((result!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBeGreaterThanOrEqual(180);
      expect(diffDays).toBeLessThanOrEqual(186);
    });

    it('should return correct date for 3months duration', () => {
      const now = new Date();
      const result = LicenseGenerator.getExpirationDate('3months');
      
      expect(result).toBeInstanceOf(Date);
      const diffDays = Math.round((result!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBeGreaterThanOrEqual(89);
      expect(diffDays).toBeLessThanOrEqual(93);
    });

    it('should return correct date for 1week duration', () => {
      const now = new Date();
      const result = LicenseGenerator.getExpirationDate('1week');
      
      expect(result).toBeInstanceOf(Date);
      const diffDays = Math.round((result!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(7);
    });
  });

  describe('getPlanLimits()', () => {
    it('should return correct limits for free plan', () => {
      const limits = LicenseGenerator.getPlanLimits('free');
      expect(limits.maxProducts).toBe(10);
      expect(limits.maxOrders).toBe(50);
    });

    it('should return correct limits for starter plan', () => {
      const limits = LicenseGenerator.getPlanLimits('starter');
      expect(limits.maxProducts).toBe(50);
      expect(limits.maxOrders).toBe(100);
    });

    it('should return correct limits for pro plan', () => {
      const limits = LicenseGenerator.getPlanLimits('pro');
      expect(limits.maxProducts).toBe(2000);
      expect(limits.maxOrders).toBeNull(); // Unlimited
    });

    it('should return correct limits for enterprise plan', () => {
      const limits = LicenseGenerator.getPlanLimits('enterprise');
      expect(limits.maxProducts).toBeNull(); // Unlimited
      expect(limits.maxOrders).toBeNull(); // Unlimited
    });
  });
});
