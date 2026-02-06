/**
 * Encryption Utility Module
 * 
 * Provides AES-256-GCM encryption for sensitive data in the database.
 * Uses Node.js built-in crypto module for secure encryption.
 */

import crypto from 'crypto';
import { env } from '../env.js';

// Algorithm configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;

/**
 * Get or generate the encryption key
 * The key should be stored in .env as ENCRYPTION_KEY (64 hex characters = 32 bytes)
 */
function getEncryptionKey(): Buffer {
  const keyHex = (env as Record<string, string | undefined>).ENCRYPTION_KEY;
  
  if (!keyHex) {
    console.warn('⚠️ ENCRYPTION_KEY not set in .env - generating temporary key');
    console.warn('⚠️ Add this to your .env file:');
    const newKey = crypto.randomBytes(32).toString('hex');
    console.warn(`ENCRYPTION_KEY=${newKey}`);
    // Use a deterministic key for dev (NOT SECURE - only for development)
    return crypto.scryptSync('dev-key-not-secure', 'salt', 32);
  }
  
  // Validate key length (should be 64 hex chars = 32 bytes)
  if (keyHex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hexadecimal characters (32 bytes)');
  }
  
  return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * 
 * @param plaintext - The data to encrypt
 * @returns Encrypted string in format: iv:authTag:ciphertext (all base64)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return '';
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Return format: iv:authTag:ciphertext (all base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data encrypted with encrypt()
 * 
 * @param encryptedData - The encrypted string from encrypt()
 * @returns Decrypted plaintext
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return '';
  
  try {
    const key = getEncryptionKey();
    
    // Parse the encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      // Data might not be encrypted (legacy), return as-is
      return encryptedData;
    }
    
    const [ivBase64, authTagBase64, ciphertext] = parts;
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    // If decryption fails, data might not be encrypted (legacy)
    // Return original data to maintain backwards compatibility
    console.warn('Decryption failed, returning original data (might be unencrypted)');
    return encryptedData;
  }
}

/**
 * Create a one-way hash of sensitive data for searching
 * Useful for finding records by email without decrypting all records
 * 
 * @param data - The data to hash
 * @returns SHA-256 hash of the data (hex string)
 */
export function hashForSearch(data: string): string {
  if (!data) return '';
  
  // Normalize the data (lowercase for emails, etc.)
  const normalized = data.toLowerCase().trim();
  
  // Use HMAC with the encryption key for consistent hashing
  const key = getEncryptionKey();
  return crypto
    .createHmac('sha256', key)
    .update(normalized)
    .digest('hex');
}

/**
 * Generate a secure random key for encryption
 * Use this to generate the ENCRYPTION_KEY for .env
 * 
 * @returns 64-character hex string (32 bytes)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Check if a string appears to be encrypted by our encrypt() function
 * 
 * @param data - String to check
 * @returns true if the string looks encrypted
 */
export function isEncrypted(data: string): boolean {
  if (!data) return false;
  const parts = data.split(':');
  return parts.length === 3 && 
         parts[0].length === 24 && // base64 IV (16 bytes = 24 chars)
         parts[1].length === 24;   // base64 authTag (16 bytes = 24 chars)
}

/**
 * Encrypt data only if it's not already encrypted
 * Useful for migration of existing data
 * 
 * @param data - Data to encrypt
 * @returns Encrypted data
 */
export function encryptIfNeeded(data: string): string {
  if (!data || isEncrypted(data)) return data;
  return encrypt(data);
}

/**
 * Decrypt data only if it appears to be encrypted
 * Maintains backwards compatibility with unencrypted data
 * 
 * @param data - Data to decrypt
 * @returns Decrypted data
 */
export function decryptIfNeeded(data: string): string {
  if (!data || !isEncrypted(data)) return data;
  return decrypt(data);
}
