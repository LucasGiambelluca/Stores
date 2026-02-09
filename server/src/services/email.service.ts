import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { env } from '../env.js';

dotenv.config();

// ============================================
// CONFIGURATION
// ============================================

const BRAND = {
  name: 'LimeStore',
  url: 'https://tiendita.app', // Mothership URL
  colors: {
    primary: '#84cc16', // Lime-500
    dark: '#1a1a1a',     // Black
    background: '#ffffff', // White
    text: '#333333',
    gray: '#f4f4f5'
  },
  logo: 'https://res.cloudinary.com/dfgk2kyld/image/upload/v1770212746/system/limestore-logo.png'
};

// Create transporter
const createTransporter = () => {
  if (env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: 'resend',
        pass: env.SMTP_PASS,
      },
    });
  }

  // Dev fallback
  console.log('⚠️ Email service not configured. Using console mock.');
  return {
    sendMail: async (options: any) => {
      console.log('📧 [MOCK EMAIL]');
      console.log(`  To: ${options.to}`);
      console.log(`  Subject: ${options.subject}`);
      return { messageId: 'mock-id' };
    }
  };
};

const transporter = createTransporter();

// ============================================
// BRANDED TEMPLATE BUILDER
// ============================================

const wrapTemplate = (title: string, content: string, actionButton?: { text: string; url: string }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; margin: 0; padding: 0; background-color: ${BRAND.colors.gray}; -webkit-font-smoothing: antialiased; }
    .wrapper { max-width: 600px; margin: 0 auto; background-color: ${BRAND.colors.background}; }
    .header { background-color: ${BRAND.colors.dark}; padding: 32px 24px; text-align: center; }
    .header img { height: 48px; margin-bottom: 0; }
    .content { padding: 48px 32px; color: ${BRAND.colors.text}; line-height: 1.6; }
    .h1 { font-size: 24px; font-weight: 700; color: ${BRAND.colors.dark}; margin: 0 0 16px; letter-spacing: -0.5px; }
    .text { font-size: 16px; margin: 0 0 24px; color: #52525b; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background-color: ${BRAND.colors.primary}; color: #000000; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; transition: opacity 0.2s; }
    .btn:hover { opacity: 0.9; }
    .divider { height: 1px; background-color: #e4e4e7; margin: 32px 0; border: none; }
    .footer { background-color: #fafafa; padding: 24px; text-align: center; border-top: 1px solid #f4f4f5; }
    .footer-text { font-size: 12px; color: #a1a1aa; margin: 0; }
    .card { background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: left; }
    .badge { display: inline-block; background: ${BRAND.colors.primary}; color: black; font-size: 12px; font-weight: bold; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="wrapper">
    <!-- Header -->
    <div class="header">
      <img src="${BRAND.logo}" alt="${BRAND.name}">
    </div>

    <!-- Content -->
    <div class="content">
      <h1 class="h1">${title}</h1>
      ${content}
      
      ${actionButton ? `
      <div class="btn-container">
        <a href="${actionButton.url}" class="btn">${actionButton.text}</a>
      </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">© 2025 LimeStore. Potenciado por tecnología moderna.</p>
      <p class="footer-text" style="margin-top: 8px;">
        <a href="${BRAND.url}" style="color: #a1a1aa; text-decoration: underline;">Ir al Dashboard</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

// ============================================
// EMAIL FLOWS
// ============================================

// 1. New Store Created
export const sendStoreCreated = async (email: string, storeName: string, dashboardUrl: string) => {
  const content = `
    <p class="text">¡Tu tienda <strong>${storeName}</strong> ha sido creada exitosamente!</p>
    <p class="text">Ya tenés acceso a tu panel de control donde podrás cargar productos, configurar pagos y personalizar tu diseño.</p>
    
    <div class="card">
      <p style="margin: 0 0 8px; font-size: 14px; color: #71717a;">Próximos pasos:</p>
      <ul style="margin: 0; padding-left: 20px; color: #52525b;">
        <li>Subí tu logo y banner</li>
        <li>Cargá tus primeros productos</li>
        <li>Conectá MercadoPago</li>
      </ul>
    </div>
  `;

  return await sendEmail(email, '¡Tu tienda LimeStore está lista! 🚀', content, {
    text: 'Ir a mi Panel',
    url: dashboardUrl
  });
};

// 2. Activation License
export const sendActivationLicense = async (email: string, licenseKey: string, planName: string) => {
  const content = `
    <p class="text">Aquí tenés tu licencia de activación para el plan <strong>${planName}</strong>.</p>
    
    <div class="card" style="text-align: center; background: #1a1a1a;">
      <p style="color: #a1a1aa; margin-bottom: 8px; font-size: 12px; text-transform: uppercase;">Tu Clave de Licencia</p>
      <code style="display: block; font-size: 24px; color: ${BRAND.colors.primary}; font-family: monospace; letter-spacing: 2px;">${licenseKey}</code>
    </div>

    <p class="text">Ingresá esta clave en la sección <strong>Configuración > Suscripción</strong> de tu panel.</p>
  `;

  return await sendEmail(email, '🔑 Tu Licencia de LimeStore', content);
};

// 3. Password Recovery
export const sendPasswordReset = async (email: string, resetToken: string) => {
  const resetUrl = `${env.STORE_URL}/reset-password?token=${resetToken}`;
  const content = `
    <p class="text">Recibimos una solicitud para restablecer tu contraseña. Si no fuiste vos, podés ignorar este correo.</p>
    <p class="text">Para crear una nueva contraseña, hacé clic en el botón de abajo. El enlace expira en 1 hora.</p>
  `;

  return await sendEmail(email, 'Recuperar Contraseña', content, {
    text: 'Restablecer Contraseña',
    url: resetUrl
  });
};

// 4. New Order (To Seller)
export const sendNewOrderNotification = async (adminEmail: string, orderNumber: string, total: number, customerName: string) => {
  const formattedTotal = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(total);
  
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge">Nueva Venta</span>
    </div>
    <p class="text">¡Felicitaciones! <strong>${customerName}</strong> acaba de realizar una compra en tu tienda.</p>
    
    <div class="card">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #71717a;">Pedido:</span>
        <strong>#${orderNumber}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 18px;">
        <span style="color: #71717a;">Total:</span>
        <strong style="color: ${BRAND.colors.primary}; filter: brightness(0.8);">${formattedTotal}</strong>
      </div>
    </div>
  `;

  return await sendEmail(adminEmail, `💰 Nueva venta #${orderNumber} de ${customerName}`, content, {
    text: 'Ver Pedido',
    url: `${env.STORE_URL}/#/admin/orders`
  });
};

// 5. Order Completed (To Buyer)
export const sendOrderConfirmation = async (order: any) => {
  const formattedTotal = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(order.total);
  
  const itemsList = order.items.map((item: any) => `
    <div style="display: flex; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 12px;">
      <div style="flex-grow: 1;">
        <div style="font-weight: 600; color: #333;">${item.productName}</div>
        <div style="font-size: 12px; color: #71717a;">Cant: ${item.quantity} ${item.size ? `| Talle: ${item.size}` : ''}</div>
      </div>
      <div style="font-weight: 600;">$${item.price}</div>
    </div>
  `).join('');

  const content = `
    <p class="text">Hola <strong>${order.customerName}</strong>, gracias por tu compra. Estamos preparando tu pedido.</p>
    
    <div class="card">
      <h3 style="margin: 0 0 16px; font-size: 16px;">Resumen del Pedido #${order.orderNumber}</h3>
      ${itemsList}
      <div style="display: flex; justify-content: space-between; margin-top: 16px; padding-top: 16px; border-top: 2px solid #eee; font-size: 18px;">
        <strong>Total</strong>
        <strong>${formattedTotal}</strong>
      </div>
    </div>

    ${order.paymentMethod === 'transfer' ? `
    <div class="card" style="background-color: #ecfccb; border-color: #d9f99d;">
      <p style="margin: 0; color: #3f6212; font-weight: 600;">⚡ Pago pendiente</p>
      <p style="margin: 8px 0 0; font-size: 14px; color: #4d7c0f;">Recordá enviarnos el comprobante por WhatsApp para procesar el envío.</p>
    </div>
    ` : ''}
  `;

  return await sendEmail(order.customerEmail, `Tu compra #${order.orderNumber} en ${BRAND.name}`, content, {
    text: 'Ver mi Pedido',
    url: `${env.STORE_URL}/#/orders/${order.orderNumber}`
  });
};

// 6. Package Shipped (To Buyer)
export const sendOrderStatusUpdate = async (email: string, customerName: string, orderNumber: string, status: string, trackingNumber?: string) => {
  if (status !== 'shipped') return; // For now only handling shipped based on request, but kept generic for future

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <img src="https://cdni.iconscout.com/illustration/premium/thumb/delivery-truck-4438676-3718356.png" style="width: 120px; text-align: center;" alt="En camino" />
    </div>
    
    <p class="text">¡Buenas noticias, <strong>${customerName}</strong>!</p>
    <p class="text">Tu pedido <strong>#${orderNumber}</strong> ya está en camino.</p>
    
    ${trackingNumber ? `
    <div class="card">
      <p style="margin: 0 0 8px; font-size: 14px; color: #71717a;">Código de Seguimiento:</p>
      <strong style="font-size: 20px; letter-spacing: 1px;">${trackingNumber}</strong>
      <p style="margin: 16px 0 0; font-size: 14px;">Podés seguir el estado de tu envío en la web del correo.</p>
    </div>
    ` : ''}
  `;

  return await sendEmail(email, `🚚 Tu pedido #${orderNumber} está en camino`, content, trackingNumber ? {
    text: 'Seguir Envío',
    url: 'https://www.correoargentino.com.ar/formularios/ondnc'
  } : undefined);
};

// Low Stock (Keeping legacy support)
export const sendLowStockAlert = async (adminEmail: string, products: any[], threshold: number) => {
  const content = `
    <p class="text">Los siguientes productos tienen stock crítico (menos de ${threshold}):</p>
    <ul style="color: #ef4444;">
      ${products.map(p => `<li>${p.name} (${p.stock})</li>`).join('')}
    </ul>
  `;
  return await sendEmail(adminEmail, '⚠️ Alerta de Stock Bajo', content);
};

// 7. New SaaS Sale (To Super Admin)
export const sendNewSaasSaleNotification = async (adminEmail: string, sale: {
  plan: string;
  amount: number;
  buyerEmail: string;
  storeName: string;
}) => {
  const formattedAmount = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(sale.amount / 100);
  const planNames: Record<string, string> = {
    free: 'Free',
    starter: 'Starter',
    pro: 'Pro',
    enterprise: 'Enterprise',
  };
  
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge" style="background: #22c55e;">💰 Nueva Venta SaaS</span>
    </div>
    <p class="text">¡Se vendió una nueva suscripción!</p>
    
    <div class="card">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #71717a;">Plan:</span>
        <strong>${planNames[sale.plan] || sale.plan}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #71717a;">Monto:</span>
        <strong style="color: #22c55e;">${formattedAmount}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #71717a;">Cliente:</span>
        <strong>${sale.buyerEmail}</strong>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #71717a;">Tienda:</span>
        <strong>${sale.storeName}</strong>
      </div>
    </div>
  `;

  return await sendEmail(adminEmail, `💰 Nueva Venta: ${planNames[sale.plan]} - ${formattedAmount}`, content, {
    text: 'Ver en Mothership',
    url: `${BRAND.url}/mothership/sales`
  });
};

// Helper
async function sendEmail(to: string, subject: string, htmlContent: string, actionButton?: { text: string; url: string }) {
  try {
    const html = wrapTemplate(subject, htmlContent, actionButton);
    
    // Don't wait too long for email - 10s timeout
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Email timeout')), 10000));
    const sendPromise = transporter.sendMail({
      from: `"${BRAND.name}" <${env.SMTP_USER || 'onboarding@resend.dev'}>`, // Use configured user or fallback
      to,
      subject,
      html,
    });

    const info = await Promise.race([sendPromise, timeoutPromise]) as any;
    console.log(`✅ Email sent to ${to} [${info.messageId}]`);
    return true;
  } catch (error) {
    console.warn(`⚠️ Failed to send email to ${to} (non-blocking):`, error);
    return false; // Return false but don't throw to avoid crashing the request
  }
}
