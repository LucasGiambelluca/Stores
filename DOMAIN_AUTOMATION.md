# 🌐 Automatización de Dominios Personalizados

Para permitir que los clientes conecten sus propios dominios (ej: `tienda.marcalocal.com` o `marcalocal.com`) de forma automática y con SSL, recomendamos utilizar **Vercel Domains API** o **Cloudflare for SaaS**.

## Estrategia Recomendada: Vercel (Infraestructura Actual)

Dado que el frontend está en tecnología Next.js/Vite, Vercel ofrece la integración más fluida.

### 1. Flujo del Usuario
1.  **Configuración**: El cliente ingresa su dominio en el Panel Admin (ej: `mitienda.com`).
2.  **Instrucción DNS**: El sistema le pide configurar un registro DNS:
    *   **Subdominio**: CNAME `www` -> `cname.tiendita.app`
    *   **Apex**: A Record -> `76.76.21.21` (Vercel IP)
3.  **Verificación**: El sistema consulta periódicamente si los DNS propagaron.
4.  **Activación**: Una vez verificado, la tienda carga bajo ese dominio con SSL automático.

### 2. Implementación Técnica

#### Backend (Node.js)
Necesitamos endpoints para comunicar con la API del proveedor de infraestructura.

**Endpoint: `POST /api/domains`**
- Valida formato del dominio.
- Guarda en DB (`stores.custom_domain`).
- Llama a Vercel API: `POST /v9/projects/{projectId}/domains`.

**Endpoint: `GET /api/domains/:domain/verify`**
- Consulta estado de verificación en Vercel.
- Devuelve status (Limitaciones de configuración, pendiente, activo).

#### Middleware (Next.js / Frontend)
El frontend debe detectar qué tienda cargar según el `Host` header.

```typescript
// middleware.ts
export default function middleware(req: Request) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host");
  
  // Si es dominio propio (no termina en tiendita.app)
  if (!hostname.includes("tiendita.app")) {
    // Reescribir internamente a la ruta dinámica de la tienda
    url.pathname = `/_sites/${hostname}${url.pathname}`;
    return NextResponse.rewrite(url);
  }
}
```

### 3. Proveedor Alternativo: Cloudflare for SaaS
Si se busca escalar fuera de Vercel (ej: VPS propio + Coolify), Cloudflare es ideal.
- **Custom Hostnames**: Permite emitir certificados SSL para miles de dominios apuntando a tu servidor.
- **Ventaja**: Desacoplado del hosting del frontend.
- **Costo**: Tiene capa gratuita, luego costo por dominio activo (~$2/mes enterprise, o pay-as-you-go).

## 📋 Pasos para Implementar

1.  Obtener Token de API de Vercel/Cloudflare.
2.  Crear servicio `DomainManager.ts` en backend.
3.  Actualizar tabla `stores` para guardar estado de verificación (`domain_status`, `domain_verification_code`).
4.  Implementar UI en Panel Admin para "Conectar Dominio".

---
**Recomendación**: Comenzar con **Vercel Domains** si el frontend se hostea allí, por simplicidad de implementación (cero configuración de certificados).
