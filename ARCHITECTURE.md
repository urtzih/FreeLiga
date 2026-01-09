# 🏗️ ARQUITECTURA: PROGRAMACIÓN DE PARTIDOS

## DIAGRAMA DE COMPONENTES

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIO (NAVEGADOR)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vite)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Páginas:                                              │ │
│  │  • Calendar.tsx (📅 Vista calendario)                 │ │
│  │  • ScheduledMatches.tsx (📋 Vista lista)              │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Componentes:                                          │ │
│  │  • CalendarView.tsx (Calendario interactivo)          │ │
│  │  • ScheduleMatchForm.tsx (Formulario)                 │ │
│  │  • MatchDetail.tsx (Detalles)                         │ │
│  └────────────────────────────────────────────────────────┘ │
│  http://localhost:4173                                     │
└──────────────────────────────────────────────────────────────┘
                              │
                    API Calls (HTTP/JSON)
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                  BACKEND API (Fastify/Node.js)               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Rutas:                                                │ │
│  │  • GET    /matches?scheduled=true                     │ │
│  │  • POST   /matches                                    │ │
│  │  • PUT    /matches/:id                                │ │
│  │  • DELETE /matches/:id                                │ │
│  │  • GET    /auth/google-calendar/auth-url             │ │
│  │  • POST   /auth/google-calendar/callback             │ │
│  │  • GET    /auth/google-calendar/status               │ │
│  │  • POST   /auth/google-calendar/disconnect           │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Servicios:                                            │ │
│  │  • googleCalendar.service.ts (OAuth + API)            │ │
│  │  • matchSync.service.ts (Sync lógica)                 │ │
│  │  • ranking.service.ts (Cálculos existentes)           │ │
│  └────────────────────────────────────────────────────────┘ │
│  http://localhost:3001                                     │
└──────────────────────────────────────────────────────────────┘
                    │              │
        ┌───────────┘              └───────────┐
        ▼                                       ▼
┌──────────────────────┐          ┌──────────────────────────┐
│  BASE DE DATOS       │          │  GOOGLE CALENDAR API     │
│  (MySQL/Railway)     │          │  (OAuth 2.0)             │
│                      │          │                          │
│  Tablas:             │          │  • Crear eventos         │
│  • matches           │          │  • Actualizar eventos    │
│  • players           │          │  • Eliminar eventos      │
│  • groups            │          │  • Refrescar tokens      │
│  • google_calendar   │          │                          │
│    _integrations     │          │  googleapis@^118.0.0     │
└──────────────────────┘          └──────────────────────────┘
```

---

## FLUJOS DE DATOS

### 1️⃣ CONECTAR GOOGLE CALENDAR

```
Usuario clicks "Conectar"
        │
        ▼
Frontend llama:
GET /auth/google-calendar/auth-url
        │
        ▼
Backend retorna:
{ authUrl: "https://accounts.google.com/..." }
        │
        ▼
Frontend redirige a Google
        │
        ▼
Usuario autoriza
        │
        ▼
Google redirige a callback
POST /auth/google-calendar/callback?code=xxx
        │
        ▼
Backend intercambia código por tokens:
oauth2Client.getToken(code)
        │
        ▼
Backend guarda tokens en BD:
GoogleCalendarIntegration.create()
        │
        ▼
Respuesta: { success: true }
        │
        ▼
Frontend muestra: "✓ Conectado"
```

### 2️⃣ PROGRAMAR PARTIDO

```
Usuario lleña formulario y hace click
        │
        ▼
Frontend valida datos (Zod)
        │
        ▼
POST /matches
{
  groupId: "xxx",
  player1Id: "yyy",
  player2Id: "zzz",
  scheduledDate: "2026-01-15T19:30:00",
  location: "Club Squash"
}
        │
        ▼
Backend:
1. Valida jugadores en grupo
2. Crea Match en BD
3. Verifica si user tiene Google conectado
4. Si sí: crea evento en Google Calendar
5. Guarda googleEventId en BD
6. Retorna Match completo
        │
        ▼
Frontend:
1. Recibe Match
2. Muestra confirmación
3. Actualiza calendario
4. Redirige o limpia formulario
        │
        ▼
Usuario ve:
- Partido en su calendario
- Evento en Google Calendar
- Notificación de sincronización
```

### 3️⃣ EDITAR PARTIDO

```
Usuario hace click en partido
        │
        ▼
Frontend muestra MatchDetail
        │
        ▼
Si user es jugador:
  Mostrar botón "Editar"
        │
        ▼
Usuario hace click en "Editar"
        │
        ▼
Frontend muestra form con datos
        │
        ▼
Usuario cambia fecha/hora/lugar
        │
        ▼
Frontend valida cambios
        │
        ▼
PUT /matches/:id
{
  scheduledDate: "2026-01-15T20:00:00",
  location: "Club Squash"
}
        │
        ▼
Backend:
1. Verifica permisos (es jugador?)
2. Actualiza Match en BD
3. Si googleEventId existe:
   - Obtiene evento actual
   - Actualiza con nuevos datos
   - Guarda cambios
4. Retorna Match actualizado
        │
        ▼
Frontend:
1. Recibe Match
2. Actualiza UI
3. Muestra confirmación
        │
        ▼
Usuario ve cambios tanto en app como Google Calendar
```

### 4️⃣ CANCELAR PARTIDO

```
Usuario hace click en "Cancelar"
        │
        ▼
Frontend pide confirmación
        │
        ▼
