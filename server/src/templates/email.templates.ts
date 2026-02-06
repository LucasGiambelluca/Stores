// Email Templates - Professional HTML emails for order confirmation
export const emailTemplates = {
  // Order confirmation email
  orderConfirmation: (order: {
    orderNumber: string;
    customerName: string;
    items: Array<{ name: string; size: string; quantity: number; price: number }>;
    subtotal: number;
    shippingCost: number;
    total: number;
    shippingAddress?: string;
    paymentMethod: string;
  }) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Pedido - X Menos + Prendas</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background-color: #1a1a1a; padding: 30px; text-align: center;">
        <h1 style="color: #E5B800; margin: 0; font-size: 28px; letter-spacing: 2px;">X MENOS + PRENDAS</h1>
        <p style="color: #ffffff; margin: 10px 0 0; font-size: 14px;">Mayorista & Minorista</p>
      </td>
    </tr>
    
    <!-- Order Confirmation Banner -->
    <tr>
      <td style="background-color: #E5B800; padding: 20px; text-align: center;">
        <h2 style="color: #1a1a1a; margin: 0; font-size: 24px;">¡Pedido Confirmado!</h2>
        <p style="color: #1a1a1a; margin: 10px 0 0; font-size: 16px;">Gracias por tu compra, ${order.customerName}</p>
      </td>
    </tr>
    
    <!-- Order Number -->
    <tr>
      <td style="padding: 30px; text-align: center; border-bottom: 1px solid #eee;">
        <p style="color: #666; margin: 0 0 10px; font-size: 14px;">Número de pedido</p>
        <p style="color: #1a1a1a; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 2px;">#${order.orderNumber}</p>
      </td>
    </tr>
    
    <!-- Order Items -->
    <tr>
      <td style="padding: 30px;">
        <h3 style="color: #1a1a1a; margin: 0 0 20px; font-size: 18px;">Detalle del pedido</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${order.items.map(item => `
            <tr>
              <td style="padding: 15px 0; border-bottom: 1px solid #eee;">
                <p style="margin: 0; font-weight: bold; color: #1a1a1a;">${item.name}</p>
                <p style="margin: 5px 0 0; color: #666; font-size: 14px;">Talle: ${item.size} | Cantidad: ${item.quantity}</p>
              </td>
              <td style="padding: 15px 0; border-bottom: 1px solid #eee; text-align: right; vertical-align: top;">
                <p style="margin: 0; font-weight: bold; color: #1a1a1a;">$${item.price.toLocaleString('es-AR')}</p>
              </td>
            </tr>
          `).join('')}
        </table>
        
        <!-- Totals -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
          <tr>
            <td style="padding: 10px 0; color: #666;">Subtotal</td>
            <td style="padding: 10px 0; text-align: right; color: #666;">$${order.subtotal.toLocaleString('es-AR')}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #666;">Envío</td>
            <td style="padding: 10px 0; text-align: right; color: #666;">${order.shippingCost > 0 ? '$' + order.shippingCost.toLocaleString('es-AR') : 'Gratis'}</td>
          </tr>
          <tr>
            <td style="padding: 15px 0; font-size: 20px; font-weight: bold; color: #1a1a1a; border-top: 2px solid #1a1a1a;">Total</td>
            <td style="padding: 15px 0; font-size: 20px; font-weight: bold; color: #1a1a1a; text-align: right; border-top: 2px solid #1a1a1a;">$${order.total.toLocaleString('es-AR')}</td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Shipping Info -->
    ${order.shippingAddress ? `
    <tr>
      <td style="padding: 0 30px 30px;">
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h3 style="color: #1a1a1a; margin: 0 0 10px; font-size: 16px;">📦 Dirección de envío</h3>
          <p style="color: #666; margin: 0; font-size: 14px; line-height: 1.6;">${order.shippingAddress}</p>
        </div>
      </td>
    </tr>
    ` : ''}
    
    <!-- Payment Method -->
    <tr>
      <td style="padding: 0 30px 30px;">
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h3 style="color: #1a1a1a; margin: 0 0 10px; font-size: 16px;">💳 Método de pago</h3>
          <p style="color: #666; margin: 0; font-size: 14px;">${order.paymentMethod}</p>
        </div>
      </td>
    </tr>
    
    <!-- CTA Button -->
    <tr>
      <td style="padding: 0 30px 30px; text-align: center;">
        <a href="https://limestore.com/#/tracking/${order.orderNumber}" style="display: inline-block; background-color: #E5B800; color: #1a1a1a; text-decoration: none; padding: 15px 40px; font-weight: bold; border-radius: 4px; font-size: 16px;">Seguir mi pedido</a>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background-color: #1a1a1a; padding: 30px; text-align: center;">
        <p style="color: #E5B800; margin: 0 0 15px; font-weight: bold;">X MENOS + PRENDAS</p>
        <p style="color: #999; margin: 0 0 10px; font-size: 13px;">San Lorenzo 1730, Bahía Blanca</p>
        <p style="color: #999; margin: 0 0 10px; font-size: 13px;">WhatsApp: +54 9 2914 16-3569</p>
        <p style="color: #666; margin: 20px 0 0; font-size: 12px;">Este email fue enviado automáticamente. Por favor no responder a este mensaje.</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `,

  // Payment received email (for transfer verification)
  paymentReceived: (orderNumber: string, customerName: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background-color: #1a1a1a; padding: 30px; text-align: center;">
        <h1 style="color: #E5B800; margin: 0; font-size: 28px;">X MENOS + PRENDAS</h1>
      </td>
    </tr>
    <tr>
      <td style="background-color: #22c55e; padding: 30px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 24px;">✓ Pago Verificado</h2>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px; text-align: center;">
        <p style="color: #1a1a1a; font-size: 18px; margin: 0 0 20px;">Hola ${customerName},</p>
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Tu pago para el pedido <strong>#${orderNumber}</strong> ha sido verificado correctamente.</p>
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Ya estamos preparando tu pedido para el envío.</p>
        <a href="https://limestore.com/#/tracking/${orderNumber}" style="display: inline-block; background-color: #E5B800; color: #1a1a1a; text-decoration: none; padding: 15px 40px; font-weight: bold; border-radius: 4px;">Ver estado del pedido</a>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f5f5f5; padding: 20px; text-align: center;">
        <p style="color: #999; margin: 0; font-size: 13px;">X Menos + Prendas | Bahía Blanca</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `,

  // Shipping notification email
  shippingNotification: (orderNumber: string, customerName: string, trackingNumber: string, carrier: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background-color: #1a1a1a; padding: 30px; text-align: center;">
        <h1 style="color: #E5B800; margin: 0; font-size: 28px;">X MENOS + PRENDAS</h1>
      </td>
    </tr>
    <tr>
      <td style="background-color: #3b82f6; padding: 30px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 24px;">📦 ¡Tu pedido está en camino!</h2>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px; text-align: center;">
        <p style="color: #1a1a1a; font-size: 18px; margin: 0 0 20px;">Hola ${customerName},</p>
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Tu pedido <strong>#${orderNumber}</strong> ha sido despachado y está en camino.</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <p style="color: #1a1a1a; margin: 0 0 10px; font-weight: bold;">Información de seguimiento</p>
          <p style="color: #666; margin: 0 0 5px; font-size: 14px;">Transportista: ${carrier}</p>
          <p style="color: #3b82f6; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 2px;">${trackingNumber}</p>
        </div>
        
        <a href="https://limestore.com/#/tracking/${orderNumber}" style="display: inline-block; background-color: #E5B800; color: #1a1a1a; text-decoration: none; padding: 15px 40px; font-weight: bold; border-radius: 4px;">Seguir mi pedido</a>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f5f5f5; padding: 20px; text-align: center;">
        <p style="color: #999; margin: 0; font-size: 13px;">X Menos + Prendas | Bahía Blanca</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `,

  // License generated email - sent to customer when license is created
  licenseGenerated: (data: {
    ownerName: string;
    serial: string;
    plan: string;
    expiresAt: string;
    activationUrl: string;
  }) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu Licencia Tiendita</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 32px; letter-spacing: 1px;">🎉 TIENDITA</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Tu plataforma e-commerce está lista</p>
      </td>
    </tr>
    
    <!-- Welcome Message -->
    <tr>
      <td style="padding: 40px 30px; text-align: center;">
        <h2 style="color: #1a1a1a; margin: 0 0 15px; font-size: 24px;">¡Bienvenido, ${data.ownerName}!</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
          Tu licencia <strong>${data.plan.toUpperCase()}</strong> ha sido generada exitosamente.<br/>
          Estás a un paso de lanzar tu tienda online.
        </p>
      </td>
    </tr>
    
    <!-- License Serial Box -->
    <tr>
      <td style="padding: 0 30px 30px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; text-align: center;">
          <p style="color: rgba(255,255,255,0.9); margin: 0 0 15px; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Tu Serial de Licencia</p>
          <div style="background-color: rgba(255,255,255,0.95); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #1a1a1a; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 3px; font-family: 'Courier New', monospace;">${data.serial}</p>
          </div>
          <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 13px;">
            ⚠️ Guarda este serial en un lugar seguro
          </p>
        </div>
      </td>
    </tr>
    
    <!-- License Details -->
    <tr>
      <td style="padding: 0 30px 30px;">
        <div style="background-color: #f9f9f9; padding: 25px; border-radius: 8px;">
          <h3 style="color: #1a1a1a; margin: 0 0 20px; font-size: 18px;">Detalles de tu licencia</h3>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 10px 0; color: #666; font-size: 14px;">Plan:</td>
              <td style="padding: 10px 0; text-align: right; color: #1a1a1a; font-weight: bold;">${data.plan.toUpperCase()}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #666; font-size: 14px; border-top: 1px solid #eee;">Válida hasta:</td>
              <td style="padding: 10px 0; text-align: right; color: #1a1a1a; font-weight: bold; border-top: 1px solid #eee;">${new Date(data.expiresAt).toLocaleDateString('es-AR')}</td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
    
    <!-- CTA Button -->
    <tr>
      <td style="padding: 0 30px 40px; text-align: center;">
        <a href="${data.activationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 50px; font-weight: bold; border-radius: 8px; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
          Activar Mi Tienda
        </a>
        <p style="color: #999; margin: 20px 0 0; font-size: 13px;">O ingresa el serial manualmente en tu panel</p>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background-color: #1a1a1a; padding: 30px; text-align: center;">
        <p style="color: #667eea; margin: 0 0 10px; font-weight: bold; font-size: 16px;">TIENDITA</p>
        <p style="color: #999; margin: 0 0 5px; font-size: 13px;">Plataforma SaaS E-commerce</p>
        <p style="color: #666; margin: 15px 0 0; font-size: 12px;">¿Necesitas ayuda? Contactanos en soporte@tiendita.com</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `,

  // License activated email - sent when store activates their license
  licenseActivated: (data: {
    ownerName: string;
    storeName: string;
    plan: string;
    expiresAt: string;
    dashboardUrl: string;
  }) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Licencia Activada</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
        <div style="font-size: 64px; margin-bottom: 10px;">✅</div>
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">¡Licencia Activada!</h1>
      </td>
    </tr>
    
    <!-- Success Message -->
    <tr>
      <td style="padding: 40px 30px; text-align: center;">
        <h2 style="color: #1a1a1a; margin: 0 0 15px; font-size: 24px;">¡Todo listo, ${data.ownerName}!</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0;">
          Tu tienda <strong>${data.storeName}</strong> está ahora activa con el plan <strong>${data.plan.toUpperCase()}</strong>.
        </p>
      </td>
    </tr>
    
    <!-- Plan Benefits -->
    <tr>
      <td style="padding: 0 30px 30px;">
        <div style="background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%); padding: 30px; border-radius: 12px;">
          <h3 style="color: #1a1a1a; margin: 0 0 20px; font-size: 18px; text-align: center;">Tu plan incluye:</h3>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 12px 0;">
                <span style="color: #10b981; font-size: 20px; margin-right: 10px;">✓</span>
                <span style="color: #1a1a1a; font-size: 15px;">Panel de administración completo</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0;">
                <span style="color: #10b981; font-size: 20px; margin-right: 10px;">✓</span>
                <span style="color: #1a1a1a; font-size: 15px;">Gestión de productos y pedidos</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0;">
                <span style="color: #10b981; font-size: 20px; margin-right: 10px;">✓</span>
                <span style="color: #1a1a1a; font-size: 15px;">Integración de pagos</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0;">
                <span style="color: #10b981; font-size: 20px; margin-right: 10px;">✓</span>
                <span style="color: #1a1a1a; font-size: 15px;">Soporte técnico prioritario</span>
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
    
    <!-- License Info -->
    <tr>
      <td style="padding: 0 30px 30px;">
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
          <p style="color: #666; margin: 0 0 10px; font-size: 14px;">Tu licencia expira el:</p>
          <p style="color: #1a1a1a; margin: 0; font-size: 20px; font-weight: bold;">${new Date(data.expiresAt).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </td>
    </tr>
    
    <!-- CTA -->
    <tr>
      <td style="padding: 0 30px 40px; text-align: center;">
        <a href="${data.dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 50px; font-weight: bold; border-radius: 8px; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
          Ir a Mi Dashboard
        </a>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background-color: #1a1a1a; padding: 30px; text-align: center;">
        <p style="color: #10b981; margin: 0 0 10px; font-weight: bold; font-size: 16px;">TIENDITA</p>
        <p style="color: #999; margin: 0 0 5px; font-size: 13px;">Tu tienda online ya está lista para vender</p>
        <p style="color: #666; margin: 15px 0 0; font-size: 12px;">¿Necesitas ayuda? Contactanos en soporte@tiendita.com</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `,

  // License expiring warning - sent 30 days before expiration
  licenseExpiring: (data: {
    ownerName: string;
    storeName: string;
    serial: string;
    expiresAt: string;
    daysRemaining: number;
    renewUrl: string;
  }) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu Licencia Está Por Vencer</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; text-align: center;">
        <div style="font-size: 64px; margin-bottom: 10px;">⏰</div>
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Tu Licencia Está Por Vencer</h1>
      </td>
    </tr>
    
    <!-- Warning Message -->
    <tr>
      <td style="padding: 40px 30px; text-align: center;">
        <h2 style="color: #1a1a1a; margin: 0 0 15px; font-size: 24px;">Hola ${data.ownerName},</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0;">
          Tu licencia de <strong>${data.storeName}</strong> vencerá en <strong style="color: #f59e0b;">${data.daysRemaining} días</strong>.
        </p>
      </td>
    </tr>
    
    <!-- Countdown Box -->
    <tr>
      <td style="padding: 0 30px 30px;">
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 30px; border-radius: 12px; text-align: center; border: 2px solid #f59e0b;">
          <p style="color: #92400e; margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Fecha de Vencimiento</p>
          <p style="color: #1a1a1a; margin: 0; font-size: 32px; font-weight: bold;">${new Date(data.expiresAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          <p style="color: #92400e; margin: 15px 0 0; font-size: 16px;">Quedan solo ${data.daysRemaining} días</p>
        </div>
      </td>
    </tr>
    
    <!-- What Happens -->
    <tr>
      <td style="padding: 0 30px 30px;">
        <div style="background-color: #fef2f2; padding: 25px; border-radius: 8px; border-left: 4px solid #ef4444;">
          <h3 style="color: #991b1b; margin: 0 0 15px; font-size: 16px;">⚠️ Qué pasa si vence tu licencia:</h3>
          <ul style="color: #7f1d1d; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Tu tienda dejará de funcionar</li>
            <li>Los clientes no podrán realizar compras</li>
            <li>Perderás acceso al panel de administración</li>
            <li>Los pedidos pendientes no se procesarán</li>
          </ul>
        </div>
      </td>
    </tr>
    
    <!-- License Info -->
    <tr>
      <td style="padding: 0 30px 30px;">
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <p style="color: #666; margin: 0 0 10px; font-size: 14px;">Serial de tu licencia:</p>
          <p style="color: #1a1a1a; margin: 0; font-size: 18px; font-family: 'Courier New', monospace; font-weight: bold;">${data.serial}</p>
        </div>
      </td>
    </tr>
    
    <!-- CTA -->
    <tr>
      <td style="padding: 0 30px 40px; text-align: center;">
        <a href="${data.renewUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 18px 60px; font-weight: bold; border-radius: 8px; font-size: 18px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
          Renovar Ahora
        </a>
        <p style="color: #666; margin: 20px 0 0; font-size: 14px;">
          Renueva hoy y mantén tu tienda activa sin interrupciones
        </p>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background-color: #1a1a1a; padding: 30px; text-align: center;">
        <p style="color: #f59e0b; margin: 0 0 10px; font-weight: bold; font-size: 16px;">TIENDITA</p>
        <p style="color: #999; margin: 0 0 5px; font-size: 13px;">No dejes que tu negocio se detenga</p>
        <p style="color: #666; margin: 15px 0 0; font-size: 12px;">¿Necesitas ayuda? Contactanos en soporte@tiendita.com</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `,
};

export default emailTemplates;
