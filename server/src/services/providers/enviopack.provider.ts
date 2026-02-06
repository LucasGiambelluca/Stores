// Enviopack Shipping Provider
// API Documentation: https://www.enviopack.com.ar/documentacion
// Requires: ENVIOPACK_API_KEY and ENVIOPACK_SECRET_KEY in .env

import { ShipmentInput, ShipmentResult, TrackingResult, TrackingEvent } from './mock.provider.js';

const API_BASE_URL = 'https://api.enviopack.com';

// Token cache to avoid re-authenticating every request
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

// Get access token (cached for 4 hours)
async function getAccessToken(): Promise<string> {
  const apiKey = process.env.ENVIOPACK_API_KEY;
  const secretKey = process.env.ENVIOPACK_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error('ENVIOPACK_API_KEY y ENVIOPACK_SECRET_KEY son requeridos');
  }

  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 300000) {
    return cachedToken.accessToken;
  }

  const response = await fetch(`${API_BASE_URL}/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'api-key': apiKey,
      'secret-key': secretKey,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error de autenticación Enviopack: ${error}`);
  }

  const data = await response.json() as { token: string };
  
  // Cache token for ~4 hours
  cachedToken = {
    accessToken: data.token,
    expiresAt: Date.now() + (3.5 * 60 * 60 * 1000), // 3.5 hours
  };

  return data.token;
}

