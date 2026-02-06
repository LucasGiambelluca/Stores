/**
 * Init Controller - Unified endpoint for ultra-fast store initialization
 * 
 * Returns ALL data needed in a SINGLE request:
 * - isConfigured: boolean
 * - license: { activated, status, serial, expiresAt, plan }
 * - storeStatus: 'active' | 'suspended'  
 * - config: store configuration
 * - categories: category list
 * - banners: banner list
 * - products: product list
 * 
 * This eliminates 5 sequential API calls → 1 call = 90%+ latency reduction
 */

import { Request, Response } from 'express';
import { db, categories, banners, licenses, storeConfig } from '../db/drizzle.js';
import { eq, asc, and } from 'drizzle-orm';
import { ProductsService } from '../services/products.service.js';

export async function getInitData(req: Request, res: Response) {
  try {
    const storeId = req.storeId;
    
    // If no storeId, return unconfigured state for SetupWizard
    if (!storeId) {
      return res.json({
        isConfigured: false,
        license: null,
        storeStatus: 'new',
        storeId: null,
        store: { name: 'Nueva Tienda' },
        social: {},
        address: {},
        theme: {
          primaryColor: '#111111',
          secondaryColor: '#ffffff',
          accentColor: '#E5B800',
        },
        categories: [],
        banners: [],
        products: []
      });
    }

    // Run ALL queries in parallel for maximum performance
    const [configRows, categoriesData, bannersData, productsData, licenseData] = await Promise.all([
      db.select().from(storeConfig).where(eq(storeConfig.storeId, storeId)),
      db.select().from(categories).where(eq(categories.storeId, storeId)).orderBy(asc(categories.orderNum)),
      db.select().from(banners).where(eq(banners.storeId, storeId)).orderBy(asc(banners.orderNum)),
      ProductsService.findAll(storeId, { limit: 100 }),
      db.select().from(licenses).where(eq(licenses.storeId, storeId)).limit(1)
    ]);

    // Parse config rows into object
    const config: Record<string, string> = {};
    for (const row of configRows) {
      const val = row.value;
      config[row.key] = typeof val === 'string' ? val : JSON.stringify(val);
    }

    // Determine if store is configured
    const isConfigured = config['is_configured'] === 'true';

    // License status
    const license = licenseData[0];
    const licenseInfo = license ? {
      activated: license.status === 'activated',
      status: license.status,
      serial: license.serial,
      plan: license.plan,
      expiresAt: license.expiresAt,
      maxProducts: license.maxProducts,
      maxOrders: license.maxOrders,
    } : null;

    // Store status (for SaaS suspended check)
    const storeStatus = license?.status === 'suspended' ? 'suspended' : 'active';

    res.json({
      // Critical flags for App.tsx flow control
      isConfigured,
      license: licenseInfo,
      storeStatus,
      storeId,
      
      // Store data
      store: {
        id: storeId,
        name: config.store_name || req.store?.name || 'Tienda',
        type: config.store_type || req.store?.type || 'retail',
        plan: licenseInfo?.plan || req.store?.plan || 'free', // Added plan from license
        email: config.store_email,
        slogan: config.store_slogan,
        logo: config.store_logo,
        freeShippingFrom: config.store_free_shipping_from ? Number(config.store_free_shipping_from) : 0,
        transferDiscount: config.store_transfer_discount || '0',
        returnDays: config.store_return_days ? Number(config.store_return_days) : 30,
        installments: config.store_installments ? Number(config.store_installments) : 6,
      },
      social: {
        whatsapp: config.social_whatsapp,
        instagram: config.social_instagram,
      },
      address: {
        street: config.address_street,
        city: config.address_city,
      },
      theme: {
        primaryColor: config.theme_primary || '#111111',
        secondaryColor: config.theme_secondary || '#ffffff',
        accentColor: config.theme_accent || '#E5B800',
        accentHoverColor: config.theme_accent_hover || '#D4A900',
        iconColor: config.theme_icon,
        textColor: config.theme_text,
        backgroundColor: config.theme_background,
      },
      
      // Content data
      categories: categoriesData || [],
      banners: (bannersData || []).map((b) => ({
        id: b.id,
        image: b.image,
        title: b.title,
        subtitle: b.subtitle,
        buttonText: b.buttonText,
        buttonLink: b.buttonLink,
        order: b.orderNum,
        isActive: b.isActive
      })),
      products: productsData?.products || [],
      homepageBlocks: config.homepage_blocks ? JSON.parse(config.homepage_blocks) : [],
      aboutBlocks: config.about_blocks ? JSON.parse(config.about_blocks) : []
    });
  } catch (error) {
    console.error('Init data error:', error);
    res.status(500).json({ error: 'Error loading store data' });
  }
}
