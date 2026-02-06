import { Request, Response } from 'express';
import { LandingService } from '../services/landing.service.js';

export async function getLandingConfig(req: Request, res: Response) {
  try {
    const config = await LandingService.get();
    // Return empty object if no config found, or the content
    res.json({ content: config?.content || null });
  } catch (error) {
    console.error('Get landing config error:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
}

export async function updateLandingConfig(req: Request, res: Response) {
  try {
    const { content } = req.body;
    // req.user is populated by auth middleware
    const updatedBy = req.user?.id; 
    
    await LandingService.update(content, updatedBy);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update landing config error:', error);
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
}
