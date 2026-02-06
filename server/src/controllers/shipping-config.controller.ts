/**
 * Shipping Configuration Controller
 * 
 * Manages shipping settings stored in the database.
 * Includes provider credentials, zones, and general options.
 * Multi-tenant: Each store has its own configuration.
 */

import { Router, Request, Response } from 'express';
import { db, storeConfig } from '../db/drizzle.js';
import { eq, and } from 'drizzle-orm';

const router: Router = Router();

// Keys for shipping config
const SHIPPING_CONFIG_KEY = 'shipping_config';
const PAYMENT_CONFIG_KEY = 'payment_config';

// Default shipping config
const defaultShippingConfig = {
  provider: 'manual', // 'manual' | 'correo_argentino' | 'andreani'
  freeShippingThreshold: 50000,
  defaultShippingCost: 5000,
  enableLocalPickup: true,
  pickupAddress: '',
  pickupHours: 'Lunes a Viernes 10:00 - 18:00',
  zones: [
    { id: '1', name: 'AMBA', cost: 5000, enabled: true },
    { id: '2', name: 'Interior (hasta 500km)', cost: 7000, enabled: true },
    { id: '3', name: 'Interior (más de 500km)', cost: 9000, enabled: true },
  ],
  origin: {
    name: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    email: '',
  },
  correoArgentino: {
    apiKey: '',
    agreement: '',
    env: 'test',
  },
  andreani: {
    username: '',
    password: '',
    clientId: '',
    env: 'test',
  },
};

// Default payment config
const defaultPaymentConfig = {
  mercadoPago: {
    enabled: true,
    publicKey: '',
    accessToken: '',
    mode: 'sandbox',
  },
  bankTransfer: {
    enabled: true,
    discount: 10,
    bankName: '',
    accountHolder: '',
    cbu: '',
    alias: '',
    cuit: '',
  },
  cashOnDelivery: {
    enabled: false,
    extraCharge: 0,
  },
  localPickupPayment: {
    enabled: true,
    cashEnabled: true,
    cardEnabled: true,
    transferEnabled: true,
  },
  installments: {
    enabled: true,
    maxInstallments: 12,
    interestFree: 3,
  },
};

// ============================================
// GET /api/admin/shipping-config
// ============================================
router.get('/shipping-config', async (req: Request, res: Response) => {
  try {
    const storeId = req.storeId;
    
    if (!storeId) {
      return res.status(400).json({ error: 'Store ID requerido' });
    }

    const result = await db.select()
      .from(storeConfig)
      .where(and(
        eq(storeConfig.key, SHIPPING_CONFIG_KEY),
        eq(storeConfig.storeId, storeId)
      ))
      .limit(1);

    if (result.length > 0 && result[0].value) {
      // Value is already parsed from jsonb
      res.json(result[0].value);
    } else {
      res.json(defaultShippingConfig);
    }
  } catch (error) {
    console.error('Error getting shipping config:', error);
    res.status(500).json({ error: 'Error al obtener configuración de envíos' });
  }
});

// ============================================
// PUT /api/admin/shipping-config
// ============================================
router.put('/shipping-config', async (req: Request, res: Response) => {
  try {
    const storeId = req.storeId;
    
    if (!storeId) {
      return res.status(400).json({ error: 'Store ID requerido' });
    }

    const config = req.body;

    // Upsert config
    const existing = await db.select()
      .from(storeConfig)
      .where(and(
        eq(storeConfig.key, SHIPPING_CONFIG_KEY),
        eq(storeConfig.storeId, storeId)
      ))
      .limit(1);

    if (existing.length > 0) {
      await db.update(storeConfig)
        .set({ value: config, updatedAt: new Date() })
        .where(and(
          eq(storeConfig.key, SHIPPING_CONFIG_KEY),
          eq(storeConfig.storeId, storeId)
        ));
    } else {
      await db.insert(storeConfig)
        .values({ 
          key: SHIPPING_CONFIG_KEY, 
          storeId,
          value: config, 
          updatedAt: new Date() 
        });
    }

    res.json({ success: true, message: 'Configuración guardada' });
  } catch (error) {
    console.error('Error saving shipping config:', error);
    res.status(500).json({ error: 'Error al guardar configuración de envíos' });
  }
});