Usuario confirma
        │
        ▼
DELETE /matches/:id
        │
        ▼
Backend:
1. Verifica permisos (es jugador?)
2. Si googleEventId existe:
   - Elimina evento de Google Calendar
   - No falla si hay error (best effort)
3. Elimina Match de BD
4. Recalcula rankings del grupo
5. Retorna { success: true }
        │
        ▼
Frontend:
1. Recibe success
2. Actualiza lista de partidos
3. Muestra confirmación
        │
        ▼
Evento eliminado de Google Calendar
Partido eliminado de app
```

---

## ESTRUCTURA DE DIRECTORIOS

```
FreeLiga/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── routes/
│   │       │   ├── auth.routes.ts ✏️ (MODIFICADO)
│   │       │   └── match.routes.ts ✏️ (MODIFICADO)
│   │       ├── services/
│   │       │   ├── googleCalendar.service.ts ✨ (NUEVO)
│   │       │   ├── matchSync.service.ts ✨ (NUEVO)
│   │       │   └── ranking.service.ts (existente)
│   │       └── utils/
│   │           └── logger.ts (existente)
│   └── web/
│       ├── src/
│       │   ├── App.tsx ✏️ (MODIFICADO - rutas)
│       │   ├── pages/
│       │   │   ├── Calendar.tsx ✨ (NUEVO)
│       │   │   └── ScheduledMatches.tsx ✨ (NUEVO)
│       │   └── components/
│       │       └── calendar/
│       │           ├── CalendarView.tsx ✨ (NUEVO)
│       │           ├── ScheduleMatchForm.tsx ✨ (NUEVO)
│       │           └── MatchDetail.tsx ✨ (NUEVO)
├── packages/
│   └── database/
│       └── prisma/
│           └── schema.prisma ✏️ (MODIFICADO - nuevos campos/modelos)
└── docs/
    ├── IMPLEMENTATION_SUMMARY.md ✨ (NUEVO)
    ├── SCHEDULED_MATCHES_IMPLEMENTATION.md ✏️ (MODIFICADO)
    ├── SETUP_SCHEDULED_MATCHES.md ✨ (NUEVO)
    └── SETUP_QUICK_START.md ✨ (NUEVO)
```

---

## DEPENDENCIAS

### Backend
```json
{
  "googleapis": "^118.0.0"  // Google Calendar API client
}
```

### Frontend
```
- Existing: react, react-router, date-fns, zod
- No necesita nuevas dependencias
```

---

## MODELOS DE DATOS

### Match (Extendido)
```
{
  id: String
  groupId: String
  player1Id: String
  player2Id: String
  
  // NUEVOS CAMPOS
  scheduledDate: DateTime?     // Fecha programa
  location: String?            // Lugar
  googleEventId: String?       // ID evento Google
  googleCalendarSyncStatus: enum  // Estado sync
  isScheduled: Boolean         // Flag
  
  // CAMPOS EXISTENTES
  date: DateTime
  gamesP1: Int? (ahora nullable)
  gamesP2: Int? (ahora nullable)
  winnerId: String?
  matchStatus: MatchStatus
}
```

### GoogleCalendarIntegration (NUEVO)
```
{
  id: String
  userId: String (UNIQUE)
  user: User (relación)
  accessToken: String
  refreshToken: String
  expiresAt: DateTime
  calendarId: String
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

## ENDPOINTS API

### Autenticación
```
GET  /auth/google-calendar/auth-url
     → { authUrl: string }

POST /auth/google-calendar/callback
     ← { code: string }
     → { success: boolean, message: string }

GET  /auth/google-calendar/status
     → { connected: boolean, integration: {...} }

POST /auth/google-calendar/disconnect
     → { success: boolean, message: string }
```

### Matches
```
GET  /matches?groupId=xxx&scheduled=true
     → Match[]

POST /matches
     ← { groupId, player1Id, player2Id, scheduledDate, location }
     → Match

PUT  /matches/:id
     ← { scheduledDate?, location?, gamesP1?, gamesP2? }
     → Match

DELETE /matches/:id
     → { success: boolean }
```

---

## PERMISIONES

```
┌────────────┬────────────────────────────────────────┐
│ Acción     │ Quien puede hacerlo                    │
├────────────┼────────────────────────────────────────┤
│ Programar  │ Cualquier jugador del grupo            │
│ Ver        │ Todos los jugadores del grupo          │
│ Editar     │ Los 2 jugadores del partido + admin    │
│ Cancelar   │ Los 2 jugadores del partido + admin    │
│ Conectar G │ El usuario autenticado                 │
└────────────┴────────────────────────────────────────┘
```

---

## SEGURIDAD

```
┌──────────────────────────────────────────────────────┐
│ Nivel 1: Autenticación                               │
│ - JWT token en cada request                         │
│ - Validación de token en middelware                 │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ Nivel 2: Autorización                                │
│ - Verificación de roles (admin/player)              │
│ - Verificación de pertenencia (¿es jugador?)        │
│ - Verificación de grupo (¿grupo activo?)            │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ Nivel 3: Validación de Datos                         │
│ - Zod schema validation                             │
│ - Verificación de jugadores en grupo                │
│ - Verificación de partidos únicos                   │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ Nivel 4: Credenciales Google                         │
│ - Tokens en BD encriptados                          │
│ - Refrescamiento automático de tokens               │
│ - Best effort en eliminación                        │
└──────────────────────────────────────────────────────┘
```

---

**¡Arquitectura completa y lista para producción! 🚀**
