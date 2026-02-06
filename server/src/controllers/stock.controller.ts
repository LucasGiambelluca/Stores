/**
 * Stock Controller
 * 
 * Endpoints for stock management and alerts.
 */

import { Request, Response } from 'express';
import * as stockService from '../services/stock.service.js';

// GET /api/admin/stock/summary
export async function getStockSummary(req: Request, res: Response) {
  try {
    const storeId = req.storeId;
    if (!storeId) {
      return res.status(400).json({ error: 'Store ID requerido' });
    }

    const summary = await stockService.getStockSummary(storeId);
    res.json(summary);
  } catch (error) {
    console.error('Stock summary error:', error);
    res.status(500).json({ error: 'Error al obtener resumen de stock' });
  }
}

// GET /api/admin/stock/low
export async function getLowStock(req: Request, res: Response) {
  try {
    const storeId = req.storeId;
    if (!storeId) {
      return res.status(400).json({ error: 'Store ID requerido' });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const result = await stockService.getLowStockProducts(storeId, limit);
    res.json(result);
  } catch (error) {
    console.error('Low stock error:', error);
    res.status(500).json({ error: 'Error al obtener productos con stock bajo' });
  }
}

// GET /api/admin/stock/out-of-stock
export async function getOutOfStock(req: Request, res: Response) {
  try {
    const storeId = req.storeId;
    if (!storeId) {
      return res.status(400).json({ error: 'Store ID requerido' });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const result = await stockService.getOutOfStockProducts(storeId, limit);
    res.json(result);
  } catch (error) {
    console.error('Out of stock error:', error);
    res.status(500).json({ error: 'Error al obtener productos sin stock' });
  }
}

// GET /api/admin/stock/threshold
export async function getThreshold(req: Request, res: Response) {
  try {
    const storeId = req.storeId;
    if (!storeId) {
      return res.status(400).json({ error: 'Store ID requerido' });
    }

    const threshold = await stockService.getLowStockThreshold(storeId);
    res.json({ threshold });
  } catch (error) {
    console.error('Get threshold error:', error);
    res.status(500).json({ error: 'Error al obtener umbral' });
  }
}

// PUT /api/admin/stock/threshold
export async function setThreshold(req: Request, res: Response) {
  try {
    const storeId = req.storeId;
    if (!storeId) {
      return res.status(400).json({ error: 'Store ID requerido' });
    }

    const { threshold } = req.body;
    if (typeof threshold !== 'number' || threshold < 0) {
      return res.status(400).json({ error: 'Umbral inválido' });
    }

    await stockService.setLowStockThreshold(storeId, threshold);
    res.json({ success: true, threshold });
  } catch (error) {
    console.error('Set threshold error:', error);
    res.status(500).json({ error: 'Error al actualizar umbral' });
  }
}

// POST /api/admin/stock/send-alert
export async function sendStockAlert(req: Request, res: Response) {
  try {
    const storeId = req.storeId;
    if (!storeId) {
      return res.status(400).json({ error: 'Store ID requerido' });
    }

    const adminEmail = req.user?.email;
    if (!adminEmail) {
      return res.status(400).json({ error: 'Email de admin requerido' });
    }

    const result = await stockService.checkAndSendLowStockAlerts(storeId, adminEmail);
    res.json(result);
  } catch (error) {
    console.error('Send alert error:', error);
    res.status(500).json({ error: 'Error al enviar alerta' });
  }
}
