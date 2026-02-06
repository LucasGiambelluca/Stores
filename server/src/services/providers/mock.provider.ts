// Mock Shipping Provider for development/testing
// Generates fake tracking numbers and labels without real API calls

import { v4 as uuidv4 } from 'uuid';

export interface ShipmentInput {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
}

export interface ShipmentResult {
  success: boolean;
  trackingNumber: string;
  labelUrl: string;
  labelData: string; // HTML or base64 PDF
  estimatedDelivery: string;
  carrier: string;
  carrierResponse?: any;
  error?: string;
}

export interface TrackingEvent {
  date: string;
  time: string;
  status: string;
  location: string;
  description: string;
}

export interface TrackingResult {
  success: boolean;
  trackingNumber: string;
  status: string;
  estimatedDelivery?: string;
  events: TrackingEvent[];
  carrier: string;
  error?: string;
}

// Generate a mock tracking number
function generateTrackingNumber(): string {
  const prefix = 'XMP'; // X Menos Prendas
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

// Generate mock label HTML
function generateLabelHTML(input: ShipmentInput, trackingNumber: string): string {
  const itemsList = input.items
    .map(item => `<tr><td>${item.name}</td><td>${item.quantity}</td></tr>`)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Etiqueta de Envío - ${trackingNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 20px; }
    .label { 
      width: 400px; 
      border: 2px solid #000; 
      padding: 15px;
      background: #fff;
    }
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .logo { font-size: 24px; font-weight: bold; }
    .barcode {
      text-align: center;
      padding: 15px 0;
      border: 1px solid #ccc;
      background: #f9f9f9;
      margin: 10px 0;
      font-family: 'Courier New', monospace;
      font-size: 18px;
      letter-spacing: 3px;
    }
    .section { margin: 10px 0; }
    .section-title { 
      font-weight: bold; 
      font-size: 12px; 
      color: #666;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .section-content { font-size: 14px; }
    .address { 
      background: #f5f5f5; 
      padding: 10px; 
      border-radius: 4px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .items-table th, .items-table td {
      border: 1px solid #ddd;
      padding: 5px;
      text-align: left;
    }
    .footer {
      margin-top: 15px;
      padding-top: 10px;
      border-top: 1px dashed #ccc;
      font-size: 11px;
      color: #666;
    }
    @media print {
      body { padding: 0; }
      .label { border: none; }
    }
  </style>
</head>
<body>
  <div class="label">
    <div class="header">
      <div class="logo">X MENOS +</div>
      <div>PRENDAS</div>
    </div>
    
    <div class="barcode">
      ${trackingNumber}
    </div>
    
    <div class="section">
      <div class="section-title">Remitente</div>
      <div class="section-content">
        X Menos + Prendas<br>
        San Lorenzo 1730<br>
        Bahía Blanca (8000)
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Destinatario</div>
      <div class="section-content address">
        <strong>${input.customerName}</strong><br>
        ${input.shippingAddress}<br>
        Tel: ${input.customerPhone || 'N/A'}
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Orden #${input.orderNumber}</div>
      <table class="items-table">
        <thead>
          <tr><th>Producto</th><th>Cant.</th></tr>
        </thead>
        <tbody>
          ${itemsList}
        </tbody>
      </table>
    </div>
    
    <div class="footer">
      Generado el ${new Date().toLocaleString('es-AR')}<br>
      Para seguimiento: limestore.com/tracking/${trackingNumber}
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Create a mock shipment
export async function createShipment(input: ShipmentInput): Promise<ShipmentResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const trackingNumber = generateTrackingNumber();
  const labelHtml = generateLabelHTML(input, trackingNumber);
  
  // Estimate delivery (3-6 business days from now)
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 4) + 3);
  
  return {
    success: true,
    trackingNumber,
    labelUrl: `/api/shipping/label/${input.orderId}`,
    labelData: labelHtml,
    estimatedDelivery: deliveryDate.toISOString().split('T')[0],
    carrier: 'mock',
    carrierResponse: {
      provider: 'mock',
      generatedAt: new Date().toISOString(),
      mode: 'development',
    },
  };
}

// Get tracking info for a shipment
export async function getTracking(trackingNumber: string): Promise<TrackingResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Generate mock tracking events based on tracking number
  const createdDate = new Date();
  createdDate.setDate(createdDate.getDate() - 3);
  
  const events: TrackingEvent[] = [
    {
      date: createdDate.toISOString().split('T')[0],
      time: '14:30',
      status: 'created',
      location: 'Bahía Blanca, Buenos Aires',
      description: 'Envío creado y etiqueta generada',
    },
    {
      date: new Date(createdDate.getTime() + 86400000).toISOString().split('T')[0],
      time: '09:15',
      status: 'shipped',
      location: 'Bahía Blanca, Buenos Aires',
      description: 'Paquete recolectado por el transportista',
    },
    {
      date: new Date(createdDate.getTime() + 172800000).toISOString().split('T')[0],
      time: '16:45',
      status: 'in_transit',
      location: 'Buenos Aires, CABA',
      description: 'En tránsito hacia destino',
    },
  ];
  
  // Randomly add delivered status
  const isDelivered = Math.random() > 0.5;
  if (isDelivered) {
    events.push({
      date: new Date().toISOString().split('T')[0],
      time: '11:20',
      status: 'delivered',
      location: 'Destino final',
      description: 'Entregado al destinatario',
    });
  }
  
  const currentStatus = events[events.length - 1].status;
  
  return {
    success: true,
    trackingNumber,
    status: currentStatus,
    estimatedDelivery: isDelivered ? undefined : new Date(Date.now() + 172800000).toISOString().split('T')[0],
    events: events.reverse(), // Most recent first
    carrier: 'mock',
  };
}

// Get label for an order (returns the HTML)
export async function getLabel(orderId: string, labelData: string): Promise<string> {
  return labelData;
}

export default {
  createShipment,
  getTracking,
  getLabel,
};
