
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.resend.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'resend',
    pass: process.env.SMTP_PASS,
  },
});

const logoUrl = 'https://res.cloudinary.com/dfgk2kyld/image/upload/v1770212746/system/limestore-logo.png';

const template = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
    .header { background: #1a1a1a; padding: 40px 20px; text-align: center; }
    .header img { height: 70px; margin-bottom: 20px; }
    .header h1 { color: #E5B800; margin: 0; font-size: 28px; }
    .content { padding: 50px 40px; text-align: center; }
    .content h2 { color: #1a1a1a; font-size: 24px; margin-bottom: 20px; }
    .content p { color: #666; font-size: 16px; line-height: 1.6; }
    .footer { background: #fafafa; padding: 30px; text-align: center; font-size: 12px; color: #aaa; border-top: 1px solid #eee; }
    .btn { display: inline-block; background: #E5B800; color: #1a1a1a; padding: 15px 35px; text-decoration: none; font-weight: bold; border-radius: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="LimeStore Logo">
      <h1>LimeStore</h1>
    </div>
    <div class="content">
      <h2>¡Lo lograste, Lucas! 🚀</h2>
      <p style="font-size: 20px; font-weight: bold; color: #E5B800;">felicidades ya tenes tu tienda Lime</p>
      <p>Tu plataforma ya está lista para recibir sus primeros pedidos. Configuramos todo para que tu experiencia sea premium.</p>
      <a href="https://tiendita.app" class="btn">Ir al Dashboard</a>
    </div>
    <div class="footer">
      <p>© 2025 LimeStore - La plataforma de e-commerce definitiva.</p>
    </div>
  </div>
</body>
</html>
`;

async function main() {
  console.log('📨 Enviando mail de prueba...');
  try {
    const info = await transporter.sendMail({
      from: 'LimeStore <onboarding@resend.dev>', // Usamos el dominio de prueba de Resend
      to: 'lucasdavigiambelluca@gmail.com',
      subject: '¡Felicidades! Ya tenés tu tienda Lime 🚀',
      html: template,
    });
    console.log('✅ Email enviado con éxito:', info.messageId);
  } catch (error) {
    console.error('❌ Error enviando email:', error);
  }
}

main();
