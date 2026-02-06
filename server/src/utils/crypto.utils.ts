import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const MIN_KEY_LENGTH = 32; // 32 characters minimum for AES-256

// SECURITY: Read encryption key from environment, no fallback allowed
const MASTER_KEY_SECRET = process.env.ENCRYPTION_KEY;

/**
 * Validates that the encryption key is properly configured.
 * Throws an error if the key is missing or too short.
 */
function validateEncryptionKey(): void {
  if (!MASTER_KEY_SECRET) {
    throw new Error(
      '[SECURITY] ENCRYPTION_KEY environment variable is not set. ' +
      'Cannot start application without encryption key. ' +
      'Generate a secure key with: openssl rand -hex 32'
    );
  }
  
  if (MASTER_KEY_SECRET.length < MIN_KEY_LENGTH) {
    throw new Error(
      `[SECURITY] ENCRYPTION_KEY is too short (${MASTER_KEY_SECRET.length} chars). ` +
      `Minimum required length is ${MIN_KEY_LENGTH} characters. ` +
      'Generate a secure key with: openssl rand -hex 32'
    );
  }
}

// Validate key immediately on module load
validateEncryptionKey();

// Derive master key (only reached if validation passes)
const MASTER_KEY = crypto.scryptSync(MASTER_KEY_SECRET!, 'salt', 32);

/**
 * Encrypts complex data or strings into a secure format.
 * Format: salt:iv:tag:encryptedData
 */
export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  // Create a key derived from the master key and a random salt for each encryption
  // This ensures that encrypting the same text twice results in different outputs
  const key = crypto.scryptSync(MASTER_KEY_SECRET!, salt, 32);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();

  return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypts data encrypted with the encrypt function.
 */
export const decrypt = (encryptedText: string): string => {
  const parts = encryptedText.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted text format');
  }

  const [saltHex, ivHex, tagHex, contentHex] = parts;
  
  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  
  const key = crypto.scryptSync(MASTER_KEY_SECRET!, salt, 32);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(contentHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
