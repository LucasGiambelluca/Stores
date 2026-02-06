# 🛒 Tiendita - E-commerce Template

Template reutilizable para crear tiendas online con React, Express y SQLite.

## 🚀 Inicio Rápido

**Inicia todo de una vez:**

```bash
pnpm run dev:all
```

Esto inicia automáticamente:
- 🔧 Backend (puerto 3001)
- 🎨 Cliente Store (puerto 3005)  
- 🚢 Mothership Panel (puerto 5173)

> Ver [START.md](START.md) para más opciones de inicio

## ✨ Características

- **Frontend**: React 19 + Vite + Lazy loading
- **Backend**: Express + Drizzle ORM + SQLite
- **Pagos**: Integración MercadoPago
- **Imágenes**: Cloudinary
- **Admin Panel**: Gestión de productos, pedidos, clientes

> 📖 **¿Sos emprendedor sin experiencia técnica?**  
> Leé la [Guía de Configuración Paso a Paso](docs/SETUP_GUIDE.md)

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Instalación

```bash
# 1. Clonar el template
git clone <repo-url> mi-tienda
cd mi-tienda

# 2. Instalar dependencias
pnpm install
cd server && pnpm install && cd ..

# 3. Configurar entorno (interactivo)
cd server && pnpm run setup && cd ..

# 4. Iniciar en modo desarrollo
pnpm run dev
```

La app estará disponible en:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001/api
- **Admin**: http://localhost:3000/#/admin

---

## 📁 Estructura del Proyecto

```
tiendita/
├── components/           # Componentes React
│   ├── admin/           # Panel de administración
│   └── blocks/          # Bloques del Page Builder
├── context/             # Contextos React (Auth, Cart, etc)
├── server/              # Backend Express
│   ├── src/
│   │   ├── controllers/ # Endpoints API
│   │   ├── db/          # Schema Drizzle + Cliente
│   │   ├── services/    # Lógica de negocio
│   │   └── env.ts       # Validación de entorno
│   ├── scripts/         # Scripts de setup y seed
│   └── drizzle/         # Migraciones SQL
└── public/              # Assets estáticos
```

---

## ⚙️ Configuración

### Variables de Entorno Requeridas

Ejecutá `pnpm run setup` en `/server` o copiá `.env.example`:

| Variable | Descripción |
|----------|-------------|
| `JWT_SECRET` | Clave secreta para tokens (mín 16 chars) |
| `MP_ACCESS_TOKEN` | Token de MercadoPago |
| `MP_PUBLIC_KEY` | Clave pública de MercadoPago |

### Variables Opcionales

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | 3001 |
| `STORE_NAME` | Nombre de la tienda | Mi Tienda |
| `CLOUDINARY_*` | Credenciales Cloudinary | - |
| `SMTP_*` | Configuración email | Console |

---

## 🔧 Comandos Útiles

### Desarrollo
```bash
pnpm run dev          # Inicia frontend + backend
pnpm run setup        # Configura .env interactivamente (en /server)
```

### Base de Datos
```bash
cd server
pnpm exec drizzle-kit generate  # Generar migración
pnpm exec drizzle-kit migrate   # Aplicar migraciones
pnpm exec drizzle-kit studio    # Explorar DB visualmente
```

### Producción
```bash
pnpm run build        # Build de producción
pnpm run start        # Iniciar en producción
```

---

## 🎨 Personalización

### 1. Datos de la Tienda
Editá las variables en `server/.env`:
```env
STORE_NAME=Mi Nueva Tienda
STORE_URL=https://mitienda.com
```

### 2. Productos y Categorías
Usá el Admin Panel en `/admin` o el script de seed:
```bash
cd server && pnpm run seed
```

### 3. Diseño de Homepage
El Page Builder en Admin → Page Builder permite configurar:
- Hero sliders
- Grillas de productos
- Banners
- Secciones de texto
- Embeds de redes sociales

---

## 📚 API Reference

### Públicos
- `GET /api/products` - Listar productos
- `GET /api/products/:id` - Detalle de producto
- `GET /api/categories` - Listar categorías
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro

### Admin (requiere token)
- `GET /api/admin/orders` - Listar pedidos
- `PUT /api/admin/orders/:id/status` - Actualizar estado
- `GET /api/admin/reports/sales` - Reporte de ventas

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crear branch (`git checkout -b feature/nueva-feature`)
3. Commit cambios (`git commit -m 'Agregar nueva feature'`)
4. Push (`git push origin feature/nueva-feature`)
5. Abrir Pull Request

---

## 📄 Licencia

MIT
# Stores
