# 🚀 Estrategia de Despliegue (Costo $0)

Para soportar **100 tiendas** sin costo y con alta disponibilidad, aprovecharemos la arquitectura **Multi-tenant** que ya tiene el sistema. No necesitas desplegar 100 servidores, solo UNO.

## 🏗️ Stack Recomendado (Free Tier)

| Componente | Servicio | Costo | Por qué elegirlo |
|------------|----------|-------|------------------|
| **Frontend** | **Vercel** | Gratis | CDN Global, dominios ilimitados, SSL automático. |
| **Backend** | **Render / Railway** | Gratis* | Soporta Node.js/Docker. (*Render se apaga tras inactividad, Railway da créditos). |
| **Base de Datos** | **Supabase** | Gratis | PostgreSQL gestionado, 500MB storage (suficiente para miles de productos/pedidos). |
| **Imágenes** | **Cloudinary** | Gratis | Almacenamiento y optimización de imágenes. |

---

## 📝 Guía Paso a Paso

### 1. Base de Datos (Supabase)
1. Creá una cuenta en [Supabase](https://supabase.com).
2. Creá un nuevo proyecto.
3. Copiá la **Connection String** (Mode: Transaction o Session).
   - Ejemplo: `postgresql://postgres:[PASSWORD]@db.supabase.co:5432/postgres`

### 2. Backend (Render)
1. Creá una cuenta en [Render](https://render.com).
2. Seleccioná **New +** -> **Web Service**.
3. Conectá tu repositorio de GitHub.
4. Configuraciones:
   - **Root Directory**: `server`
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: `pnpm start` (o `node dist/server.js`)
   - **Environment Variables**:
     - `DATABASE_URL`: (Tu URL de Supabase)
     - `JWT_SECRET`: (Generar una clave larga)
     - `MP_ACCESS_TOKEN`: (Tu token de MercadoPago)
     - `CLOUDINARY_*`: (Tus credenciales)
     - `NODE_ENV`: `production`

### 3. Frontend (Vercel)
1. Creá una cuenta en [Vercel](https://vercel.com).
2. Importá tu repositorio.
3. Configuraciones:
   - **Root Directory**: `client`
   - **Build Command**: `vite build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     - `VITE_API_URL`: (La URL que te dio Render, ej: `https://tiendita-api.onrender.com`)

### 4. Configurar Dominios (El Truco para 100 Tiendas)
Para que cada tienda tenga su URL (`tienda1.tuapp.com`, `tienda2.tuapp.com`):

1. Comprá un dominio (ej: `mitienda.app`).
2. En tu proveedor de dominios (GoDaddy, Namecheap), configurá:
   - **A Record**: `*` (asterisco) -> IP de Vercel.
   - **CNAME**: `www` -> `cname.vercel-dns.com`.
3. En Vercel:
   - Agregá el dominio `mitienda.app`.
   - Vercel detectará automáticamente los subdominios (`*.mitienda.app`).
   - El frontend leerá `window.location.hostname` para saber qué tienda cargar.

---

## ⚠️ Limitaciones del Plan Gratis
- **Render**: El servidor se "duerme" si nadie entra en 15 mins. La primera carga tardará 30-50 segundos. (Solución: Usar un servicio como UptimeRobot para hacer ping cada 10 mins).
- **Supabase**: Se pausa si no se usa en 7 días (te avisan por mail para reactivar).

## ✅ Conclusión
Con esta arquitectura, podés tener 1, 100 o 1000 tiendas. Solo pagarás si tu tráfico excede los límites generosos gratuitos (ej: miles de usuarios simultáneos).
