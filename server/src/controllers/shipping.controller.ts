import { Request, Response } from 'express';
import * as shippingService from '../services/shipping.service.js';

// Shipping carriers configuration
interface ShippingCarrier {
  id: string;
  name: string;
  enabled: boolean;
  logo?: string;
}

interface ShippingQuote {
  carrier: string;
  carrierName: string;
  service: string;
  price: number;
  estimatedDays: { min: number; max: number };
  isFree: boolean;
}

// Store shipping config from DB or defaults
function getShippingConfig() {
  return {
    freeShippingThreshold: 200000, // $200.000 in centavos
    defaultOriginZip: '8000', // Bahía Blanca
    carriers: [
      { id: 'correo', name: 'Correo Argentino', enabled: true },
      { id: 'andreani', name: 'Andreani', enabled: false },
      { id: 'local', name: 'Retiro en Local', enabled: true },
    ],
  };
}

// Calculate shipping cost (simplified pricing based on zones)
function calculateShippingCost(originZip: string, destZip: string, weight: number): number {
  // Zone-based pricing (simplified)
  const destProvince = getProvinceFromZip(destZip);
  
  // Base prices by zone (in centavos)
  const zonePrices: Record<string, number> = {
    'local': 0,        // Same city
    'cercana': 350000,  // $3.500
    'media': 550000,    // $5.500
    'lejana': 750000,   // $7.500
  };

  // Determine zone
  let zone = 'media';
  if (destZip.startsWith('8')) zone = 'cercana'; // Buenos Aires Sur, Patagonia Norte
  if (['1', '2', '3', '4', '5', '6', '7'].some(p => destZip.startsWith(p))) zone = 'media';
  if (['9'].some(p => destZip.startsWith(p))) zone = 'lejana'; // Patagonia Sur
  
  // Same zip = local pickup possible
  if (originZip === destZip) zone = 'local';

  return zonePrices[zone] || zonePrices['media'];
}

function getProvinceFromZip(zip: string): string {
  // Simplified mapping
  const firstDigit = zip.charAt(0);
  const mapping: Record<string, string> = {
    '1': 'Buenos Aires',
    '2': 'Santa Fe',
    '3': 'Entre Ríos',
    '4': 'Tucumán',
    '5': 'Córdoba',
    '6': 'La Pampa',
    '7': 'Neuquén',
    '8': 'Buenos Aires Sur',
    '9': 'Patagonia Sur',
  };
  return mapping[firstDigit] || 'Argentina';
}

// Get shipping quote
export async function getQuote(req: Request, res: Response) {
  try {
    const { postalCode, items, subtotal } = req.body;

    if (!postalCode) {
      return res.status(400).json({ error: 'Código postal requerido' });
    }

    const config = getShippingConfig();
    const originZip = config.defaultOriginZip;
    
    // Calculate weight (default 500g per item if not specified)
    const totalWeight = items?.reduce((sum: number, item: any) => {
      return sum + (item.weight || 500) * (item.quantity || 1);
    }, 0) || 1000;

    const quotes: ShippingQuote[] = [];

    // Check for free shipping
    const isFreeShipping = subtotal >= config.freeShippingThreshold;

    // Correo Argentino quote
    if (config.carriers.find(c => c.id === 'correo')?.enabled) {
      const basePrice = calculateShippingCost(originZip, postalCode, totalWeight);
      
      quotes.push({
        carrier: 'correo',
        carrierName: 'Correo Argentino',
        service: 'Envío Estándar',
        price: isFreeShipping ? 0 : basePrice,
        estimatedDays: { min: 3, max: 6 },
        isFree: isFreeShipping,
      });

      // Express option
      quotes.push({
        carrier: 'correo_express',
        carrierName: 'Correo Argentino',
        service: 'Envío Express',
        price: isFreeShipping ? 0 : Math.round(basePrice * 1.5),
        estimatedDays: { min: 1, max: 3 },
        isFree: isFreeShipping,
      });
    }

    // Local pickup (always available in Bahía Blanca)
    if (config.carriers.find(c => c.id === 'local')?.enabled) {
      quotes.push({
        carrier: 'local',
        carrierName: 'Retiro en Local',
        service: 'San Lorenzo 1730, Bahía Blanca',
        price: 0,
        estimatedDays: { min: 1, max: 1 },
        isFree: true,
      });
    }

    res.json({
      quotes,
      freeShippingThreshold: config.freeShippingThreshold,
      qualifiesForFreeShipping: isFreeShipping,
    });
  } catch (error) {
    console.error('Get quote error:', error);
    res.status(500).json({ error: 'Error al calcular envío' });
  }
}

