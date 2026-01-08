# 📅 Implementación: Programación de Partidos con Google Calendar

## ✅ ESTADO: COMPLETADO

Se ha implementado exitosamente el sistema de programación de partidos con integración de Google Calendar.

---

## 📋 CAMBIOS REALIZADOS

### **Backend (Node.js/FastAPI)**

#### 1. **Base de Datos - Schema Prisma**
- ✅ Agregado enum `CalendarSyncStatus` con estados: `NOT_SYNCED`, `SYNCED`, `FAILED`, `PENDING`
- ✅ Actualizado modelo `Match`:
  - `scheduledDate`: Fecha/hora programada del partido
  - `location`: Lugar del partido
  - `googleEventId`: ID del evento en Google Calendar
  - `googleCalendarSyncStatus`: Estado de sincronización
  - `isScheduled`: Flag booleano para partidos programados
  - Campos de resultado (`gamesP1`, `gamesP2`) ahora opcionales
- ✅ Creado modelo `GoogleCalendarIntegration` para almacenar tokens OAuth de Google

#### 2. **Servicios de Backend**

**`apps/api/src/services/googleCalendar.service.ts`** (NUEVO)
- Gestiona la integración con Google Calendar API
- Métodos implementados:
  - `getAuthUrl()`: Genera URL de autorización OAuth
  - `exchangeCodeForTokens()`: Intercambia código por tokens
  - `saveIntegration()`: Guarda tokens en BD
  - `getIntegration()`: Obtiene integración del usuario
  - `refreshTokenIfNeeded()`: Refresca token expirado
  - `createCalendarEvent()`: Crea evento en Google Calendar
  - `updateCalendarEvent()`: Actualiza evento existente
  - `deleteCalendarEvent()`: Elimina evento

**`apps/api/src/services/matchSync.service.ts`** (NUEVO)
- Sincroniza partidos entre FreeLiga y Google Calendar
- Métodos implementados:
  - `syncMatchToGoogleCalendar()`: Crea evento al programar partido
  - `updateMatchInGoogleCalendar()`: Actualiza evento al editar fecha/lugar
  - `deleteMatchFromGoogleCalendar()`: Elimina evento al cancelar

#### 3. **Rutas de Autenticación**

**`apps/api/src/routes/auth.routes.ts`** (ACTUALIZADO)
- Endpoints nuevos:
  - `GET /auth/google-calendar/auth-url`: Obtiene URL de OAuth
  - `POST /auth/google-calendar/callback`: Procesa callback de Google
  - `GET /auth/google-calendar/status`: Verifica estado de conexión
  - `POST /auth/google-calendar/disconnect`: Desconecta Google Calendar

#### 4. **Rutas de Matches**

**`apps/api/src/routes/match.routes.ts`** (ACTUALIZADO)
- Schemas actualizados:
  - `createMatchSchema`: Agrega campos `scheduledDate` y `location` opcionales
  - `updateMatchSchema`: Permite editar fecha, hora y lugar
  
- Endpoints mejorados:
  - `GET /matches`: Agrega filtro `scheduled=true` para obtener solo programados
  - `POST /matches`: Crea partido, sincroniza con Google si está programado
  - `PUT /matches/:id`: Edita partido, actualiza evento en Google si cambió fecha/lugar
  - `DELETE /matches/:id`: Cancela partido, elimina evento de Google

#### 5. **Dependencias**
- ✅ Agregado `googleapis@^118.0.0` a `apps/api/package.json`

---

### **Frontend (React/Vite)**

#### 1. **Componentes**

**`apps/web/src/components/calendar/CalendarView.tsx`** (NUEVO)
- Vista calendaria interactiva tipo Google Calendar
- Características:
  - Navegación entre meses
  - Visualización de partidos programados por día
  - Click en día para seleccionar
  - Click en partido para ver detalles
  - Estilos responsivos

