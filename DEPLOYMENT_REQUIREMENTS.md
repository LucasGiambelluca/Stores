# 🚀 Deployment Requirements for Tiendita SaaS

## 🏗️ Infrastructure

### 1. Compute (Server)
- **Node.js**: v18.x or v20.x (LTS)
- **Memory**: Minimum 1GB RAM (2GB Recommended) - Image optimization uses `sharp` which can be memory intensive.
- **CPU**: 1 vCPU sufficient for starting.

### 2. Database (PostgreSQL)
- **Version**: PostgreSQL 14 or higher.
- **Extensions**: `uuid-ossp` (usually available by default).
- **Storage**: Start with 10GB.
- **Backup**: Daily automated backups required.
- **Connection**: Must support connection pooling (or use an external pooler like PgBouncer).

### 3. File Storage
- **Local (Dev)**: Uses `uploads/` folder.
- **Production**: **Cloudinary** is required for storing product images and user uploads efficiently.

---

## 🔑 Environment Variables (Critical)

See `.env.example` for the complete template. The following are **MANDATORY** for production:

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Must be set to `production`. |
| `PORT` | Service port (e.g., 8080 or 3000). |
| `DATABASE_URL` | Full connection string to PostgreSQL. |
| `JWT_SECRET` | Secure random string (min 32 chars). |
| `ENCRYPTION_KEY` | **EXACTLY** 32 chars random string for DB field encryption. |
| `STORE_URL` | Public URL of the frontend (e.g., `https://tiendita.app`). |

---

## 🌐 External Services

### 1. Payment Gateway
- **MercadoPago**: Required for processing payments.
    - Need `MERCADOPAGO_ACCESS_TOKEN` (PROD credentials).
    - Webhook URL must be public and secured with HTTPS.

### 2. Email Service (SMTP)
- Required for sending order confirmations and password resets.
- Examples: SendGrid, Resend, Amazon SES, or Gmail/Google Workspace.

### 3. Error Monitoring
- **Sentry**: Highly recommended for tracking production errors.
    - Set `SENTRY_DSN`.

### 4. Shipping (Optional)
- **Enviopack**: For shipping labels. Requires API credentials if used.

---

## 📦 Build & Deploy Steps

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Build Server**
   ```bash
   cd server
   pnpm build
   # This runs `tsc` and outputs to `dist/`
   ```

3. **Database Migration**
   ```bash
   pnpm db:migrate
   # Ensures DB schema is up to date
   ```

4. **Start Production Server**
   ```bash
   node dist/server.js
   ```

---

## 🛡️ Security Checklist before Launch

- [ ] All secrets moved to secure environment variables (CI/CD or Secret Manager).
- [ ] `ENCRYPTION_KEY` is set and backed up (losing this means losing access to encrypted fields).
- [ ] Database accepts connections only from the app server (firewall).
- [ ] Domain has valid SSL certificate (HTTPS handled by load balancer/reverse proxy).
