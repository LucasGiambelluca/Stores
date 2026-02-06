/**
 * Environment Variables Validation
 * 
 * This file validates all environment variables at startup.
 * If any required variable is missing, the server will fail fast
 * with a clear error message.
 * 
 * Usage:
 *   import { env } from './env.js';
 *   console.log(env.PORT); // Typed and validated
 */

// IMPORTANT: Load dotenv BEFORE importing zod schema
// In ESM, imports are hoisted, so we need to load .env here
import dotenv from 'dotenv';
dotenv.config();

import { z } from 'zod';

// ===========================================
// SCHEMA DEFINITION
// ===========================================

const envSchema = z.object({
  // -------------------------------------------
  // Server Configuration
  // -------------------------------------------
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database [REQUERIDO]
  DATABASE_URL: z.string().url('DATABASE_URL debe ser una URL válida de PostgreSQL'),

  // -------------------------------------------
  // Security
  // -------------------------------------------
  JWT_SECRET: z.string()
    .min(16, 'JWT_SECRET debe tener al menos 16 caracteres para ser seguro')
    .describe('Clave secreta para firmar tokens JWT'),

  // -------------------------------------------
  // Admin User (created on first run)
  // -------------------------------------------
  ADMIN_EMAIL: z.string().email('ADMIN_EMAIL debe ser un email válido').default('admin@admin.com'),
  // Password requirements: min 8 chars, no weak default in production
  ADMIN_PASSWORD: z.string()
    .min(8, 'ADMIN_PASSWORD debe tener al menos 8 caracteres')
    .refine(
      (val) => {
        // In production, don't allow weak passwords
        if (process.env.NODE_ENV === 'production') {
          const hasUpper = /[A-Z]/.test(val);
          const hasLower = /[a-z]/.test(val);
          const hasNumber = /[0-9]/.test(val);
          return hasUpper && hasLower && hasNumber;
        }
        return true; // In dev, just require 8 chars
      },
      { message: 'ADMIN_PASSWORD debe contener mayúsculas, minúsculas y números en producción' }
    ),

  // -------------------------------------------
  // Store Information
  // -------------------------------------------
  STORE_URL: z.string().url('STORE_URL debe ser una URL válida').default('http://localhost:3000'),
  STORE_NAME: z.string().default('Mi Tienda'),
  STORE_EMAIL: z.string().email().optional(),
  STORE_PHONE: z.string().optional(),
  STORE_DESCRIPTION: z.string().default('Tu tienda online de confianza'),
  STORE_LOGO: z.string().optional(), // URL del logo
  STORE_FAVICON: z.string().optional(), // URL del favicon
  STORE_SLOGAN: z.string().optional(), // Frase corta debajo del logo

  // -------------------------------------------
  // Store Address (for footer/contact page)
  // -------------------------------------------
  STORE_ADDRESS_STREET: z.string().optional(),
  STORE_ADDRESS_CITY: z.string().optional(),
  STORE_ADDRESS_PROVINCE: z.string().optional(),
  STORE_ADDRESS_POSTAL: z.string().optional(),

  // -------------------------------------------
  // Social Media Links
  // -------------------------------------------
  SOCIAL_WHATSAPP: z.string().optional(), // Número con código país (ej: 5491112345678)
  SOCIAL_INSTAGRAM: z.string().optional(), // Usuario sin @ (ej: mitienda)
  SOCIAL_FACEBOOK: z.string().optional(), // URL completa o username
  SOCIAL_TIKTOK: z.string().optional(), // Usuario sin @

  // -------------------------------------------
  // Theming (Colors - use hex codes)
  // -------------------------------------------
  THEME_PRIMARY_COLOR: z.string().default('#E5B800'), // Color principal (dorado)
  THEME_SECONDARY_COLOR: z.string().default('#1a1a1a'), // Color secundario (oscuro)
  THEME_ACCENT_COLOR: z.string().default('#10B981'), // Color de acento (verde)
  THEME_BACKGROUND_COLOR: z.string().default('#0a0a0a'), // Fondo
  THEME_TEXT_COLOR: z.string().default('#ffffff'), // Texto principal
  THEME_ICON_COLOR: z.string().default('#E5B800'), // Color de iconos

  // -------------------------------------------
  // MercadoPago (Required for payments)
  // -------------------------------------------
  MP_ACCESS_TOKEN: z.string()
    .min(1, 'MP_ACCESS_TOKEN es requerido para procesar pagos')
    .describe('Token de acceso de MercadoPago'),
  MP_PUBLIC_KEY: z.string()
    .min(1, 'MP_PUBLIC_KEY es requerido para el checkout')
    .describe('Clave pública de MercadoPago'),
  MP_WEBHOOK_SECRET: z.string().optional(),

  // -------------------------------------------
  // Email SMTP (Optional - logs to console if not set)
  // -------------------------------------------
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // -------------------------------------------
  // Cloudinary (Optional - uses local storage if not set)
  // -------------------------------------------
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // -------------------------------------------
  // Shipping
  // -------------------------------------------
  SHIPPING_PROVIDER: z.enum(['mock', 'enviopack', 'correo_argentino', 'andreani']).default('mock'),
  
  // EnvioPack (deprecated, keeping for backwards compatibility)
  ENVIOPACK_API_KEY: z.string().optional(),
  ENVIOPACK_SECRET_KEY: z.string().optional(),
  
  // Correo Argentino
  CORREO_ARG_API_KEY: z.string().optional(),
  CORREO_ARG_AGREEMENT: z.string().optional(),
  CORREO_ARG_ENV: z.enum(['test', 'production']).default('test'),
  
  // Andreani
  ANDREANI_USERNAME: z.string().optional(),
  ANDREANI_PASSWORD: z.string().optional(),
  ANDREANI_CLIENT_ID: z.string().optional(),
  ANDREANI_ENV: z.enum(['test', 'production']).default('test'),

  // Shipping Origin (sender address)
  SHIPPING_ORIGIN_NAME: z.string().optional(),
  SHIPPING_ORIGIN_ADDRESS: z.string().optional(),
  SHIPPING_ORIGIN_NUMBER: z.string().optional(),
  SHIPPING_ORIGIN_CITY: z.string().optional(),
  SHIPPING_ORIGIN_PROVINCE: z.string().optional(),
  SHIPPING_ORIGIN_POSTAL_CODE: z.string().optional(),
  SHIPPING_ORIGIN_PHONE: z.string().optional(),
  SHIPPING_ORIGIN_EMAIL: z.string().optional(),

  // -------------------------------------------
  // AI Features (Optional)
  // -------------------------------------------
  HUGGINGFACE_TOKEN: z.string().optional(),
  REPLICATE_API_TOKEN: z.string().optional(),

  // -------------------------------------------
  // Error Monitoring (Optional but recommended)
  // -------------------------------------------
  SENTRY_DSN: z.string().url().optional(),
});