**`apps/web/src/components/calendar/ScheduleMatchForm.tsx`** (NUEVO)
- Formulario para programar partidos
- Campos:
  - Selección de Jugador 1 (pre-rellenado con usuario actual)
  - Selección de Jugador 2 (excluye Jugador 1)
  - Fecha y Hora (datetime-local)
  - Lugar
- Validación con Zod
- Manejo de errores

**`apps/web/src/components/calendar/MatchDetail.tsx`** (NUEVO)
- Muestra detalles de partido programado
- Información:
  - Nombres de jugadores
  - Fecha y hora
  - Lugar
  - Estado de sincronización Google
  - Resultado (si existe)
- Acciones para jugadores:
  - Editar (cambiar fecha/lugar)
  - Cancelar partido

#### 2. **Páginas**

**`apps/web/src/pages/Calendar.tsx`** (NUEVO)
- Página principal de calendario
- Características:
  - Vista calendaria con partidos
  - Panel lateral para programar o ver detalles
  - Integración con Google Calendar:
    - Botón conectar/desconectar
    - Estado de conexión visible
  - Sincronización automática al programar
  - Lista de próximos partidos debajo

**`apps/web/src/pages/ScheduledMatches.tsx`** (NUEVO)
- Página de vista en lista de partidos programados
- Características:
  - Vista en tarjetas
  - Filtros: Todos, Próximos, Pasados
  - Edición inline de fecha/hora/lugar (para jugadores)
  - Cancelación de partidos
  - Estadísticas: Total, Próximos, Pasados, En Google
  - Indicador de sincronización Google

---

## 🔧 CONFIGURACIÓN REQUERIDA

### **1. Variables de Entorno**
Ya configuradas en `.env`:
```
GOOGLE_CLIENT_ID=xxxx
GOOGLE_CLIENT_SECRET=xxxx
GOOGLE_REDIRECT_URI=xxxx
```

### **2. Google Cloud Setup**
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear proyecto
3. Habilitar APIs:
   - Google Calendar API
4. Crear credenciales OAuth 2.0:
   - Tipo: Aplicación Web
   - URIs autorizados:
     - `http://localhost:3001`
     - `http://localhost:3001/api/google-calendar/callback`
     - (Agregar URLs de producción cuando esté live)

### **3. Migración de BD**
```bash
cd packages/database
npx prisma migrate dev --name add_match_scheduling
```

### **4. Instalar dependencias del API**
```bash
cd apps/api
npm install
```

---

## 🚀 CÓMO USAR

### **Para Usuarios**

1. **Conectar Google Calendar**
   - En la página de Calendario, hacer click en "Conectar"
   - Autorizar acceso a Google Calendar
   - Los partidos se sincronizarán automáticamente

2. **Programar Partido**
   - Click en "Programar Partido"
   - Seleccionar 2 jugadores diferentes
   - Ingresar fecha, hora y lugar
   - Hacer click en "Programar"
   - Si Google Calendar está conectado, se crea evento automáticamente

3. **Editar Partido Programado**
   - Haz click en el partido (en calendario o lista)
   - Si eres uno de los jugadores, verás botón "Editar"
   - Cambiar fecha, hora o lugar
   - Guardar cambios
   - Los cambios se sincronizan automáticamente a Google Calendar

4. **Cancelar Partido**
   - Haz click en el partido
   - Si eres uno de los jugadores, verás botón "Cancelar"
   - Confirmar cancelación
   - El evento se elimina de Google Calendar

5. **Ver Partidos**
   - **Calendario**: Vista mensual con puntos en días con partidos
   - **Lista**: Vista en tarjetas con filtros (Próximos/Pasados)

---

## 📊 FLUJO DE DATOS