// Get available carriers
export async function getCarriers(req: Request, res: Response) {
  try {
    const config = getShippingConfig();
    
    res.json({
      carriers: config.carriers.filter(c => c.enabled),
      freeShippingThreshold: config.freeShippingThreshold,
    });
  } catch (error) {
    console.error('Get carriers error:', error);
    res.status(500).json({ error: 'Error al obtener transportistas' });
  }
}

// Validate postal code
export async function validatePostalCode(req: Request, res: Response) {
  try {
    const { postalCode } = req.params;

    // Basic validation
    const isValid = /^\d{4}$/.test(postalCode);
    
    if (!isValid) {
      return res.json({ valid: false, message: 'Código postal debe tener 4 dígitos' });
    }

    // Get province/city info
    const province = getProvinceFromZip(postalCode);

    res.json({
      valid: true,
      postalCode,
      province,
    });
  } catch (error) {
    console.error('Validate postal code error:', error);
    res.status(500).json({ error: 'Error al validar código postal' });
  }
}

// ============================================
// NEW ENDPOINTS FOR LABEL GENERATION & TRACKING
// ============================================

// Create shipment and generate label (Admin)
export async function createShipment(req: Request, res: Response) {
  try {
    const { orderId, carrier } = req.body;
    
    // Require storeId for admin operations
    const storeId = (req as any).user?.storeId || (req as any).storeId;
    if (!storeId) {
      return res.status(400).json({ error: 'Store context required' });
    }

    if (!orderId) {
      return res.status(400).json({ error: 'orderId es requerido' });
    }

    const result = await shippingService.createShipment({
      orderId,
      carrier: carrier || undefined,
      storeId,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      message: 'Envío creado exitosamente',
      shipment: result.shipment,
    });
  } catch (error) {
    console.error('Create shipment error:', error);
    res.status(500).json({ error: 'Error al crear envío' });
  }
}

// Get label HTML for an order (Admin)
export async function getLabel(req: Request, res: Response) {
  try {
    const { orderId } = req.params;
    
    // Require storeId for admin operations
    const storeId = (req as any).user?.storeId || (req as any).storeId;
    if (!storeId) {
      return res.status(400).json({ error: 'Store context required' });
    }

    const labelData = await shippingService.getLabelData(orderId, storeId);

    if (!labelData) {
      return res.status(404).json({ error: 'Etiqueta no encontrada' });
    }

    // Return as HTML
    res.setHeader('Content-Type', 'text/html');
    res.send(labelData);
  } catch (error) {
    console.error('Get label error:', error);
    res.status(500).json({ error: 'Error al obtener etiqueta' });
  }
}

// Get shipment info for an order (Admin)
export async function getShipmentByOrder(req: Request, res: Response) {
  try {
    const { orderId } = req.params;
    
    // Require storeId for admin operations
    const storeId = (req as any).user?.storeId || (req as any).storeId;
    if (!storeId) {
      return res.status(400).json({ error: 'Store context required' });
    }

    const shipment = await shippingService.getShipmentByOrderId(orderId, storeId);

    if (!shipment) {
      return res.status(404).json({ error: 'Envío no encontrado' });
    }

    res.json({ shipment });
  } catch (error) {
    console.error('Get shipment error:', error);
    res.status(500).json({ error: 'Error al obtener información de envío' });
  }
}

// Get tracking info by tracking number (Public)
export async function getTrackingByNumber(req: Request, res: Response) {
  try {
    const { trackingNumber } = req.params;
    
    // Pass storeId if available (e.g. from domain)
    const storeId = (req as any).storeId;

    if (!trackingNumber) {
      return res.status(400).json({ error: 'Número de seguimiento requerido' });
    }

    const result = await shippingService.getTracking(trackingNumber, storeId);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json({ tracking: result.tracking });
  } catch (error) {
    console.error('Get tracking error:', error);
    res.status(500).json({ error: 'Error al obtener seguimiento' });
  }
}

// Get tracking info by order number (Public)
export async function getTrackingByOrder(req: Request, res: Response) {
  try {
    const { orderNumber } = req.params;
    
    // Pass storeId if available (e.g. from domain)
    const storeId = (req as any).storeId;

    if (!orderNumber) {
      return res.status(400).json({ error: 'Número de orden requerido' });
    }

    const result = await shippingService.getTrackingByOrderNumber(orderNumber, storeId);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json({ tracking: result.tracking });
  } catch (error) {
    console.error('Get tracking by order error:', error);
    res.status(500).json({ error: 'Error al obtener seguimiento' });
  }
}
