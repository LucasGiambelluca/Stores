# 🛍️ Guía de Configuración - Tienda Online

**Para emprendedores sin experiencia técnica**

Esta guía te va a ayudar a configurar tu tienda en menos de 30 minutos.

---

## 📋 Lo que vas a necesitar

Antes de empezar, tené a mano:
- ✅ Una cuenta de Gmail (para los emails de la tienda)
- ✅ Tu DNI o CUIT (para MercadoPago)
- ✅ 30 minutos de tu tiempo

---

## Paso 1: Crear cuenta en MercadoPago 💳

MercadoPago es lo que te permite recibir pagos con tarjeta, transferencia, etc.

### 1.1 Registrarte
1. Andá a [mercadopago.com.ar](https://www.mercadopago.com.ar/)
2. Click en **"Crear cuenta"**
3. Elegí **"Quiero vender"**
4. Completá tus datos personales

### 1.2 Obtener tus credenciales
1. Una vez logueado, andá a [Tus Integraciones](https://www.mercadopago.com.ar/developers/panel/app)
2. Click en **"Crear aplicación"**
3. Ponele un nombre (ej: "Mi Tienda Online")
4. Como tipo elegí **"Pagos online"**
5. Click en **"Crear"**

### 1.3 Copiar las claves
En la aplicación que creaste, vas a ver:
- **Access Token** → Clave larga que empieza con `APP_USR-...`
- **Public Key** → Clave que empieza con `APP_USR-...` más corta

> ⚠️ **IMPORTANTE**: Nunca compartas el Access Token con nadie

### 1.4 Para probar primero (opcional)
Si querés probar sin usar dinero real:
1. En el panel, andá a **"Credenciales de prueba"**
2. Copiá las que empiezan con `TEST-`

---

## Paso 2: Configurar imágenes con Cloudinary 🖼️

Cloudinary guarda las fotos de tus productos en la nube (gratis hasta 25GB).

### 2.1 Crear cuenta
1. Andá a [cloudinary.com](https://cloudinary.com/)
2. Click en **"Sign Up for Free"**
3. Registrate con Google o email

### 2.2 Obtener credenciales
1. Una vez adentro, vas al **Dashboard**
2. Vas a ver un recuadro que dice **"API Environment variable"**
3. Copiá estos 3 datos:
   - **Cloud name** (ej: `dxyz1234`)
   - **API Key** (números)
   - **API Secret** (letras y números)

> 💡 **TIP**: Están justo arriba del recuadro gris

---

## Paso 3: Configurar tu tienda ⚙️

### 3.1 Usar el asistente de configuración (Recomendado)
```
cd server
pnpm run setup
```

El asistente te va a preguntar cada dato paso a paso.

### 3.2 Configurar manualmente
Si preferís hacerlo a mano:

1. Abrí el archivo `server/.env`
2. Completá estos campos:

```env
# === TU TIENDA ===
STORE_NAME=Nombre de Tu Tienda
STORE_EMAIL=tumail@gmail.com
STORE_PHONE=+54 9 11 1234-5678

# === MERCADOPAGO ===
MP_ACCESS_TOKEN=APP_USR-PEGA-TU-ACCESS-TOKEN-ACA
MP_PUBLIC_KEY=APP_USR-PEGA-TU-PUBLIC-KEY-ACA

# === CLOUDINARY ===
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcDEF123_ghiJKL456
```

---

## Paso 4: Personalizar colores 🎨

Podés cambiar los colores de tu tienda editando estas variables:

```env
THEME_PRIMARY_COLOR=#E5B800      # Color principal (botones)
THEME_SECONDARY_COLOR=#1a1a1a    # Fondo oscuro
THEME_ACCENT_COLOR=#10B981       # Color de éxito (verde)
```

### Ejemplos de paletas:

| Estilo | Primary | Secondary | Accent |
|--------|---------|-----------|--------|
| Dorado (default) | `#E5B800` | `#1a1a1a` | `#10B981` |
| Rosa Moderno | `#EC4899` | `#1f1f1f` | `#8B5CF6` |
| Azul Profesional | `#3B82F6` | `#111827` | `#10B981` |
| Naranja Energético | `#F97316` | `#0c0c0c` | `#22D3EE` |

---

## Paso 5: Agregar productos 📦

### Opción A: Desde el Panel Admin (Recomendado)
1. Abrí [localhost:3000/#/admin](http://localhost:3000/#/admin)
2. Logueate con:
   - Email: `admin@tienda.com`
   - Contraseña: `admin123`
3. Andá a **Productos** → **Agregar Producto**

### Opción B: Cargar productos de ejemplo
```
cd server
pnpm run seed
```
Esto crea 4 categorías y 6 productos de muestra para que veas cómo queda.

---

## ❓ Problemas comunes

### "Error al procesar pago"
- Verificá que el Access Token de MercadoPago esté bien copiado
- Si estás probando, usá las credenciales TEST

### "Error al subir imagen"
- Verificá las 3 credenciales de Cloudinary
- Asegurate de que no haya espacios antes/después

### "El servidor no arranca"
- Ejecutá `cd server && pnpm run setup` para verificar variables
- Revisá que el puerto 3001 no esté ocupado

---

## 📞 ¿Necesitás ayuda?

Si algo no funciona:
1. Revisá que hayas copiado las claves **exactamente como aparecen**
2. Reiniciá el servidor con `pnpm run dev`
3. Probá en una ventana de incógnito del navegador

---

**¡Listo! Tu tienda está configurada** 🎉

Ahora podés:
- Agregar tus productos desde el panel admin
- Personalizar los colores
- Compartir el link con tus clientes