// ============================================
// GET /api/admin/payment-config
// ============================================
router.get('/payment-config', async (req: Request, res: Response) => {
  try {
    const storeId = req.storeId;
    
    if (!storeId) {
      return res.status(400).json({ error: 'Store ID requerido' });
    }

    const result = await db.select()
      .from(storeConfig)
      .where(and(
        eq(storeConfig.key, PAYMENT_CONFIG_KEY),
        eq(storeConfig.storeId, storeId)
      ))
      .limit(1);

    if (result.length > 0 && result[0].value) {
      // Value is already parsed from jsonb
      res.json(result[0].value);
    } else {
      res.json(defaultPaymentConfig);
    }
  } catch (error) {
    console.error('Error getting payment config:', error);
    res.status(500).json({ error: 'Error al obtener configuración de pagos' });
  }
});

// ============================================
// PUT /api/admin/payment-config
// ============================================
router.put('/payment-config', async (req: Request, res: Response) => {
  try {
    const storeId = req.storeId;
    
    if (!storeId) {
      return res.status(400).json({ error: 'Store ID requerido' });
    }

    const config = req.body;

    // Upsert config
    const existing = await db.select()
      .from(storeConfig)
      .where(and(
        eq(storeConfig.key, PAYMENT_CONFIG_KEY),
        eq(storeConfig.storeId, storeId)
      ))
      .limit(1);

    if (existing.length > 0) {
      await db.update(storeConfig)
        .set({ value: config, updatedAt: new Date() })
        .where(and(
          eq(storeConfig.key, PAYMENT_CONFIG_KEY),
          eq(storeConfig.storeId, storeId)
        ));
    } else {
      await db.insert(storeConfig)
        .values({ 
          key: PAYMENT_CONFIG_KEY, 
          storeId,
          value: config, 
          updatedAt: new Date() 
        });
    }

    res.json({ success: true, message: 'Configuración guardada' });
  } catch (error) {
    console.error('Error saving payment config:', error);
    res.status(500).json({ error: 'Error al guardar configuración de pagos' });
  }
});

// ============================================
// POST /api/admin/shipping-config/test
// Test provider credentials
// ============================================
router.post('/shipping-config/test', async (req: Request, res: Response) => {
  try {
    const { provider, credentials } = req.body;

    if (provider === 'correo_argentino') {
      // Test Correo Argentino credentials
      const response = await fetch('https://apitest.correoargentino.com.ar/paqar/v1/auth', {
        method: 'GET',
        headers: {
          'Authorization': `Apikey ${credentials.apiKey}`,
          'agreement': credentials.agreement,
        },
      });
      
      if (response.status === 204) {
        res.json({ success: true, message: 'Credenciales válidas' });
      } else {
        res.json({ success: false, message: 'Credenciales inválidas' });
      }
    } else if (provider === 'andreani') {
      // Test Andreani credentials
      const basicAuth = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
      
      const response = await fetch('https://apisqa.andreani.com/login', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
        },
      });
      
      if (response.ok) {
        res.json({ success: true, message: 'Credenciales válidas' });
      } else {
        res.json({ success: false, message: 'Credenciales inválidas' });
      }
    } else {
      res.json({ success: true, message: 'Modo manual no requiere credenciales' });
    }
  } catch (error) {
    console.error('Error testing credentials:', error);
    res.json({ success: false, message: 'Error al verificar credenciales' });
  }
});

export default router;

// Export function to get config (for use by shipping providers)
export async function getShippingConfig(storeId: string): Promise<typeof defaultShippingConfig> {
  try {
    const result = await db.select()
      .from(storeConfig)
      .where(and(
        eq(storeConfig.key, SHIPPING_CONFIG_KEY),
        eq(storeConfig.storeId, storeId)
      ))
      .limit(1);

    if (result.length > 0 && result[0].value) {
      // Value is already object from jsonb
      return { ...defaultShippingConfig, ...(result[0].value as typeof defaultShippingConfig) };
    }
  } catch (error) {
    console.error('Error reading shipping config:', error);
  }
  return defaultShippingConfig;
}

export async function getPaymentConfig(storeId: string): Promise<typeof defaultPaymentConfig> {
  try {
    const result = await db.select()
      .from(storeConfig)
      .where(and(
        eq(storeConfig.key, PAYMENT_CONFIG_KEY),
        eq(storeConfig.storeId, storeId)
      ))
      .limit(1);

    if (result.length > 0 && result[0].value) {
      // Value is already object from jsonb
      return { ...defaultPaymentConfig, ...(result[0].value as typeof defaultPaymentConfig) };
    }
  } catch (error) {
    console.error('Error reading payment config:', error);
  }
  return defaultPaymentConfig;
}

// Export defaults for use in other modules
export { defaultShippingConfig, defaultPaymentConfig };
