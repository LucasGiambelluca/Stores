# 🚀 Guía de Inicio Rápido - Tiendita + Mothership

## Opción 1: Usar script npm (Recomendado)

Inicia todos los servicios en una sola terminal:

```bash
pnpm run dev:all
```

Esto ejecutará:
- 🔧 Backend Server → http://localhost:3001/api
- 🎨 Cliente Store → http://localhost:3005
- 🚢 Mothership Panel → http://localhost:5173

> **Nota**: Todos los logs aparecerán en la misma terminal con colores diferentes

---

## Opción 2: Usar script PowerShell (Ventanas separadas)

Ejecuta el script que abre cada servicio en su propia ventana:

```powershell
.\start-all.ps1
```

Esto abrirá 3 ventanas de PowerShell separadas, una para cada servicio.

> **Ventajas**: Logs separados, fácil de cerrar individualmente  
> **Desventaja**: Más ventanas abiertas

---

## Opción 3: Manual (Para debugging)

Si necesitás iniciar los servicios por separado:

### Terminal 1 - Backend
```bash
cd server
pnpm run dev
```

### Terminal 2 - Cliente
```bash
cd client
pnpm run dev
```

### Terminal 3 - Mothership
```bash
cd mothership
pnpm run dev
```

---

## 📋 URLs de Acceso

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Backend API** | http://localhost:3001/api | Endpoints REST |
| **Cliente Store** | http://localhost:3005 | Tienda pública |
| **Mothership** | http://localhost:5173 | Panel de gestión de licencias |

---

## 🛑 Detener los Servicios

### Si usaste `pnpm run dev:all`:
- Presiona `Ctrl + C` en la terminal

### Si usaste `start-all.ps1`:
- Cierra cada ventana de PowerShell

### Si usaste modo manual:
- Presiona `Ctrl + C` en cada terminal

---

## ✅ Verificar que Todo Funciona

1. **Backend**: Abre http://localhost:3001/api/health (debería responder OK)
2. **Cliente**: Abre http://localhost:3005 (debería mostrar la tienda)
3. **Mothership**: Abre http://localhost:5173 (debería mostrar el login)

---

## 🔧 Troubleshooting

### Error: "Port already in use"
Algún servicio ya está corriendo en ese puerto. Opciones:
- Busca y cierra el proceso: `Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process`
- O cambia el puerto en el archivo `.env`

### Error: "Cannot find module"
Instala las dependencias:
```bash
pnpm install
```

### Servicios no arrancan
Verifica que tenés todas las variables de entorno en `server/.env`:
```bash
cd server
pnpm run setup
```