// ===========================================
// VALIDATION & EXPORT
// ===========================================

function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('\n');
    console.error('╔═══════════════════════════════════════════════════════════╗');
    console.error('║           ❌ ERROR DE CONFIGURACIÓN                       ║');
    console.error('╠═══════════════════════════════════════════════════════════╣');
    
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      console.error(`║  • ${path}: ${issue.message}`);
    });
    
    console.error('╠═══════════════════════════════════════════════════════════╣');
    console.error('║  Revisá tu archivo .env y asegurate de tener todas las    ║');
    console.error('║  variables requeridas. Usá .env.example como referencia.  ║');
    console.error('╚═══════════════════════════════════════════════════════════╝');
    console.error('\n');
    
    process.exit(1);
  }

  return result.data;
}

// Export validated environment
export const env = validateEnv();

// Type export for use in other files
export type Env = z.infer<typeof envSchema>;

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Check if we're in production mode
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if we're in development mode
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Check if Cloudinary is configured
 */
export const hasCloudinary = !!(
  env.CLOUDINARY_CLOUD_NAME && 
  env.CLOUDINARY_API_KEY && 
  env.CLOUDINARY_API_SECRET
);

/**
 * Check if SMTP is configured
 */
export const hasSMTP = !!(
  env.SMTP_HOST && 
  env.SMTP_USER && 
  env.SMTP_PASS
);

/**
 * Check if Enviopack shipping is configured
 */
export const hasEnviopack = !!(
  env.SHIPPING_PROVIDER === 'enviopack' &&
  env.ENVIOPACK_API_KEY &&
  env.ENVIOPACK_SECRET_KEY
);

/**
 * Check if Sentry error monitoring is configured
 */
export const hasSentry = !!env.SENTRY_DSN;
