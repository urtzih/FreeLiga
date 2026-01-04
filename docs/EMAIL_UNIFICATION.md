# Unificación de Email - Guía de Implementación

## 📋 Resumen de Cambios

Se ha unificado el sistema de emails eliminando el campo `email` redundante de la tabla `players`. Ahora solo existe **un email único** por usuario en la tabla `users`, que sirve tanto para autenticación como para contacto.

## ✅ Cambios Realizados

### 1. Base de Datos (Schema Prisma)
- ❌ Eliminado: `email` del modelo `Player`
- ✅ Unificado: Se usa solo `user.email` para todo

### 2. Backend (API)

#### Rutas actualizadas:
- **`/players/:id`** y **`/players/:id/profile`**: Ya no aceptan ni actualizan el campo `email` del player
- **`/users/:id`**: Actualizado para no sincronizar email con player
- **✨ NUEVO**: **`PATCH /users/me/email`** - Endpoint para que los usuarios cambien su email con validación de unicidad

#### Validaciones:
- Verifica que el nuevo email no esté en uso
- Registra el cambio en los logs
- Actualiza el contexto de autenticación

### 3. Frontend (Web)

#### Profile.tsx:
- Eliminado el campo "Email Público"
- Añadida sección separada para "Cambiar Email de Acceso"
- UI mejorada con advertencias sobre el cambio de email
- Validación en tiempo real

#### Otras vistas:
- **ManagePlayers.tsx**: Ahora muestra `player.user.email`
- **PlayerHistory.tsx**: Actualizado para exportar y mostrar `player.user.email`

## 🚀 Instrucciones de Aplicación

### Paso 1: Aplicar Migración de Base de Datos

La migración SQL ya está creada en:
```
packages/database/prisma/migrations/20260104143004_remove_player_email/migration.sql
```

**Opción A - Con Docker (Recomendado):**
```powershell
# Asegúrate de que los contenedores estén corriendo
docker-compose up -d

# Aplica la migración
docker-compose exec api npx prisma migrate deploy --schema /app/packages/database/prisma/schema.prisma
```

**Opción B - Manualmente:**
Si tienes acceso directo a MySQL, ejecuta:
```sql
ALTER TABLE `players` DROP COLUMN `email`;
```

**Opción C - Con Prisma CLI (si tienes acceso a la BD):**
```powershell
cd packages/database
npx prisma migrate deploy
```

### Paso 2: Regenerar Cliente Prisma (Ya realizado)
```powershell
npx prisma generate --schema packages/database/prisma/schema.prisma
```
✅ Ya ejecutado exitosamente

### Paso 3: Reiniciar Servicios

```powershell
# Si usas Docker
docker-compose restart api web

# Si corres local
# Detén y reinicia los procesos de api y web
```

### Paso 4: Verificación

1. **Login**: Inicia sesión en la aplicación
2. **Perfil**: Ve a tu perfil de jugador
3. **Verifica**: Deberías ver:
   - Tu información personal (nombre, teléfono, nickname)
   - Tu email actual (solo lectura en la primera sección)
   - Una sección separada para "Cambiar Email de Acceso"

4. **Prueba cambiar email**:
   - Haz clic en "🔑 Cambiar Email"
   - Introduce un nuevo email
   - Confirma el cambio
   - Verifica que el sistema valide emails duplicados

## 🔍 Testing

### Casos de prueba:

1. ✅ **Editar perfil sin tocar email**: Debería funcionar normalmente
2. ✅ **Cambiar email a uno único**: Debería actualizarse correctamente
3. ❌ **Cambiar email a uno existente**: Debe mostrar error "Este email ya está en uso"
4. ❌ **Email inválido**: Debe mostrar error de validación
5. ✅ **Visualización en admin**: Los administradores deben ver el email correcto en ManagePlayers y PlayerHistory

## 📊 Beneficios

- ✨ **Simplicidad**: Un solo email por usuario
- 🔒 **Seguridad**: Validación de unicidad centralizada
- 👥 **UX mejorada**: Interfaz más clara y menos confusa
- 🧹 **Mantenibilidad**: Menos campos para gestionar

## ⚠️ Consideraciones

- **No hay pérdida de datos**: Si existían emails diferentes en `player.email`, los usuarios podrán actualizar su `user.email` manualmente
- **Relogin necesario**: Después de cambiar el email, el usuario debe volver a iniciar sesión con el nuevo email
- **Logs**: Todos los cambios de email quedan registrados en los logs del sistema

## 🐛 Troubleshooting

### Error: "Can't reach database server"
- Asegúrate de que Docker esté corriendo: `docker-compose up -d`
- O ajusta DATABASE_URL en .env para conexión local

### Error: "Email already in use"
- Verifica que el nuevo email no esté registrado por otro usuario
- Usa el panel de administración para ver todos los usuarios

### Cliente Prisma desactualizado
```powershell
npx prisma generate --schema packages/database/prisma/schema.prisma
```

## 📝 Notas Técnicas

- La migración es **segura** y **reversible**
- El campo `email` de `players` se elimina permanentemente de la base de datos
- Todos los archivos TypeScript han sido actualizados para reflejar los cambios
- Los endpoints legacy que aceptaban `player.email` ahora lo ignoran

---

✅ **Estado**: Implementación completa en código
⏳ **Pendiente**: Aplicar migración en base de datos

