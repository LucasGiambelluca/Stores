/**
 * System Settings Controller
 * API endpoints for managing global configuration from Mothership
 */

import { Request, Response } from 'express';
import { SystemSettingsService } from '../services/system-settings.service.js';

/**
 * Get system settings (masked for display)
 * GET /api/system/settings
 */
export async function getSettings(req: Request, res: Response) {
  try {
    const settings = await SystemSettingsService.getMasked();
    res.json(settings);
  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
}

/**
 * Update system settings
 * PUT /api/system/settings
 */
export async function updateSettings(req: Request, res: Response) {
  try {
    const updatedBy = req.user?.email || 'unknown';
    
    await SystemSettingsService.update(req.body, updatedBy);
    
    const settings = await SystemSettingsService.getMasked();
    
    res.json({
      message: 'Configuración actualizada',
      settings,
    });
  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
}

/**
 * Test SMTP configuration
 * POST /api/system/settings/test-smtp
 */
export async function testSmtp(req: Request, res: Response) {
  try {
    const settings = await SystemSettingsService.getDecrypted();
    
    if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPass) {
      return res.status(400).json({ error: 'SMTP no está configurado' });
    }

    // Import nodemailer dynamically
    const nodemailer = await import('nodemailer');
    
    const transportOptions = {
      host: settings.smtpHost,
      port: parseInt(settings.smtpPort || '587'),
      secure: settings.smtpSecure ?? false,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      },
    };
    
    const transporter = nodemailer.default.createTransport(transportOptions as any);

    // Verify connection
    await transporter.verify();

    res.json({ 
      success: true, 
      message: 'Conexión SMTP exitosa' 
    });
  } catch (error: any) {
    console.error('SMTP test error:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message || 'Error al conectar con SMTP' 
    });
  }
}

/**
 * Test Sentry configuration
 * POST /api/system/settings/test-sentry
 */
export async function testSentry(req: Request, res: Response) {
  try {
    const settings = await SystemSettingsService.getDecrypted();
    
    if (!settings?.sentryDsn) {
      return res.status(400).json({ error: 'Sentry DSN no está configurado' });
    }

    // Just validate the DSN format
    const dsnRegex = /^https:\/\/[a-f0-9]+@[a-z0-9]+\.ingest\.sentry\.io\/\d+$/;
    if (!dsnRegex.test(settings.sentryDsn)) {
      return res.status(400).json({ error: 'Formato de DSN inválido' });
    }

    res.json({ 
      success: true, 
      message: 'DSN de Sentry válido' 
    });
  } catch (error: any) {
    console.error('Sentry test error:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message || 'Error al validar Sentry' 
    });
  }
}