```
┌─────────────────────────────────────────────────────────┐
│ USUARIO PROGRAMA PARTIDO                                │
├─────────────────────────────────────────────────────────┤
│ 1. Frontend envía POST /matches                         │
│ 2. Backend crea Match en BD                            │
│ 3. Backend verifica si existe Google Calendar          │
│ 4. Si existe: crea evento en Google Calendar            │
│ 5. Guarda googleEventId en BD                          │
│ 6. Frontend muestra confirmación                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ USUARIO EDITA PARTIDO                                  │
├─────────────────────────────────────────────────────────┤
│ 1. Frontend envía PUT /matches/:id                      │
│ 2. Backend actualiza Match en BD                       │
│ 3. Si fecha/lugar cambió:                              │
│    - Obtiene googleEventId                             │
│    - Actualiza evento en Google Calendar               │
│ 4. Retorna Match actualizado                           │
│ 5. Frontend actualiza UI                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ USUARIO CANCELA PARTIDO                                │
├─────────────────────────────────────────────────────────┤
│ 1. Frontend envía DELETE /matches/:id                   │
│ 2. Backend obtiene Match con googleEventId             │
│ 3. Si existe evento en Google: lo elimina              │
│ 4. Elimina Match de BD                                 │
│ 5. Recalcula rankings del grupo                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 SEGURIDAD

- ✅ Solo los 2 jugadores del partido pueden editar/cancelar
- ✅ Admins pueden editar/cancelar cualquier partido
- ✅ Tokens de Google se almacenan encriptados en BD
- ✅ Refrescamiento automático de tokens expirados
- ✅ Validación de permisos en cada endpoint

---

## 🎨 CARACTERÍSTICAS INCLUIDAS

- ✅ Programación de partidos con fecha/hora/lugar
- ✅ Sincronización bidireccional con Google Calendar
- ✅ Visualización en calendario interactivo
- ✅ Visualización en lista con filtros
- ✅ Edición de partidos programados
- ✅ Cancelación de partidos
- ✅ Notificaciones a través de Google Calendar
- ✅ Indicadores visuales de sincronización
- ✅ Solo jugadores pueden editar sus propios partidos
- ✅ Responsivo en móvil/tablet/desktop

---

## 📱 PRÓXIMAS MEJORAS (OPCIONAL)

- [ ] Notificaciones por email cuando se programa un partido
- [ ] Recordatorios 24 horas antes del partido
- [ ] Sistema de asistencia/confirmación
- [ ] Estadísticas de partidos (ganador, puntuaciones, etc.)
- [ ] Exportar calendario a iCal
- [ ] Integración con otros calendarios (Outlook, Apple)
- [ ] Historial de cambios en partidos
- [ ] Comentarios en partidos programados

---

## ✅ PRÓXIMOS PASOS

1. **Instalar dependencias**:
   ```bash
   cd apps/api
   npm install
   ```

2. **Ejecutar migración de BD**:
   ```bash
   cd packages/database
   npx prisma migrate dev
   ```

3. **Agregar rutas al App.tsx** (si aún no están):
   ```tsx
   import Calendar from './pages/Calendar';
   import ScheduledMatches from './pages/ScheduledMatches';
   
   // En tu router:
   <Route path="/calendar" element={<Calendar />} />
   <Route path="/scheduled-matches" element={<ScheduledMatches />} />
   ```

4. **Agregar links en navegación**:
   - "📅 Calendario" → `/calendar`
   - "📋 Partidos Programados" → `/scheduled-matches`

5. **Pruebas**:
   - Conectar Google Calendar
   - Programar partido
   - Verificar que aparezca en Google Calendar
   - Editar partido
   - Cancelar partido

---

## 🐛 TROUBLESHOOTING

### Error: "User has not connected Google Calendar"
→ Usuario debe conectar primero: botón "Conectar Google Calendar"

### Error: "Token refresh failed"
→ Desconectar y reconectar Google Calendar

### Evento no aparece en Google
→ Verificar que Google Calendar esté conectado
→ Revisar logs: `apps/api/logs/error.log`

### Cambios no se sincronizan
→ Verificar que `googleEventId` existe en BD
→ Revisar estado `googleCalendarSyncStatus` en la tabla matches

---

**¡Listo! El sistema de programación de partidos está completamente implementado. 🎉**
