# 🎯 IMPLEMENTACIÓN COMPLETADA: Programación de Partidos con Google Calendar

## ✅ ESTADO: LISTO PARA USAR

Se ha implementado completamente el sistema de programación de partidos con integración de Google Calendar.

---

## 📦 ARCHIVOS CREADOS/MODIFICADOS

### **Backend**
- ✅ `apps/api/src/services/googleCalendar.service.ts` - Servicio de Google Calendar
- ✅ `apps/api/src/services/matchSync.service.ts` - Servicio de sincronización
- ✅ `apps/api/src/routes/auth.routes.ts` - Endpoints OAuth (MODIFICADO)
- ✅ `apps/api/src/routes/match.routes.ts` - Endpoints de partidos (MODIFICADO)
- ✅ `apps/api/package.json` - Dependencias (MODIFICADO)

### **Frontend**
- ✅ `apps/web/src/components/calendar/CalendarView.tsx` - Vista de calendario
- ✅ `apps/web/src/components/calendar/ScheduleMatchForm.tsx` - Formulario de programación
- ✅ `apps/web/src/components/calendar/MatchDetail.tsx` - Detalles del partido
- ✅ `apps/web/src/pages/Calendar.tsx` - Página de calendario
- ✅ `apps/web/src/pages/ScheduledMatches.tsx` - Página de lista de partidos
- ✅ `apps/web/src/App.tsx` - Rutas (MODIFICADO)

### **Base de Datos**
- ✅ `packages/database/prisma/schema.prisma` - Schema actualizado (MODIFICADO)

---

## 🚀 PASOS PARA ACTIVAR

### **1. Instalar Dependencias del API**
```bash
cd apps/api
npm install
```

### **2. Ejecutar Migración de Base de Datos**
```bash
cd packages/database
npx prisma migrate dev --name add_match_scheduling
```

### **3. Reiniciar el Servidor**

Detenér y reiniciar:
```bash
# En apps/api
npm run dev

# En apps/web (en otra terminal)
npm run dev
```

### **4. Verificar que las Rutas Funcionen**

Abre el navegador y verifica:
- `http://localhost:4173/calendar` - Página de calendario
- `http://localhost:4173/scheduled-matches` - Página de partidos programados

---

## 📝 FLUJO DE TRABAJO

### **Para Jugadores**

#### 1️⃣ **Conectar Google Calendar**
- Ve a `/calendar`
- Haz click en botón "Conectar Google Calendar"
- Autoriza con tu cuenta de Google
- Verás confirmación: "Conectado"

#### 2️⃣ **Programar Partido**
- Ve a `/calendar` o `/scheduled-matches`
- Haz click en "Programar Partido"
- Selecciona los 2 jugadores
- Ingresa fecha, hora y lugar
- Haz click en "Programar"
- ✅ Se crea automáticamente en Google Calendar

#### 3️⃣ **Ver Partidos Programados**
- **Opción 1**: `/calendar` - Vista calendario interactiva
- **Opción 2**: `/scheduled-matches` - Vista lista con filtros

#### 4️⃣ **Editar Partido**
- Haz click en el partido
- Si eres uno de los jugadores, verás botón "Editar"
- Cambia fecha, hora o lugar
- Haz click en "Guardar"
- ✅ Se actualiza automáticamente en Google Calendar

#### 5️⃣ **Cancelar Partido**
- Haz click en el partido
- Si eres uno de los jugadores, verás botón "Cancelar Partido"
- Confirma la cancelación
- ✅ Se elimina automáticamente de Google Calendar

---

## 🔑 CARACTERÍSTICAS PRINCIPALES

✅ **Programación de Partidos**
- Fecha y hora específica
- Lugar del encuentro
- Selección de 2 jugadores del grupo

✅ **Google Calendar**
- Sincronización automática al crear
- Actualización al editar
- Eliminación al cancelar
- Notificaciones a través de Google

✅ **Visualización**
- Vista calendario interactiva (tipo Google Calendar)
- Vista lista con tarjetas
- Filtros: Todos, Próximos, Pasados

✅ **Edición**
- Solo los 2 jugadores pueden editar su partido
- Admins pueden editar cualquier partido
- Cambios se sincronizan automáticamente

✅ **Seguridad**
- Validación de permisos
- Solo jugadores del partido pueden accionar
- Tokens seguros

---

## 🔧 CONFIGURACIÓN OPCIONAL

### **Variables de Entorno Ya Configuradas**
```env
GOOGLE_CLIENT_ID=647089659022-...
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REDIRECT_URI=http://localhost:3001/api/google-calendar/callback
```

