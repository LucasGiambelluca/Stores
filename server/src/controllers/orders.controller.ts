import { Request, Response } from 'express';
import { ordersService } from '../services/orders.service.js';

/**
 * Create order
 */
// Create order
export async function createOrder(req: Request, res: Response) {
  try {
    const userId = req.user?.id || null;
    // Get storeId from request (injected by middleware)
    const storeId = (req as any).storeId || (req as any).user?.storeId;
    
    // Note: For public checkout, storeId should be in req.storeId from domain middleware.
    // If not present, we might have an issue, but service will try to infer or throw.
    
    const result = await ordersService.createOrder(req.body, userId, storeId);

    res.status(201).json({
      message: 'Orden creada',
      order: result
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    
    if (error.message?.includes('ORDER_LIMIT_EXCEEDED')) {
      return res.status(403).json({ 
        error: 'Límite de órdenes alcanzado',
        message: error.message.split(': ')[1]
      });
    }
    if (error.message?.includes('NO_LICENSE')) {
      return res.status(403).json({ error: 'Licencia no válida' });
    }
    if (error.message === 'Datos de orden incompletos' || 
        error.message === 'Stock insuficiente' || 
        error.message === 'No se encontraron los productos' || 
        error.message === 'Los productos pertenecen a diferentes tiendas') {
      return res.status(400).json({ 
        error: error.message,
        details: (error as any).details 
      });
    }

    res.status(500).json({ error: 'Error al crear orden' });
  }
}

// Get order by ID or order number
export async function getOrder(req: Request, res: Response) {
  try {
    const { id } = req.params;
    // Pass storeId for isolation if available (e.g. from admin or public domain)
    const storeId = (req as any).storeId || (req as any).user?.storeId;
    
    const order = await ordersService.getOrder(id, storeId);
    res.json({ order });
  } catch (error: any) {
    console.error('Get order error:', error);
    if (error.message === 'Orden no encontrada') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al obtener orden' });
  }
}

// Get user orders
export async function getUserOrders(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    // Pass storeId from user token or request context
    const storeId = req.user.storeId || (req as any).storeId;
    const orders = await ordersService.getUserOrders(req.user.id, storeId);
    res.json({ orders });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
}

// Get all orders (admin)
export async function getAllOrders(req: Request, res: Response) {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    // Require storeId for admin operations
    const storeId = (req as any).user?.storeId || (req as any).storeId;
    if (!storeId) {
      return res.status(400).json({ error: 'Store context required' });
    }
    
    const result = await ordersService.getAllOrders(
      storeId,
      status as string, 
      Number(limit), 
      Number(offset)
    );
    res.json(result);
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
}

// Update order status (admin)
export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Require storeId for admin operations
    const storeId = (req as any).user?.storeId || (req as any).storeId;
    if (!storeId) {
      return res.status(400).json({ error: 'Store context required' });
    }
    
    await ordersService.updateOrderStatus(id, storeId, req.body);
    res.json({ message: 'Orden actualizada' });
  } catch (error: any) {
    console.error('Update order status error:', error);
    if (error.message === 'Orden no encontrada') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Estado inválido') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al actualizar orden' });
  }
}

// Upload payment receipt (transfer proof)
export async function uploadReceipt(req: Request, res: Response) {
  try {
    const { orderId } = req.params;
    const { receiptUrl } = req.body;
    
    // Pass storeId if available (e.g. from domain)
    const storeId = (req as any).storeId;
    
    const result = await ordersService.uploadReceipt(orderId, receiptUrl, storeId);
    
    res.json({ 
      message: 'Comprobante subido exitosamente',
      order: result
    });
  } catch (error: any) {
    console.error('Upload receipt error:', error);
    if (error.message === 'URL del comprobante requerida') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'Orden no encontrada') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al subir comprobante' });
  }
}

// Verify payment receipt (admin)
export async function verifyReceipt(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { approved, notes } = req.body;
    
    // Require storeId for admin operations
    const storeId = (req as any).user?.storeId || (req as any).storeId;
    if (!storeId) {
      return res.status(400).json({ error: 'Store context required' });
    }
    
    const message = await ordersService.verifyReceipt(id, approved, storeId, notes);
    res.json({ message });
  } catch (error: any) {
    console.error('Verify receipt error:', error);
    if (error.message === 'Orden no encontrada') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Esta orden no tiene comprobante adjunto') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al verificar comprobante' });
  }
}

// Get orders pending receipt verification (admin)
export async function getPendingReceipts(req: Request, res: Response) {
  try {
    // Require storeId for admin operations
    const storeId = (req as any).user?.storeId || (req as any).storeId;
    if (!storeId) {
      return res.status(400).json({ error: 'Store context required' });
    }

    const orders = await ordersService.getPendingReceipts(storeId);
    res.json({ orders });
  } catch (error) {
    console.error('Get pending receipts error:', error);
    res.status(500).json({ error: 'Error al obtener órdenes pendientes' });
  }
}

