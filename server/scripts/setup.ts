#!/usr/bin/env node
/**
 * Setup Script for Tienda Template
 * 
 * This script helps you create a .env file with the required configuration.
 * Run it with: pnpm run setup OR node scripts/setup.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.join(__dirname, '..');
const envPath = path.join(serverDir, '.env');
const envExamplePath = path.join(serverDir, '.env.example');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function generateJWTSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 48; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function prompt(question: string, defaultValue = ''): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const defaultText = defaultValue ? ` (${defaultValue})` : '';
    rl.question(`${colors.cyan}${question}${defaultText}: ${colors.reset}`, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function main() {
  console.log('\n');
  log('╔═══════════════════════════════════════════════════════════╗', colors.bright);
  log('║           🛒 TIENDA TEMPLATE - SETUP                      ║', colors.bright);
  log('╚═══════════════════════════════════════════════════════════╝', colors.bright);
  console.log('\n');

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    log('⚠️  Ya existe un archivo .env', colors.yellow);
    const overwrite = await prompt('¿Querés sobrescribirlo? (s/n)', 'n');
    if (overwrite.toLowerCase() !== 's') {
      log('Cancelado. Tu archivo .env no fue modificado.', colors.yellow);
      process.exit(0);
    }
  }

  log('\n📝 Vamos a configurar tu tienda. Presioná Enter para usar los valores por defecto.\n', colors.green);

  // Gather configuration
  const config: Record<string, string> = {};

  // Server
  config.PORT = '3001';
  config.NODE_ENV = 'development';

  // Security
  const jwtSecret = generateJWTSecret();
  config.JWT_SECRET = jwtSecret;
  log(`🔐 JWT_SECRET generado automáticamente`, colors.green);

  // Admin
  config.ADMIN_EMAIL = await prompt('Email del admin', 'admin@tienda.com');
  config.ADMIN_PASSWORD = await prompt('Contraseña del admin', 'admin123');

  // Store info
  console.log('\n');
  log('📦 Información de la tienda:', colors.bright);
  config.STORE_NAME = await prompt('Nombre de la tienda', 'Mi Tienda');
  config.STORE_EMAIL = await prompt('Email de contacto', 'contacto@tienda.com');
  config.STORE_PHONE = await prompt('Teléfono', '+54 9 11 1234-5678');
  config.STORE_URL = await prompt('URL del frontend', 'http://localhost:3000');

  // MercadoPago
  console.log('\n');
  log('💳 MercadoPago (https://www.mercadopago.com.ar/developers/panel):', colors.bright);
  config.MP_ACCESS_TOKEN = await prompt('Access Token', 'TEST-token-aqui');
  config.MP_PUBLIC_KEY = await prompt('Public Key', 'TEST-key-aqui');
  config.MP_WEBHOOK_SECRET = '';

  // Cloudinary (optional)
  console.log('\n');
  log('☁️  Cloudinary (opcional - https://cloudinary.com/console):', colors.bright);
  const useCloudinary = await prompt('¿Configurar Cloudinary? (s/n)', 'n');
  if (useCloudinary.toLowerCase() === 's') {
    config.CLOUDINARY_CLOUD_NAME = await prompt('Cloud Name');
    config.CLOUDINARY_API_KEY = await prompt('API Key');
    config.CLOUDINARY_API_SECRET = await prompt('API Secret');
  } else {
    config.CLOUDINARY_CLOUD_NAME = '';
    config.CLOUDINARY_API_KEY = '';
    config.CLOUDINARY_API_SECRET = '';
  }

  // SMTP (optional)
  console.log('\n');
  log('📧 Email SMTP (opcional):', colors.bright);
  const useSMTP = await prompt('¿Configurar emails? (s/n)', 'n');
  if (useSMTP.toLowerCase() === 's') {
    config.SMTP_HOST = await prompt('SMTP Host', 'smtp.gmail.com');
    config.SMTP_PORT = await prompt('SMTP Port', '587');
    config.SMTP_SECURE = 'false';
    config.SMTP_USER = await prompt('Email');
    config.SMTP_PASS = await prompt('App Password');
  } else {
    config.SMTP_HOST = '';
    config.SMTP_PORT = '';
    config.SMTP_SECURE = '';
    config.SMTP_USER = '';
    config.SMTP_PASS = '';
  }

  // Shipping
  config.SHIPPING_PROVIDER = 'mock';
  config.ENVIOPACK_API_KEY = '';
  config.ENVIOPACK_SECRET_KEY = '';
  config.SHIPPING_ORIGIN_NAME = config.STORE_NAME;
  config.SHIPPING_ORIGIN_ADDRESS = '';
  config.SHIPPING_ORIGIN_NUMBER = '';
  config.SHIPPING_ORIGIN_CITY = '';
  config.SHIPPING_ORIGIN_PROVINCE = '';
  config.SHIPPING_ORIGIN_POSTAL_CODE = '';
  config.SHIPPING_ORIGIN_PHONE = config.STORE_PHONE;
  config.SHIPPING_ORIGIN_EMAIL = config.STORE_EMAIL;

  // AI
  config.HUGGINGFACE_TOKEN = '';

  // Generate .env content
  const envContent = `# =====================================================
# CONFIGURACIÓN GENERADA - ${new Date().toLocaleDateString()}
# =====================================================

# Servidor
PORT=${config.PORT}
NODE_ENV=${config.NODE_ENV}

# Seguridad
JWT_SECRET=${config.JWT_SECRET}

# Admin
ADMIN_EMAIL=${config.ADMIN_EMAIL}
ADMIN_PASSWORD=${config.ADMIN_PASSWORD}

# Tienda
STORE_NAME=${config.STORE_NAME}
STORE_EMAIL=${config.STORE_EMAIL}
STORE_PHONE=${config.STORE_PHONE}
STORE_URL=${config.STORE_URL}

# MercadoPago
MP_ACCESS_TOKEN=${config.MP_ACCESS_TOKEN}
MP_PUBLIC_KEY=${config.MP_PUBLIC_KEY}
MP_WEBHOOK_SECRET=${config.MP_WEBHOOK_SECRET}

# Cloudinary
CLOUDINARY_CLOUD_NAME=${config.CLOUDINARY_CLOUD_NAME}
CLOUDINARY_API_KEY=${config.CLOUDINARY_API_KEY}
CLOUDINARY_API_SECRET=${config.CLOUDINARY_API_SECRET}

# Email
SMTP_HOST=${config.SMTP_HOST}
SMTP_PORT=${config.SMTP_PORT}
SMTP_SECURE=${config.SMTP_SECURE}
SMTP_USER=${config.SMTP_USER}
SMTP_PASS=${config.SMTP_PASS}

# Envíos
SHIPPING_PROVIDER=${config.SHIPPING_PROVIDER}
ENVIOPACK_API_KEY=${config.ENVIOPACK_API_KEY}
ENVIOPACK_SECRET_KEY=${config.ENVIOPACK_SECRET_KEY}
SHIPPING_ORIGIN_NAME=${config.SHIPPING_ORIGIN_NAME}
SHIPPING_ORIGIN_ADDRESS=${config.SHIPPING_ORIGIN_ADDRESS}
SHIPPING_ORIGIN_CITY=${config.SHIPPING_ORIGIN_CITY}
SHIPPING_ORIGIN_PROVINCE=${config.SHIPPING_ORIGIN_PROVINCE}
SHIPPING_ORIGIN_POSTAL_CODE=${config.SHIPPING_ORIGIN_POSTAL_CODE}
SHIPPING_ORIGIN_PHONE=${config.SHIPPING_ORIGIN_PHONE}
SHIPPING_ORIGIN_EMAIL=${config.SHIPPING_ORIGIN_EMAIL}

# IA
HUGGINGFACE_TOKEN=${config.HUGGINGFACE_TOKEN}
`;

  // Write .env file
  fs.writeFileSync(envPath, envContent, 'utf-8');

  console.log('\n');
  log('╔═══════════════════════════════════════════════════════════╗', colors.green);
  log('║           ✅ ¡CONFIGURACIÓN COMPLETADA!                   ║', colors.green);
  log('╠═══════════════════════════════════════════════════════════╣', colors.green);
  log('║  Tu archivo .env fue creado exitosamente.                 ║', colors.green);
  log('║                                                           ║', colors.green);
  log('║  Próximos pasos:                                          ║', colors.green);
  log('║  1. cd server && pnpm install                             ║', colors.green);
  log('║  2. pnpm run dev                                          ║', colors.green);
  log('╚═══════════════════════════════════════════════════════════╝', colors.green);
  console.log('\n');
}

main().catch((error) => {
  log(`\n❌ Error: ${error.message}`, colors.red);
  process.exit(1);
});