### **Para Producción (si despliegas)**
Necesitarás actualizar:
1. `GOOGLE_REDIRECT_URI` con tu dominio
2. Agregar URLs autorizadas en Google Cloud Console

---

## 📍 RUTAS DISPONIBLES

### **Frontend**
- `GET /calendar` - Página de calendario
- `GET /scheduled-matches` - Página de partidos programados

### **Backend (API)**
- `GET /auth/google-calendar/auth-url` - URL para OAuth
- `POST /auth/google-calendar/callback` - Procesa callback de Google
- `GET /auth/google-calendar/status` - Verifica conexión
- `POST /auth/google-calendar/disconnect` - Desconecta

- `GET /matches?scheduled=true` - Obtiene partidos programados
- `POST /matches` - Crea partido programado
- `PUT /matches/:id` - Edita partido
- `DELETE /matches/:id` - Cancela partido

---

## 🐛 TROUBLESHOOTING

### Error: "User has not connected Google Calendar"
**Solución**: Usuario debe hacer click en "Conectar Google Calendar"

### Error: "Token refresh failed"
**Solución**: Desconectar y reconectar Google Calendar

### Partido no aparece en Google Calendar
**Solución**: 
- Verificar que el estado sea "Conectado"
- Revisar logs en `apps/api/logs/error.log`

### No puedo editar un partido
**Solución**: Solo los 2 jugadores o admin pueden editar. Verifica que estés en uno de esos roles.

---

## 📊 BASE DE DATOS

Nuevos campos en tabla `matches`:
- `scheduledDate`: Fecha/hora programada
- `location`: Lugar del partido
- `googleEventId`: ID del evento en Google
- `googleCalendarSyncStatus`: Estado (NOT_SYNCED, SYNCED, FAILED)
- `isScheduled`: Flag booleano

Nueva tabla: `google_calendar_integrations`
- Almacena tokens OAuth de cada usuario
- Permite sincronización automática

---

## 💡 EJEMPLOS DE USO

### **Ejemplo 1: Programar un partido**
```
1. User A va a /calendar
2. Hace click en "Programar Partido"
3. Selecciona:
   - Jugador 1: User A
   - Jugador 2: User B
   - Fecha: 15 de enero 2026, 19:30
   - Lugar: Club Squash Central, cancha 3
4. Hace click en "Programar"
5. Se crea evento en Google Calendar automáticamente
6. User B lo ve en su Google Calendar
```

### **Ejemplo 2: Editar fecha del partido**
```
1. User A o User B van a /calendar
2. Hacen click en el partido
3. Hacen click en "Editar"
4. Cambian hora a 20:00
5. Hacen click en "Guardar"
6. Google Calendar se actualiza automáticamente
7. El otro jugador recibe notificación en Google
```

### **Ejemplo 3: Cancelar partido**
```
1. User A va a /scheduled-matches
2. Filtra por "Próximos"
3. Hace click en el partido
4. Hace click en "Cancelar Partido"
5. Confirma
6. Se elimina del calendario y Google Calendar
```

---

## ✨ PRÓXIMAS MEJORAS (OPCIONAL)

- [ ] Notificaciones por email
- [ ] Recordatorios 24h antes
- [ ] Sistema de asistencia
- [ ] Estadísticas de partidos
- [ ] Exportar a iCal
- [ ] Sincronización bidireccional con cambios en Google

---

## 📞 SOPORTE

Si encuentras algún problema:
1. Revisa los logs: `apps/api/logs/error.log`
2. Verifica que npm install fue ejecutado
3. Verifica que la migración de BD fue completada
4. Verifica que las variables de entorno están correctas

---

## ✅ CHECKLIST FINAL

- [ ] Instalé dependencias: `npm install` en `apps/api`
- [ ] Ejecuté migración de BD: `npx prisma migrate dev`
- [ ] Reinicié el servidor
- [ ] Probé acceder a `/calendar`
- [ ] Conecté Google Calendar
- [ ] Programé un partido
- [ ] Verifiqué que aparezca en Google Calendar
- [ ] Edité un partido
- [ ] Cancelé un partido

---

## 🎉 ¡Listo!

El sistema está completamente funcional. Puedes:
- 📅 **Programar partidos** con fecha, hora y lugar
- 🔗 **Sincronizar con Google Calendar** automáticamente
- 👥 **Ver todos los partidos** de tu grupo
- ✏️ **Editar partidos** (solo si eres jugador)
- ❌ **Cancelar partidos** (solo si eres jugador)

¡Disfruta! 🎾
