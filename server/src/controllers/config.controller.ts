// Config Controller - Store configuration from database
import { Request, Response } from 'express';
import { env } from '../env.js';
import { configService } from '../services/config.service.js';

/**
 * Get public store configuration for frontend theming
 * This endpoint is PUBLIC - no authentication required
 * 
 * Priority: Database values > .env values
 * Multi-tenant: Uses storeId from middleware to get store-specific config
 */
export async function getStoreConfig(req: Request, res: Response) {
  try {
    // Get storeId from middleware (set by storeResolver)
    const storeId = req.storeId;
    
    // Get config filtered by storeId if available
    const dbConfig = await configService.getAllConfig(storeId);
    
    // Check if this store has any configuration
    const hasConfig = Object.keys(dbConfig).length > 0;
    const storeConfigured = hasConfig && dbConfig['store_name'] && dbConfig['is_configured'] === 'true';
    
    // Build response with DB values taking priority over .env
    res.json({
      store: {
        name: dbConfig['store_name'] || env.STORE_NAME,
        description: dbConfig['store_description'] || env.STORE_DESCRIPTION,
        slogan: dbConfig['store_slogan'] || env.STORE_SLOGAN || null,
        logo: dbConfig['store_logo'] || env.STORE_LOGO || null,
        favicon: dbConfig['store_favicon'] || env.STORE_FAVICON || null,
        email: dbConfig['store_email'] || env.STORE_EMAIL || null,
        phone: dbConfig['store_phone'] || env.STORE_PHONE || null,
        url: dbConfig['store_url'] || env.STORE_URL,
        freeShippingFrom: parseInt(dbConfig['free_shipping_from'] || '200000'),
        transferDiscount: dbConfig['transfer_discount'] || '15%',
        returnDays: parseInt(dbConfig['return_days'] || '30'),
        installments: parseInt(dbConfig['installments'] || '6'),
      },
      address: {
        street: dbConfig['address_street'] || env.STORE_ADDRESS_STREET || null,
        city: dbConfig['address_city'] || env.STORE_ADDRESS_CITY || null,
        province: dbConfig['address_province'] || env.STORE_ADDRESS_PROVINCE || null,
        postal: dbConfig['address_postal'] || env.STORE_ADDRESS_POSTAL || null,
        full: [
          dbConfig['address_street'] || env.STORE_ADDRESS_STREET,
          dbConfig['address_city'] || env.STORE_ADDRESS_CITY,
          dbConfig['address_province'] || env.STORE_ADDRESS_PROVINCE,
        ].filter(Boolean).join(', ') || null,
      },
      social: {
        whatsapp: dbConfig['social_whatsapp'] || env.SOCIAL_WHATSAPP || null,
        whatsappUrl: (dbConfig['social_whatsapp'] || env.SOCIAL_WHATSAPP) 
          ? `https://wa.me/${(dbConfig['social_whatsapp'] || env.SOCIAL_WHATSAPP || '').replace(/\D/g, '')}`
          : null,
        instagram: dbConfig['social_instagram'] || env.SOCIAL_INSTAGRAM || null,
        instagramUrl: (dbConfig['social_instagram'] || env.SOCIAL_INSTAGRAM) 
          ? `https://instagram.com/${(dbConfig['social_instagram'] || env.SOCIAL_INSTAGRAM || '').replace('@', '')}`
          : null,
        facebook: dbConfig['social_facebook'] || env.SOCIAL_FACEBOOK || null,
        facebookUrl: (dbConfig['social_facebook'] || env.SOCIAL_FACEBOOK)
          ? ((dbConfig['social_facebook'] || env.SOCIAL_FACEBOOK || '').startsWith('http') 
              ? (dbConfig['social_facebook'] || env.SOCIAL_FACEBOOK)
              : `https://facebook.com/${dbConfig['social_facebook'] || env.SOCIAL_FACEBOOK}`)
          : null,
        tiktok: dbConfig['social_tiktok'] || env.SOCIAL_TIKTOK || null,
        tiktokUrl: (dbConfig['social_tiktok'] || env.SOCIAL_TIKTOK)
          ? `https://tiktok.com/@${(dbConfig['social_tiktok'] || env.SOCIAL_TIKTOK || '').replace('@', '')}`
          : null,
      },
      theme: {
        primaryColor: dbConfig['theme_primary'] || env.THEME_PRIMARY_COLOR,
        secondaryColor: dbConfig['theme_secondary'] || env.THEME_SECONDARY_COLOR,
        accentColor: dbConfig['theme_accent'] || env.THEME_ACCENT_COLOR,
        accentHoverColor: dbConfig['theme_accent_hover'] || env.THEME_ACCENT_COLOR,
        backgroundColor: dbConfig['theme_background'] || env.THEME_BACKGROUND_COLOR,
        textColor: dbConfig['theme_text'] || env.THEME_TEXT_COLOR,
        iconColor: dbConfig['theme_icon'] || env.THEME_ICON_COLOR,
      },
      fonts: {
        heading: dbConfig['theme_font_heading'] || 'Bebas Neue',
        body: dbConfig['theme_font_body'] || 'Inter',
      },
      paymentMethods: (dbConfig['payment_methods'] || 'Mercado Pago,Tarjetas de crédito,Tarjetas de débito,Transferencia bancaria').split(','),
      features: {
        cloudinaryEnabled: !!(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY),
        smtpEnabled: !!(env.SMTP_HOST && env.SMTP_USER),
        shippingProvider: env.SHIPPING_PROVIDER,
        // AI Try-On is enabled if store has its own HuggingFace API key
        aiTryOnEnabled: !!dbConfig['huggingface_api_key'],
      },
      // Page Builder blocks
      homepageBlocks: dbConfig['homepage_blocks'] ? JSON.parse(dbConfig['homepage_blocks']) : [],
      aboutBlocks: dbConfig['about_blocks'] ? JSON.parse(dbConfig['about_blocks']) : [],
      // isConfigured: true only if this specific store has been set up
      isConfigured: storeConfigured,
    });
  } catch (error) {
    console.error('Get store config error:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
}

/**
 * Update store configuration (Admin only)
 * This endpoint requires authentication
 */
export async function updateStoreConfig(req: Request, res: Response) {
  try {
    const updates = req.body;
    
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Datos de configuración inválidos' });
    }

    // Get storeId from authenticated user
    const storeId = (req as any).user?.storeId;
    if (!storeId) {
      return res.status(400).json({ error: 'Store ID not found in authenticated user' });
    }
    
    // Map frontend config structure to database keys
    const configMap: Record<string, string | undefined> = {
      // Store info
      'store_name': updates.name,
      'store_slogan': updates.tagline,
      'store_logo': updates.logo,
      'store_email': updates.email,
      'store_phone': updates.phone,
      'free_shipping_from': updates.freeShippingFrom?.toString(),
      'transfer_discount': updates.transferDiscount,
      'return_days': updates.returnDays?.toString(),
      'installments': updates.installments?.toString(),
      
      // Address
      'address_street': updates.address,
      'address_city': updates.city,
      
      // Social
      'social_whatsapp': updates.whatsapp,
      'social_instagram': updates.instagram?.replace('@', ''),
      
      // Theme colors
      'theme_primary': updates.colors?.primary,
      'theme_secondary': updates.colors?.secondary,
      'theme_accent': updates.colors?.accent,
      'theme_accent_hover': updates.colors?.accentHover,
      'theme_icon': updates.colors?.icon,
      'theme_text': updates.colors?.text,
      'theme_background': updates.colors?.background,
      
      // Fonts
      'theme_font_heading': updates.fonts?.heading,
      'theme_font_body': updates.fonts?.body,
      
      // Payment methods
      'payment_methods': updates.paymentMethods?.join(','),
      
      // Setup complete flag
      'is_configured': updates.isConfigured === true ? 'true' : undefined,

      // Homepage Blocks (PageBuilder)
      'homepage_blocks': updates.homepageBlocks ? JSON.stringify(updates.homepageBlocks) : undefined,
      
      // About Blocks (About Page Builder)
      'about_blocks': updates.aboutBlocks ? JSON.stringify(updates.aboutBlocks) : undefined,
      
      // AI Integration - HuggingFace API Key (encrypted automatically)
      'huggingface_api_key': updates.huggingfaceApiKey,
    };
    
    // Save each non-undefined value
    const savedKeys: string[] = [];
    for (const [key, value] of Object.entries(configMap)) {
      if (value !== undefined && value !== null) {
        await configService.setConfigValue(key, value, storeId);
        savedKeys.push(key);
      }
    }
    
    console.log(`✅ Config updated: ${savedKeys.length} keys saved`);
    
    res.json({ 
      success: true, 
      message: 'Configuración guardada correctamente',
      updatedKeys: savedKeys.length 
    });
  } catch (error) {
    console.error('Update store config error:', error);
    res.status(500).json({ error: 'Error al guardar configuración' });
  }
}

/**
 * Get MercadoPago public key for frontend checkout
 * This endpoint is PUBLIC - no authentication required
 */
export async function getMPPublicKey(req: Request, res: Response) {
  try {
    res.json({
      publicKey: env.MP_PUBLIC_KEY,
    });
  } catch (error) {
    console.error('Get MP public key error:', error);
    res.status(500).json({ error: 'Error al obtener clave pública' });
  }
}

/**
 * Initial setup - PUBLIC endpoint for first-time configuration
 * Only works if store is not already configured
 */
export async function initialSetup(req: Request, res: Response) {
  try {
    const message = await configService.initialSetup(req.body);
    
    console.log('✅ Initial setup completed');
    
    res.json({ 
      success: true, 
      message
    });
  } catch (error: any) {
    console.error('Initial setup error:', error);
    if (error.message === 'La tienda ya está configurada') {
      return res.status(403).json({ error: error.message });
    }
    if (error.message === 'Datos de configuración inválidos') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al configurar la tienda' });
  }
}