// Make authenticated API request
async function apiRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<any> {
  const token = await getAccessToken();
  
  const url = `${API_BASE_URL}${endpoint}?access_token=${token}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Enviopack API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Get shipping quote from Enviopack
export async function getQuote(
  originZip: string,
  destZip: string,
  weight: number, // in grams
  declaredValue: number // in centavos
): Promise<any[]> {
  try {
    const quotes = await apiRequest('/cotizar', 'POST', {
      codigo_postal_origen: originZip,
      codigo_postal_destino: destZip,
      peso: weight / 1000, // Convert to kg
      valor_declarado: declaredValue / 100, // Convert to pesos
    });

    return quotes.map((q: any) => ({
      carrier: 'enviopack',
      carrierId: q.correo_id,
      carrierName: q.correo_nombre,
      service: q.servicio_nombre,
      serviceId: q.servicio_id,
      price: Math.round(q.precio * 100), // Convert to centavos
      estimatedDays: {
        min: q.dias_entrega_min || 3,
        max: q.dias_entrega_max || 7,
      },
    }));
  } catch (error) {
    console.error('Enviopack quote error:', error);
    throw error;
  }
}

// Parse address into components
function parseAddress(address: string): { street: string; number: string; city: string; province: string; postalCode: string } {
  // Try to extract postal code (4 digits)
  const postalMatch = address.match(/\b(\d{4})\b/);
  const postalCode = postalMatch ? postalMatch[1] : '8000';
  
  // Simple parsing - can be improved
  const parts = address.split(',').map(p => p.trim());
  
  return {
    street: parts[0] || address,
    number: '',
    city: parts[1] || 'Bahía Blanca',
    province: parts[2] || 'Buenos Aires',
    postalCode,
  };
}

// Create shipment in Enviopack
export async function createShipment(input: ShipmentInput): Promise<ShipmentResult> {
  try {
    const parsedAddress = parseAddress(input.shippingAddress);
    
    // First, create the order (pedido) in Enviopack
    const orderPayload = {
      // Reference
      id_externo: input.orderId,
      numero: input.orderNumber,
      
      // Recipient (destinatario)
      destinatario: {
        nombre: input.customerName,
        email: input.customerEmail,
        telefono: input.customerPhone || '',
        documento: '',
        calle: parsedAddress.street,
        numero: parsedAddress.number,
        piso: '',
        depto: '',
        codigo_postal: parsedAddress.postalCode,
        localidad: parsedAddress.city,
        provincia: parsedAddress.province,
      },
      
      // Origin (sender) - from env vars
      remitente: {
        nombre: process.env.SHIPPING_ORIGIN_NAME || '',
        email: process.env.SHIPPING_ORIGIN_EMAIL || '',
        telefono: process.env.SHIPPING_ORIGIN_PHONE || '',
        calle: process.env.SHIPPING_ORIGIN_ADDRESS || '',
        numero: process.env.SHIPPING_ORIGIN_NUMBER || '',
        codigo_postal: process.env.SHIPPING_ORIGIN_POSTAL_CODE || '',
        localidad: process.env.SHIPPING_ORIGIN_CITY || '',
        provincia: process.env.SHIPPING_ORIGIN_PROVINCE || '',
      },
      
      // Package info
      paquetes: [{
        peso: input.items.reduce((sum, item) => sum + (item.quantity * 0.3), 0), // Estimate 300g per item
        alto: 10,
        ancho: 30,
        largo: 40,
      }],
      
      // Products/Items
      productos: input.items.map(item => ({
        nombre: item.name,
        cantidad: item.quantity,
        precio: item.price / 100, // Convert centavos to pesos
      })),
      
      // Value
      valor_declarado: input.total / 100, // Convert to pesos
    };

    // Create order
    const order = await apiRequest('/pedidos', 'POST', orderPayload);
    
    if (!order || !order.id) {
      throw new Error('No se pudo crear el pedido en Enviopack');
    }

    // Generate shipment from order (this creates the shipping label)
    const shipment = await apiRequest(`/pedidos/${order.id}/envios`, 'POST', {
      modalidad: 'D', // Delivery (D) or Pickup (S)
    });

    if (!shipment || !shipment.id) {
      throw new Error('No se pudo generar el envío en Enviopack');
    }

    // Get the label URL
    const labelUrl = `${API_BASE_URL}/envios/${shipment.id}/etiqueta?access_token=${await getAccessToken()}`;

    return {
      success: true,
      trackingNumber: shipment.tracking_number || shipment.id.toString(),
      labelUrl,
      labelData: labelUrl, // For Enviopack, we use URL (PDF)
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      carrier: 'enviopack',
      carrierResponse: {
        orderId: order.id,
        shipmentId: shipment.id,
        provider: 'enviopack',
      },
    };
  } catch (error: any) {
    console.error('Enviopack create shipment error:', error);
    return {
      success: false,
      trackingNumber: '',
      labelUrl: '',
      labelData: '',
      estimatedDelivery: '',
      carrier: 'enviopack',
      error: error.message || 'Error al crear envío en Enviopack',
    };
  }
}

// Get tracking info from Enviopack
export async function getTracking(trackingNumber: string): Promise<TrackingResult> {
  try {
    // Search for shipment by tracking number
    const shipments = await apiRequest(`/envios?tracking=${trackingNumber}`);
    
    if (!shipments || shipments.length === 0) {
      return {
        success: false,
        trackingNumber,
        status: 'unknown',
        events: [],
        carrier: 'enviopack',
        error: 'Envío no encontrado',
      };
    }

    const shipment = shipments[0];
    
    // Get tracking events
    const events: TrackingEvent[] = (shipment.estados || []).map((state: any) => ({
      date: state.fecha?.split(' ')[0] || '',
      time: state.fecha?.split(' ')[1] || '',
      status: mapEnviopackStatus(state.estado),
      location: state.sucursal || '',
      description: state.descripcion || state.estado,
    }));

    // Determine current status
    const currentStatus = mapEnviopackStatus(shipment.estado);

    return {
      success: true,
      trackingNumber,
      status: currentStatus,
      estimatedDelivery: shipment.fecha_estimada_entrega,
      events,
      carrier: 'enviopack',
    };
  } catch (error: any) {
    console.error('Enviopack tracking error:', error);
    return {
      success: false,
      trackingNumber,
      status: 'unknown',
      events: [],
      carrier: 'enviopack',
      error: error.message || 'Error al obtener tracking',
    };
  }
}

// Map Enviopack status to our internal status
function mapEnviopackStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pendiente': 'pending',
    'en_preparacion': 'created',
    'despachado': 'shipped',
    'en_transito': 'in_transit',
    'en_distribucion': 'in_transit',
    'entregado': 'delivered',
    'no_entregado': 'failed',
    'devuelto': 'failed',
  };
  
  return statusMap[status?.toLowerCase()] || 'in_transit';
}

// Get label PDF URL
export async function getLabel(shipmentId: string): Promise<string> {
  const token = await getAccessToken();
  return `${API_BASE_URL}/envios/${shipmentId}/etiqueta?access_token=${token}`;
}

export default {
  getQuote,
  createShipment,
  getTracking,
  getLabel,
};
