import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { 
  emailSchema, 
  passwordSchema, 
  phoneSchema,
  sanitizeString,
  sanitizeObject,
  createOrderSchema,
  loginSchema 
} from '../../src/middleware/validation.middleware.js';

describe('Validation Middleware', () => {
  describe('emailSchema', () => {
    it('should accept valid email', () => {
      const result = emailSchema.safeParse('test@example.com');
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = emailSchema.safeParse('invalid-email');
      expect(result.success).toBe(false);
    });

    it('should lowercase email', () => {
      const result = emailSchema.safeParse('TEST@Example.COM');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('should trim whitespace', () => {
      const result = emailSchema.safeParse('  test@example.com  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });
  });

  describe('passwordSchema', () => {
    it('should accept valid password', () => {
      const result = passwordSchema.safeParse('password123');
      expect(result.success).toBe(true);
    });

    it('should reject short password', () => {
      const result = passwordSchema.safeParse('abc');
      expect(result.success).toBe(false);
    });
  });

  describe('phoneSchema', () => {
    it('should accept valid phone', () => {
      const result = phoneSchema.safeParse('+54 291 412-3456');
      expect(result.success).toBe(true);
    });

    it('should accept undefined (optional)', () => {
      const result = phoneSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it('should reject invalid phone with letters', () => {
      const result = phoneSchema.safeParse('abc123');
      expect(result.success).toBe(false);
    });
  });

  describe('sanitizeString()', () => {
    it('should remove HTML tags', () => {
      const result = sanitizeString('<script>alert("xss")</script>Hello');
      expect(result).toBe('alert("xss")Hello');
    });

    it('should remove javascript: URLs', () => {
      const result = sanitizeString('javascript:alert(1)');
      expect(result).toBe('alert(1)');
    });

    it('should remove event handlers', () => {
      const result = sanitizeString('onclick=alert() test');
      expect(result).toBe('alert() test');
    });

    it('should trim whitespace', () => {
      const result = sanitizeString('  hello world  ');
      expect(result).toBe('hello world');
    });
  });

  describe('sanitizeObject()', () => {
    it('should sanitize all string values', () => {
      const input = {
        name: '<b>John</b>',
        email: 'test@test.com',
        age: 25,
      };
      const result = sanitizeObject(input);
      
      expect(result.name).toBe('John');
      expect(result.email).toBe('test@test.com');
      expect(result.age).toBe(25);
    });

    it('should sanitize nested objects', () => {
      const input = {
        user: {
          name: '<script>bad</script>Safe',
        },
      };
      const result = sanitizeObject(input);
      
      expect(result.user.name).toBe('badSafe');
    });

    it('should sanitize arrays', () => {
      const input = {
        items: ['<b>One</b>', '<i>Two</i>'],
      };
      const result = sanitizeObject(input);
      
      expect(result.items[0]).toBe('One');
      expect(result.items[1]).toBe('Two');
    });
  });

  describe('createOrderSchema', () => {
    it('should accept valid order data', () => {
      const validOrder = {
        customerEmail: 'test@example.com',
        customerName: 'John Doe',
        items: [{
          productId: 'prod-1',
          productName: 'Test Product',
          price: 1000,
          quantity: 2,
        }],
      };
      
      const result = createOrderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it('should reject order with empty items', () => {
      const invalidOrder = {
        customerEmail: 'test@example.com',
        customerName: 'John Doe',
        items: [],
      };
      
      const result = createOrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should reject order with invalid email', () => {
      const invalidOrder = {
        customerEmail: 'invalid',
        customerName: 'John Doe',
        items: [{
          productId: 'prod-1',
          productName: 'Test',
          price: 1000,
          quantity: 1,
        }],
      };
      
      const result = createOrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should reject negative price', () => {
      const invalidOrder = {
        customerEmail: 'test@example.com',
        customerName: 'John Doe',
        items: [{
          productId: 'prod-1',
          productName: 'Test',
          price: -100,
          quantity: 1,
        }],
      };
      
      const result = createOrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should reject quantity over 100', () => {
      const invalidOrder = {
        customerEmail: 'test@example.com',
        customerName: 'John Doe',
        items: [{
          productId: 'prod-1',
          productName: 'Test',
          price: 100,
          quantity: 101,
        }],
      };
      
      const result = createOrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'mypassword',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });
});
