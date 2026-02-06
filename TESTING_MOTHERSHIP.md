# Testing Guide - Mothership Panel

## 🔧 Setup Requirements

### 1. Database Migration

Ejecutar en Supabase SQL Editor:

```sql
-- Ver archivo: server/drizzle/migrations/002_run_in_supabase.sql
```

O usar el script:
```bash
cd server
node src/scripts/run-migration.ts
```

### 2. Crear Super Admin User

En la base de datos, actualizar un usuario existente a super_admin:

```sql
UPDATE users 
SET role = 'super_admin' 
WHERE email = 'tu-email@ejemplo.com';
```

### 3. Iniciar Servicios

```bash
# Terminal 1 - Backend
cd server
pnpm run dev

# Terminal 2 - Mothership
cd mothership
pnpm run dev

# Terminal 3 - Cliente (opcional)
cd client
pnpm run dev
```

---

## 🧪 Test Cases

### Test 1: Crear Licencia en Mothership

**Objetivo**: Verificar que se puede generar una licencia.

**Pasos**:
1. Acceder a http://localhost:5173 (Mothership)
2. Login con usuario super_admin
3. Ir a "Licencias"
4. Click "Nueva Licencia"
5. Completar formulario:
   - Plan: Pro
   - Duración: 1 año
   - Email: test@ejemplo.com
   - Nombre: Test User
6. Click "Generar Licencia"

**Resultado Esperado**:
- ✅ Modal se cierra
- ✅ Aparece nueva licencia en tabla
- ✅ Serial tiene formato TND-XXXX-XXXX-XXXX
- ✅ Estado = "Generada"
- ✅ Se puede copiar el serial

**API Call**:
```bash
curl -X POST http://localhost:3001/api/mothership/licenses \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "pro",
    "duration": "1year",
    "ownerEmail": "test@ejemplo.com",
    "ownerName": "Test User"
  }'
```

---

### Test 2: Ver Dashboard con Stats

**Objetivo**: Verificar que el dashboard muestra métricas correctas.

**Pasos**:
1. En Mothership, ir a Dashboard
2. Observar cards de métricas

**Resultado Esperado**:
- ✅ Total Licencias = 1 (o más)
- ✅ Generadas = 1
- ✅ Activas = 0
- ✅ Cards se actualizan en tiempo real

**API Call**:
```bash
curl http://localhost:3001/api/mothership/licenses/stats \
  -H "Authorization: Bearer {token}"
```

---

### Test 3: Filtrar Licencias

**Objetivo**: Verificar filtros funcionales.

**Pasos**:
1. En página Licencias
2. Usar filtro de Estado: "Generadas"
3. Buscar por email
4. Filtrar por Plan: "Pro"

**Resultado Esperado**:
- ✅ Tabla se filtra correctamente
- ✅ Búsqueda funciona
- ✅ Combinación de filtros funciona

---

### Test 4: Activar Licencia en Cliente

**Objetivo**: Verificar activación de licencia.

**Pasos**:
1. Copiar serial generado (TND-XXXX-XXXX-XXXX)
2. En cliente (http://localhost:3005), abrir modal de activación
3. Pegar serial
4. Click "Activar"

**Resultado Esperado**:
- ✅ Mensaje de éxito
- ✅ Modal se cierra
- ✅ Página se recarga
- ✅ Licencia visible en config

**API Call**:
```bash
curl -X POST http://localhost:3001/api/license/activate \
  -H "Content-Type: application/json" \
  -d '{"serial": "TND-XXXX-XXXX-XXXX"}'
```

**Respuesta Esperada**:
```json
{
  "success": true,
  "message": "¡Licencia activada exitosamente!",
  "license": {
    "serial": "TND-XXXX-XXXX-XXXX",
    "plan": "pro",
    "expiresAt": "2025-12-19T...",
    "maxProducts": 1000,
    "maxOrders": null
  }
}
```

---

### Test 5: Verificar Licencia Activada en Mothership

**Objetivo**: Confirmar que el estado cambió.

**Pasos**:
1. Volver a Mothership
2. Ir a Licencias
3. Buscar la licencia activada

**Resultado Esperado**:
- ✅ Estado cambió a "Activa"
- ✅ Badge verde
- ✅ Fecha de activación visible
- ✅ No se puede volver a activar

---

### Test 6: Check-in

**Objetivo**: Verificar health check funciona.

**API Call**:
```bash
curl -X POST http://localhost:3001/api/license/checkin \
  -H "Content-Type: application/json" \
  -d '{
    "serial": "TND-XXXX-XXXX-XXXX",
    "stats": {
      "products": 10,
      "orders": 5
    }
  }'
```

**Resultado Esperado**:
```json
{
  "success": true,
  "status": "activated"
}
```

---

### Test 7: Obtener Status de Licencia

**Objetivo**: Verificar endpoint de status.

**API Call**:
```bash
curl http://localhost:3001/api/license/status
```

**Resultado Esperado**:
```json
{
  "activated": true,
  "license": {
    "serial": "TND-XXXX-XXXX-XXXX",
    "plan": "pro",
    "status": "activated",
    ...
  }
}
```

---

## ❌ Error Cases

### Test E1: Serial Inválido

```bash
curl -X POST http://localhost:3001/api/license/activate \
  -H "Content-Type: application/json" \
  -d '{"serial": "INVALID"}'
```

**Esperado**: 400 Bad Request
```json
{
  "error": "Invalid serial format",
  "message": "El serial debe tener el formato TND-XXXX-XXXX-XXXX"
}
```

### Test E2: Serial No Existe

```bash
curl -X POST http://localhost:3001/api/license/activate \
  -H "Content-Type: application/json" \
  -d '{"serial": "TND-AAAA-BBBB-CCCC"}'
```

**Esperado**: 404 Not Found

### Test E3: Serial Ya Activado

Intentar activar el mismo serial dos veces.

**Esperado**: 400 Bad Request
```json
{
  "error": "License already activated",
  "message": "Este serial ya está activado en otra tienda."
}
```

---

## 📊 Verification Checklist

- [ ] Migration ejecutada sin errores
- [ ] Super admin user creado
- [ ] Login en Mothership exitoso
- [ ] Dashboard muestra stats correctas
- [ ] Crear licencia funciona
- [ ] Tabla muestra licencias
- [ ] Copiar serial funciona
- [ ] Filtros funcionan
- [ ] Activación en cliente funciona
- [ ] Estado cambia a "Activa" en Mothership
- [ ] Check-in funciona
- [ ] Status endpoint funciona
- [ ] Error cases manejados correctamente

---

## 🐛 Common Issues

### Issue 1: "Super admin access required"
**Solución**: Actualizar role en DB a 'super_admin'

### Issue 2: "License not found"
**Solución**: Verificar que migration se ejecutó

### Issue 3: "CORS error"
**Solución**: Verificar que server está corriendo en puerto 3001

### Issue 4: Mothership no carga
**Solución**: Revisar que todas las dependencias se instalaron

---

## 🎯 Success Criteria

✅ Todas las pruebas pasan
✅ No hay errores en consola
✅ Flow completo: crear → enviar → activar funciona
✅ Dashboard actualiza en tiempo real
✅ Error handling funciona correctamente
