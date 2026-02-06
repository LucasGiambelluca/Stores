# 📦 Planes Comerciales y Especificaciones Técnicas

Este documento detalla la estructura de planes para el lanzamiento del SaaS "Tiendita", incluyendo límites técnicos y disponibilidad de features.

## Resumen de Planes

| Característica | **Free** | **Starter** | **Pro** | **Enterprise** |
| :--- | :---: | :---: | :---: | :---: |
| **Precio Sugerido** | Gratis | $19 / mes | $49 / mes | Contactar |
| **Productos (SKUs)** | 10 | 100 | 1,000 | Ilimitado |
| **Órdenes / mes** | 20 | 200 | 2,000 | Ilimitado |
| **Imágenes por Producto** | 1 | 3 | 5 | 10+ |
| **Dominio Personalizado** | ❌ | ❌ | ✅ | ✅ |
| **Comisión por Venta** | 5% | 2% | 0.5% | 0% |
| **Almacenamiento** | 500 MB | 5 GB | 50 GB | 1 TB |

---

## 🛠️ Disponibilidad de Widgets (Feature Gating)

El sistema utiliza un "Feature Lock" visual para incentivar el upgrade.

### Widgets Básicos (Todos los planes)
- `product-info` (Título, Precio)
- `product-description` (Texto simple)
- `product-gallery` (Básica)
- `product-buy-box` (Botón comprar)

### Starter (+ Features anteriores)
- `related-products` (Cross-selling básico)
- `product-reviews` (Reseñas de clientes)
- `product-specs` (Tabla de especificaciones)

### Pro (+ Features anteriores)
- `product-size-guide` (Guía de talles interactiva)
- `product-countdown` (Ofertas por tiempo limitado)
- `product-banner` (Banners promocionales dentro de ficha)
- `product-bundles` (Packs de productos con descuento)
- `product-cross-sell` (Popups de venta cruzada)

### Enterprise (Todo desbloqueado)
- `product-video` (Video embebido/autoplay)
- `product-3d-viewer` (Visor de modelos 3D)
- `product-custom-html` (Inyección de código)
- Soporte prioritario 24/7

---

## ⚙️ Requerimientos de Infraestructura por Plan

Para garantizar el rendimiento según el volumen de usuarios:

**Free / Starter**
- Database: Shared Postgres Instance
- Storage: Cloudinary / S3 (Standard Tier)
- Compute: Shared vCPU

**Pro**
- Database: Dedicated connections or higher pool priority
- Storage: CDN Optimized delivery
- Compute: Priority processing for webhooks/emails

**Enterprise**
- Database: Isolated DB Schema or dedicated instance (opcional)
- Domain: Custom SSL Certificates management
- SLAs: 99.9% Uptime guarantee
