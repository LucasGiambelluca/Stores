/**
 * Andreani Shipping Provider
 * API Documentation: https://developers.andreani.com/document
 * 
 * Authentication:
 * - GET /login with Basic Auth (username:password base64)
 * - Returns token valid for 24 hours
 * - Use token in header: x-authorization-token
 * 
 * Main Endpoints:
 * - POST /v2/ordenes-de-envio - Create order
 * - GET /v2/ordenes-de-envio/{numeroAndreani} - Order status
 * - GET /v2/ordenes-de-envio/{numeroAndreani}/etiquetas - Get labels
 * - GET /v2/envios/{numeroAndreani} - Shipment status
 * - GET /v2/envios/{numeroAndreani}/trazas - Tracking traces
 * - GET /v1/tarifas - Quotes (no auth required)
 * - GET /v2/sucursales - Branches (no auth required)
 * - GET /v1/localidades - Locations (no auth required)
 * 
 * Credentials are loaded from database config (via admin panel)
 */

import { ShipmentResult, TrackingResult, getShippingConfig } from '../shipping.types.js';

// API URLs
const API_URL_TEST = 'https://apisqa.andreani.com';
const API_URL_PROD = 'https://apis.andreani.com';

// Token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

function getConfig() {
  return getShippingConfig();
}

function getApiUrl(): string {
  const config = getConfig();
  const env = config.andreani?.env || 'test';
  return env === 'production' ? API_URL_PROD : API_URL_TEST;
}

