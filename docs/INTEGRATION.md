# Guía de Integración - Landing Page

Este documento detalla los endpoints disponibles para conectar la Landing Page externa con el sistema Tiendita (Mothership + Backend).

**Base URL:** `https://api.tiendita.com/api` (o `http://localhost:3001/api` en desarrollo)

---

## 1. CMS (Contenido Dinámico)

Obtiene el contenido de la landing page configurado desde el Mothership. Esto permite cambiar textos, precios y testimonios sin tocar el código.

### `GET /landing-config`

**Respuesta Exitosa (200 OK):**
```json
{
  "content": {
    "hero": {
      "title": "Crea tu tienda online",
      "subtitle": "Empieza gratis hoy mismo"
    },
    "pricing": {
      "starter": 1000,
      "pro": 2000
    },
    "features": [ ... ]
  }
}
```

---

## 2. Verificación de Dominio

Verifica si el nombre de la tienda (subdominio) está disponible antes de permitir el registro.

### `GET /stores/check-domain`

**Parámetros (Query):**
- `subdomain`: El nombre deseado para la tienda (ej: `mitienda`).

**Ejemplo:** `/stores/check-domain?subdomain=mitienda`

**Respuesta Exitosa (200 OK):**
```json
{
  "available": true // o false
}
```

---

## 3. Registro y Creación de Tienda

Crea la tienda, el usuario administrador y devuelve el token de sesión.

### `POST /auth/register`

**Body (JSON):**
```json
{
  "email": "cliente@email.com",
  "password": "passwordSeguro123",
  "name": "Juan Pérez",
  "phone": "1122334455",
  "storeName": "Mi Tienda Increíble" // IMPORTANTE: Esto dispara la creación de la tienda
}
```

**Respuesta Exitosa (201 Created):**
```json
{
  "message": "Tienda y usuario creados exitosamente",
  "token": "eyJhbGciOiJIUz...", // JWT Token para autenticación automática
  "refreshToken": "...",
  "user": {
    "id": "uuid-user",
    "email": "cliente@email.com",
    "role": "admin",
    "storeId": "uuid-store"
  },
  "store": {
    "id": "uuid-store",
    "name": "Mi Tienda Increíble",
    "domain": "mi-tienda-increible",
    "status": "pending"
  }
}
```

**Errores Comunes:**
- `400 Bad Request`: "El nombre de la tienda no está disponible" o "El email ya está registrado".

---

## 4. Pagos (Suscripción)

Genera una intención de pago (Preferencia de MercadoPago) para la suscripción SaaS.

### `POST /payments/create-intent`

**Body (JSON):**
```json
{
  "planId": "pro",          // "starter" o "pro"
  "billingCycle": "annual", // "monthly", "annual", "biennial"
  "storeName": "Mi Tienda Increíble",
  "email": "cliente@email.com"
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "preferenceId": "1234567890-preference-id", // ID para usar con SDK de Frontend
  "initPoint": "https://www.mercadopago.com.ar/checkout/v1/redirect?...", // Link directo al checkout
  "publicKey": "TEST-..." // Public Key para inicializar SDK si es necesario
}
```

---

## Flujo Recomendado

1.  **Carga:** Al entrar a la landing, llamar a `GET /landing-config` para llenar los textos.
2.  **Input:** Cuando el usuario escribe el nombre de su tienda, llamar a `GET /stores/check-domain` (con debounce).
3.  **Registro:** Al hacer clic en "Crear Tienda", llamar a `POST /auth/register`.
4.  **Éxito:**
    *   Guardar el `token` en localStorage/cookies.
    *   Redirigir al usuario a `https://[su-tienda].tiendita.com/admin` (o al checkout si cobras antes).
5.  **Pago (Opcional):** Si el flujo requiere pago inmediato, llamar a `POST /payments/create-intent` y redirigir al `initPoint`.