// ============================================
// Authentication - Get Token
// ============================================
async function getToken(): Promise<string> {
  // Check cached token
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const config = getConfig();
  const username = config.andreani?.username;
  const password = config.andreani?.password;

  if (!username || !password) {
    throw new Error('Usuario y Contraseña de Andreani son requeridos. Configurá las credenciales en Admin > Envíos.');
  }

  try {
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    
    const response = await fetch(`${getApiUrl()}/login`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error de autenticación: ${response.status}`);
    }

    const token = response.headers.get('x-authorization-token') || await response.text();
    
    // Cache token for 23 hours (tokens last 24 hours)
    cachedToken = {
      token,
      expiresAt: Date.now() + (23 * 60 * 60 * 1000),
    };

    return token;
  } catch (error: any) {
    console.error('Andreani auth error:', error);
    throw new Error('Error al autenticar con Andreani');
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return {
    'x-authorization-token': token,
    'Content-Type': 'application/json',
  };
}

// ============================================
// Get Branches (Sucursales) - No auth required
// ============================================
export interface Branch {
  id: string;
  descripcion: string;
  direccion: {
    calle: string;
    numero: string;
    localidad: string;
    codigoPostal: string;
    provincia: string;
  };
  telefono: string;
  horarioAtencion: string;
  coordenadas: {
    latitud: number;
    longitud: number;
  };
}

export async function getBranches(codigoPostal?: string): Promise<Branch[]> {
  try {
    let url = `${getApiUrl()}/v2/sucursales`;
    if (codigoPostal) {
      url += `?codigoPostal=${codigoPostal}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Andreani branches error:', error);
    return [];
  }
}

// ============================================
// Get Locations (Localidades) - No auth required
// ============================================
export async function getLocations(provincia?: string): Promise<any[]> {
  try {
    let url = `${getApiUrl()}/v1/localidades`;
    if (provincia) {
      url += `?provincia=${encodeURIComponent(provincia)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Andreani locations error:', error);
    return [];
  }
}

// ============================================
// Get Quote (Cotización) - No auth required
// ============================================
export async function getQuote(params: {
  cpOrigen: string;
  cpDestino: string;
  peso: number; // in grams
  volumen?: number; // cm3
  valorDeclarado?: number;
  contrato?: string;
}): Promise<{
  success: boolean;
  price?: number;
  estimatedDays?: string;
  error?: string;
}> {
  try {
    const queryParams = new URLSearchParams({
      cpOrigen: params.cpOrigen,
      cpDestino: params.cpDestino,
      peso: String(params.peso),
      ...(params.volumen && { volumen: String(params.volumen) }),
      ...(params.valorDeclarado && { valorDeclarado: String(params.valorDeclarado) }),
      ...(params.contrato && { contrato: params.contrato }),
    });

    const response = await fetch(`${getApiUrl()}/v1/tarifas?${queryParams}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.mensaje || `Error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      price: data.tarifaConIva?.total || data.tarifaSinIva?.total,
      estimatedDays: data.tiempoEstimado || '3-5 días hábiles',
    };
  } catch (error: any) {
    console.error('Andreani quote error:', error);
    return {
      success: false,
      error: error.message || 'Error al cotizar envío',
    };
  }
}

// ============================================
// Create Order (Orden de envío)
// ============================================
export interface CreateOrderInput {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerDNI?: string;
  // Shipping address  
  streetName: string;
  streetNumber: string;
  floor?: string;
  apartment?: string;
  cityName: string;
  province: string;
  postalCode: string;
  // Package info
  weight: number; // in grams
  height?: number; // in cm
  width?: number;  // in cm
  depth?: number;  // in cm
  declaredValue?: number;
  // Options
  deliveryType?: 'puertaApuerta' | 'sucursalAsucursal' | 'puertaAsucursal';
  branchId?: string; // For sucursal delivery
}

export async function createShipment(input: CreateOrderInput): Promise<ShipmentResult> {
  try {
    const headers = await getAuthHeaders();
    const config = getConfig();
    const clientId = config.andreani?.clientId;
    const origin = config.origin || {};

    if (!clientId) {
      throw new Error('Client ID de Andreani es requerido. Configurá las credenciales en Admin > Envíos.');
    }

    // Calculate volumetric weight
    const height = input.height || 10;
    const width = input.width || 20;
    const depth = input.depth || 30;
    const volumetricWeight = (height * width * depth) / 6000;

    const orderData = {
      contrato: clientId,
      origen: {
        postal: {
          codigoPostal: origin.postalCode || '1000',
          calle: origin.address || '',
          numero: '',
          localidad: origin.city || '',
          region: '', // Province code
          pais: 'Argentina',
        },
      },
      destino: {
        postal: {
          codigoPostal: input.postalCode,
          calle: input.streetName,
          numero: input.streetNumber,
          piso: input.floor || '',
          departamento: input.apartment || '',
          localidad: input.cityName,
          region: '', // Province code
          pais: 'Argentina',
        },
      },
      remitente: {
        nombreCompleto: origin.name || 'Mi Tienda',
        email: origin.email || '',
        documentoTipo: 'CUIT',
        documentoNumero: '',
        telefonos: [
          { tipo: 1, numero: origin.phone || '' },
        ],
      },
      destinatario: [{
        nombreCompleto: input.customerName,
        email: input.customerEmail,
        documentoTipo: 'DNI',
        documentoNumero: input.customerDNI || '',
        telefonos: [
          { tipo: 1, numero: input.customerPhone || '' },
        ],
      }],
      bultos: [{
        kilos: input.weight / 1000, // Convert grams to kg
        largoCm: depth,
        altoCm: height,
        anchoCm: width,
        volumenCm: height * width * depth,
        valorDeclaradoSinImpuestos: input.declaredValue || 0,
        valorDeclaradoConImpuestos: input.declaredValue || 0,
        referencias: [
          { meta: 'idCliente', contenido: input.orderNumber },
        ],
      }],
      idCliente: input.orderNumber,
      remito: input.orderNumber,
      ...(input.branchId && { sucursalDeRetiro: input.branchId }),
    };

    const response = await fetch(`${getApiUrl()}/v2/ordenes-de-envio`, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.mensaje || `Error ${response.status}`);
    }

    const result = await response.json();

    return {
      success: true,
      trackingNumber: result.numeroAndreani || result.bultos?.[0]?.numeroDeEnvio,
      labelUrl: result.bultos?.[0]?.url,
      carrier: 'andreani',
      metadata: {
        provider: 'andreani',
        numeroAndreani: result.numeroAndreani,
        estado: result.estado,
        sucursalDeDistribucion: result.sucursalDeDistribucion,
      },
    };
  } catch (error: any) {
    console.error('Andreani create shipment error:', error);
    return {
      success: false,
      trackingNumber: '',
      carrier: 'andreani',
      error: error.message || 'Error al crear envío en Andreani',
    };
  }
}

// ============================================
// Get Order Status
// ============================================
export async function getOrderStatus(numeroAndreani: string): Promise<{
  success: boolean;
  status?: string;
  estado?: string;
  error?: string;
}> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${getApiUrl()}/v2/ordenes-de-envio/${numeroAndreani}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.mensaje || `Error ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      status: data.estado,
      estado: data.estado,
    };
  } catch (error: any) {
    console.error('Andreani order status error:', error);
    return {
      success: false,
      error: error.message || 'Error al consultar estado',
    };
  }
}

// ============================================
// Get Labels (Etiquetas)
// ============================================
export async function getLabel(numeroAndreani: string): Promise<{
  success: boolean;
  labelUrl?: string;
  labelData?: string; // PDF base64
  error?: string;
}> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${getApiUrl()}/v2/ordenes-de-envio/${numeroAndreani}/etiquetas`, {
      method: 'GET',
      headers: {
        ...headers,
        'Accept': 'application/pdf',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.mensaje || `Error ${response.status}`);
    }

    // Response can be PDF binary or JSON with URL
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/pdf')) {
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return {
        success: true,
        labelData: base64,
      };
    } else {
      const data = await response.json();
      return {
        success: true,
        labelUrl: data.url || data.etiqueta,
      };
    }
  } catch (error: any) {
    console.error('Andreani get label error:', error);
    return {
      success: false,
      error: error.message || 'Error al obtener etiqueta',
    };
  }
}

// ============================================
// Get Tracking (Trazas)
// ============================================
export async function getTracking(numeroAndreani: string): Promise<TrackingResult> {
  try {
    const headers = await getAuthHeaders();

    // First get shipment status
    const statusResponse = await fetch(`${getApiUrl()}/v2/envios/${numeroAndreani}`, {
      method: 'GET',
      headers,
    });

    if (!statusResponse.ok) {
      throw new Error(`Error ${statusResponse.status}`);
    }

    const statusData = await statusResponse.json();

    // Then get tracking traces
    const tracesResponse = await fetch(`${getApiUrl()}/v2/envios/${numeroAndreani}/trazas`, {
      method: 'GET',
      headers,
    });

    let events: any[] = [];
    if (tracesResponse.ok) {
      const tracesData = await tracesResponse.json();
      events = (tracesData.trazas || tracesData || []).map((t: any) => ({
        date: t.fecha,
        status: t.estado,
        location: t.sucursal || t.ubicacion,
        description: t.motivo || t.descripcion,
      }));
    }

    return {
      success: true,
      trackingNumber: numeroAndreani,
      status: mapStatus(statusData.estado),
      statusDescription: statusData.estadoDescripcion || statusData.estado,
      lastUpdate: events[0]?.date || new Date().toISOString(),
      events,
      carrier: 'andreani',
    };
  } catch (error: any) {
    console.error('Andreani tracking error:', error);
    return {
      success: false,
      trackingNumber: numeroAndreani,
      status: 'error',
      carrier: 'andreani',
      error: error.message || 'Error al consultar tracking',
    };
  }
}

// ============================================
// Cancel Order
// ============================================
export async function cancelOrder(numeroAndreani: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${getApiUrl()}/v2/api/NuevaAccion`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        numeroAndreani,
        tipoAccion: 'cancelacion',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.mensaje || `Error ${response.status}`);
    }

    return {
      success: true,
      message: 'Envío cancelado correctamente',
    };
  } catch (error: any) {
    console.error('Andreani cancel error:', error);
    return {
      success: false,
      error: error.message || 'Error al cancelar envío',
    };
  }
}

// ============================================
// Helper Functions
// ============================================
function mapStatus(estado: string): string {
  const statusMap: Record<string, string> = {
    'Pendiente': 'pending',
    'Solicitado': 'pending',
    'Creado': 'created',
    'Creada': 'created',
    'Admitido': 'in_transit',
    'En distribución': 'out_for_delivery',
    'En distribucion': 'out_for_delivery',
    'Entregado': 'delivered',
    'Devuelto': 'returned',
    'Cancelado': 'cancelled',
    'Rechazado': 'rejected',
  };
  
  return statusMap[estado] || 'unknown';
}

// ============================================
// Validate Credentials
// ============================================
export async function validateCredentials(): Promise<boolean> {
  try {
    await getToken();
    return true;
  } catch {
    return false;
  }
}
