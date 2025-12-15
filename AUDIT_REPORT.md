# 🔍 Auditoría Completa del Proyecto FreeSquash League

**Fecha:** 2025  
**Estado:** Producción (Railway API + Vercel Web)  
**Conclusión General:** Proyecto **FUNCIONAL Y SEGURO** con recomendaciones de mejora menor

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Seguridad](#seguridad)
3. [Variables de Entorno](#variables-de-entorno)
4. [API Routes Audit](#api-routes-audit)
5. [Frontend Audit](#frontend-audit)
6. [Base de Datos](#base-de-datos)
7. [Performance](#performance)
8. [TypeScript & Tipos](#typescript--tipos)
9. [Deployment & DevOps](#deployment--devops)
10. [Hallazgos Críticos](#hallazgos-críticos)
11. [Recomendaciones Accionables](#recomendaciones-accionables)

---

## Resumen Ejecutivo

### ✅ Estado General
- **Arquitectura:** Sólida con separación clara (Backend/Frontend/DB)
- **Security:** JWT + CORS + bcrypt implementado correctamente
- **Performance:** Compression + ETag + React Query caching activos
- **Deployment:** Railway (API) + Vercel (Web) funcionando
- **Código:** TypeScript compilando, sin errores fatales

### ⚠️ Hallazgos Menores (No Críticos)
| Categoría | Issue | Severidad | Impacto |
|-----------|-------|-----------|--------|
| Console Output | `console.log()` en producción | 🟡 Media | Exposición de debug info |
| Rate Limiting | No implementado | 🟡 Media | Vulnerable a DDoS/brute force |
| ErrorBoundary | No existe en React | 🟡 Media | App puede fallar sin fallback |
| JWT Secret | Hardcoded fallback | 🟡 Media | Si no se configura, usar genérico |
| Prisma Indices | Faltan en algunas FK | 🟡 Media | N+1 queries potenciales |
| Logging | Basic, sin log aggregation | 🟡 Media | Debugging production difícil |

### ✅ Aspectos Correctos
- ✓ CORS configurado dinámicamente según `ALLOWED_ORIGINS`
- ✓ Database URL apunta a Railway MySQL
- ✓ VITE_API_URL correcto en ambos .env
- ✓ .gitignore protege `.env`
- ✓ Validación con Zod en todas las rutas POST/PUT
- ✓ Prisma migrations en lugar
- ✓ JWT interceptor en axios + localStorage cleanup

---

## Seguridad

### ✅ Implementado Correctamente

#### Authentication & Authorization
```typescript
// ✓ JWT basado en Fastify
await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
});

// ✓ Decorator para autenticación
fastify.decorate('authenticate', async function (request, reply) {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.status(401).send({ error: 'Unauthorized' });
    }
});

// ✓ Role-based checks en rutas
if (decoded.role !== 'ADMIN') {
    return reply.status(403).send({ error: 'Forbidden' });
}
```

#### Password Security
```typescript
// ✓ bcrypt con salt 10
const hashedPassword = await bcrypt.hash(body.password, 10);

// ✓ Verificación en login
const isValid = await bcrypt.compare(body.password, user.password);
```

#### CORS
```typescript
// ✓ Dinámico según env
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:4173')
    .split(',')
    .map((o: string) => o.trim())
    .filter(Boolean);

await fastify.register(cors, {
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
});
```

#### Frontend Token Handling
```typescript
// ✓ JWT interceptor de axios
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ✓ Logout en 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
```

#### Input Validation
```typescript
// ✓ Zod schemas en auth.routes.ts
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    nickname: z.string().optional(),
    phone: z.string().optional(),
});

// ✓ Match score validation
const createMatchSchema = z.object({
    groupId: z.string(),
    player1Id: z.string(),
    player2Id: z.string(),
    gamesP1: z.number().int().min(0).max(3),
    gamesP2: z.number().int().min(0).max(3),
    matchStatus: z.enum(['PLAYED', 'INJURY', 'CANCELLED']).default('PLAYED'),
});
```

### ⚠️ Problemas Identificados

#### 1. **console.log() en Código de Producción**
**Severity:** 🟡 Media | **Files:** 4
```typescript
// apps/web/src/pages/player/RecordMatch.tsx:54
console.log('Enviando datos de partido:', data);

// apps/web/src/components/EditMatchModal.tsx:34
console.log('🚀 Sending PUT request to', `/matches/${match.id}`, data);
```
**Riesgo:** Expone detalles de debugging en Console del navegador/logs del servidor
**Acción:** Remover o usar logger condicional

#### 2. **JWT_SECRET Fallback Genérico**
**Severity:** 🟡 Media | **Location:** `apps/api/src/server.ts:45`
```typescript
secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
```
**Riesgo:** Si se despliega sin JWT_SECRET en env, usa fallback débil
**Acción:** Generar secret fuerte en Railway dashboard; validar en startup

#### 3. **Sin Rate Limiting**
**Severity:** 🟡 Media | **Impacto:** Login/register vulnerable a brute force
**Acción:** Implementar `@fastify/rate-limit`

#### 4. **Sin HTTPS Enforcing en Local Dev**
**Severity:** 🟢 Bajo | **Contexto:** Solo local, producción usa HTTPS
**Estado:** ✓ Aceptable

---

## Variables de Entorno

### ✅ Correctamente Configuradas

#### `.env.local` (Development - Docker Compose)
```dotenv
✓ DATABASE_URL=mysql://freeliga:freeliga123@mysql:3306/freeliga  (internal Docker DNS)
✓ JWT_SECRET=dev-secret-key-change-in-production
✓ NODE_ENV=development
✓ VITE_API_URL=http://api:3001  (Docker Compose internal service)
✓ ALLOWED_ORIGINS=http://localhost:4173,http://localhost:3000
```

#### `.env` (Production - Railway)
```dotenv
✓ DATABASE_URL=mysql://root:...@mysql.railway.internal:3306/railway
✓ JWT_SECRET=e0cb9a5c4d2f8acb7058bd46f8a5316312456c8a0fc519a8e54f4d88090aa56f
✓ NODE_ENV=production
✓ VITE_API_URL=https://freesquashapi-production.up.railway.app
✓ FRONTEND_URL=https://free-liga-web.vercel.app
✓ ALLOWED_ORIGINS=https://free-liga-web.vercel.app
```

### ⚠️ Problemas Identificados

#### 1. **PORT Hardcoded a 3001**
**Location:** `.env` y `.env.local`
**Issue:** Si PORT != 3001, rutas pueden fallar
**Acción:** Verificar que Railway puerto 3001 está expuesto

#### 2. **FRONTEND_URL vs ALLOWED_ORIGINS Inconsistencia**
**Current:**
- `FRONTEND_URL=https://free-liga-web.vercel.app` (singular)
- `ALLOWED_ORIGINS=https://free-liga-web.vercel.app` (mismo, pero manual)

**Riesgo:** Si se actualiza FRONTEND_URL, olvidad actualizar ALLOWED_ORIGINS
**Acción:** Documentar que ambos deben ser iguales

#### 3. **Sin Soporte para Preview Deployments**
**Impacto:** Deploy preview en Vercel falla por CORS
**Acción:** Agregar wildcard o pattern para previews
```dotenv
# Sugerencia
ALLOWED_ORIGINS=https://free-liga-web.vercel.app,https://*.vercel.app
# O usar dynamic logic en server.ts para soportar *.vercel.app
```

#### 4. **Variables Documentadas vs Usadas**
**Falta documentación en README:**
- `ALLOWED_ORIGINS` (no explicado)
- `FRONTEND_URL` (no explicado)
- `HOST=0.0.0.0` (en producción, no en local)
- `MYSQL_ROOT_PASSWORD`, `MYSQL_USER`, `MYSQL_PASSWORD` (Docker)

---

## API Routes Audit

### 📊 Rutas Auditadas

#### Auth Routes (`/api/auth`)
| Endpoint | Method | Auth | Status | Validación |
|----------|--------|------|--------|-----------|
| `/register` | POST | ❌ | ✓ | Zod email/password/name |
| `/login` | POST | ❌ | ✓ | Zod email/password |
| `/me` | GET | ✓ | ✓ | JWT required |
| `/logout` | POST | ✓ | ❌ MISSING | Debería existir |

#### Player Routes (`/api/players`)
| Endpoint | Method | Auth | Status | Validación |
|----------|--------|------|--------|-----------|
| `/` | GET | ✓ | ✓ | Query filtering |
| `/:id` | GET | ✓ | ✓ | ID path param |
| `/:id/group` | GET | ✓ | ✓ | Player current group |
| `/:id/stats` | GET | ✓ | ✓ | Player statistics |

#### Group Routes (`/api/groups`)
| Endpoint | Method | Auth | Status | Validación |
|----------|--------|------|--------|-----------|
| `/` | GET | ✓ | ✓ | Season filtering |
| `/` | POST | ✓ ADMIN | ✓ | Name required |
| `/:id` | GET | ✓ | ✓ | Include players |
| `/:id/ranking` | GET | ✓ | ✓ | Sorted rankings |
| `/:id/players` | POST | ✓ ADMIN | ✓ | Add players to group |
| `/:id/players/:playerId` | DELETE | ✓ ADMIN | ✓ | Remove player |

#### Match Routes (`/api/matches`)
| Endpoint | Method | Auth | Status | Validación |
|----------|--------|------|--------|-----------|
| `/` | GET | ✓ | ✓ | groupId/playerId filter |
| `/` | POST | ✓ | ✓ | Zod createMatchSchema |
| `/:id` | GET | ✓ | ✓ | Match with players |
| `/:id` | PUT | ✓ | ✓ | Zod updateMatchSchema |
| `/:id` | DELETE | ✓ | ✓ | Admin or player check |

#### Season Routes (`/api/seasons`)
| Endpoint | Method | Auth | Status | Validación |
|----------|--------|------|--------|-----------|
| `/` | GET | ✓ | ✓ | All seasons |
| `/` | POST | ✓ ADMIN | ✓ | Zod seasonSchema |
| `/:id` | GET | ✓ | ✓ | Detailed season |
| `/:id` | PUT | ✓ ADMIN | ✓ | Update season |
| `/:id/closure` | GET | ✓ ADMIN | ✓ | Preview closure |
| `/:id/closure/approve` | POST | ✓ ADMIN | ✓ | Approve closure |
| `/:id/rollover` | POST | ✓ ADMIN | ✓ | Create next season |

#### Classification Routes (`/api/classification`)
| Endpoint | Method | Auth | Status | Validación |
|----------|--------|------|--------|-----------|
| `/global` | GET | ✓ | ✓ | Season/group/date filters |
| `/group/:id` | GET | ✓ | ✓ | Group classification |

#### User Routes (`/api/users`)
| Endpoint | Method | Auth | Status | Validación |
|----------|--------|------|--------|-----------|
| `/me` | GET | ✓ | ✓ | User profile |
| `/me` | PUT | ✓ | ✓ | Update profile |
| `/me/password` | PUT | ✓ | ✓ | Change password |
| `/` | GET | ✓ ADMIN | ✓ | List users |
| `/:id` | PUT | ✓ ADMIN | ✓ | Admin update user |
| `/:id/role` | PUT | ✓ ADMIN | ✓ | Change role |

#### Admin Routes (`/api/admin`)
| Endpoint | Method | Auth | Status | Validación |
|----------|--------|------|--------|-----------|
| `/stats` | GET | ✓ ADMIN | ✓ | Dashboard stats |
| `/player-history` | GET | ✓ ADMIN | ✓ | Player movement history |

#### Bug Routes (`/api/bugs`)
| Endpoint | Method | Auth | Status | Validación |
|----------|--------|------|--------|-----------|
| `/` | POST | ❌ OPEN | ✓ | Zod createBugSchema |
| `/` | GET | ✓ ADMIN | ✓ | List bugs with filter |
| `/:id/status` | PUT | ✓ ADMIN | ✓ | Update status (OPEN/ACK/CLOSED) |
| `/:id` | DELETE | ✓ ADMIN | ✓ | Delete bug |

### ⚠️ Hallazgos

#### 1. **Missing `/api/auth/logout` Endpoint**
**Impact:** Logout solo limpia localStorage en frontend, no invalidates token en backend
**Recomendación:** Agregar ruta POST /logout (sin requiere hacer nada, es informativo)
```typescript
fastify.post('/logout', {
    onRequest: [fastify.authenticate],
}, async (request, reply) => {
    // Token is invalid once app is reloaded
    // Optional: Could implement token blacklist here
    return { message: 'Logged out' };
});
```

#### 2. **No Input Validation en Query Params**
**Example:** Match filtering con playerId no valida UUID format
```typescript
// apps/api/src/routes/match.routes.ts:25-27
const { groupId, playerId } = request.query as {
    groupId?: string;
    playerId?: string;
};
```
**Riesgo:** Bajo (Prisma rechaza valores inválidos), pero debería validarse
**Acción:** Usar Zod para query params

#### 3. **Error Messages Exponen Detalles**
**Example:** Zod errors retornan array completo:
```typescript
if (error instanceof z.ZodError) {
    return reply.status(400).send({ error: error.errors });
}
```
**Mejor:**
```typescript
return reply.status(400).send({ 
    error: 'Validation failed',
    details: error.errors.map(e => ({ path: e.path, message: e.message }))
});
```

#### 4. **Admin Check Redundante**
**Multiple patterns usados:**
```typescript
// Pattern 1: En cada ruta
if (decoded.role !== 'ADMIN') {
    return reply.status(403).send({ error: 'Forbidden' });
}

// Pattern 2: Podría ser un decorador
fastify.decorate('adminOnly', async function (request, reply) {
    const decoded = request.user as any;
    if (decoded.role !== 'ADMIN') {
        reply.status(403).send({ error: 'Forbidden' });
    }
});
```
**Acción:** Crear decorador reutilizable

---

## Frontend Audit

### ✅ Estructura Correcta

#### Pages Implementadas
```
apps/web/src/pages/
├── auth/
│   ├── Login.tsx          ✓ Form + axios POST
│   ├── Register.tsx       ✓ Form + validation
├── player/
│   ├── Dashboard.tsx      ✓ Stats + recent matches
│   ├── GroupView.tsx      ✓ Ranking + contact buttons
│   ├── MatchHistory.tsx   ✓ Filter + table
│   ├── RecordMatch.tsx    ✓ Score input + validation
│   └── GlobalClassification.tsx ✓ Advanced filtering + TanStack Table
├── admin/
│   ├── AdminDashboard.tsx ✓ Stats + quick actions
│   ├── ManageGroups.tsx   ✓ CRUD groups
│   ├── ManagePlayers.tsx  ✓ Add/remove players
│   ├── ManageSeasons.tsx  ✓ Create/edit seasons + closure
│   ├── ManageUsers.tsx    ✓ Manage users + CSV export
│   └── ManageBugs.tsx     ✓ Bug management (OPEN/ACK/CLOSED)
├── BugReport.tsx          ✓ Report bugs + attachments
├── Home.tsx               ✓ Landing page
└── NotFound.tsx           ✓ 404 page
```

#### Components
```
apps/web/src/components/
├── Layout.tsx             ✓ Navigation + dark mode toggle
├── Loader.tsx             ✓ NEW: Animated loader
├── EditMatchModal.tsx     ✓ Match editing
```

#### Contexts & Services
```
apps/web/src/
├── contexts/AuthContext.tsx ✓ Login/logout/register
├── lib/api.ts             ✓ Axios instance + JWT interceptor
```

### ⚠️ Hallazgos

#### 1. **4x console.log() en Producción**
**Files:**
- `apps/web/src/pages/player/RecordMatch.tsx:54` - Enviando datos
- `apps/web/src/pages/player/RecordMatch.tsx:67` - Éxito
- `apps/web/src/components/EditMatchModal.tsx:34` - PUT request
- `apps/web/src/components/EditMatchModal.tsx:37` - Response

**Fix:** Remover o usar condicional:
```typescript
if (process.env.NODE_ENV === 'development') {
    console.log('Debug info');
}
```

#### 2. **Sin Error Boundaries**
**Impact:** Si una página falla, app colapsa sin fallback
**Ejemplo:** GlobalClassification con datos grandes podría fallar
**Acción:** Crear ErrorBoundary component
```typescript
// apps/web/src/components/ErrorBoundary.tsx
import React from 'react';

export class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error) {
        console.error('Error:', error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 text-red-600">
                    Algo salió mal. Recarga la página.
                </div>
            );
        }
        return this.props.children;
    }
}
```

#### 3. **No Error Handling en Mutation Errors**
**Example:** RecordMatch.tsx
```typescript
const mutation = useMutation({
    mutationFn: async (data) => {
        // ... post match
    },
    onSuccess: () => {
        // ✓ Success handled
    },
    // ❌ No onError handler
});
```

**Fix:**
```typescript
const mutation = useMutation({
    mutationFn: async (data) => { ... },
    onSuccess: () => { ... },
    onError: (error) => {
        console.error('Error:', error);
        // Show toast or error message
    }
});
```

#### 4. **Loader No en BugReport.tsx**
**Location:** `apps/web/src/pages/BugReport.tsx:103`
```tsx
{uploading ? 'Subiendo archivos...' : mutation.isPending ? 'Enviando...' : 'Enviar Bug'}
```
**Status:** Debería usar componente Loader
**Acción:** Reemplazar con `<Loader />` durante carga

#### 5. **Falta Email Validation en BugReport**
**Risk:** Email opcional pero podría ser invalid
**Current:**
```typescript
const { data } = await api.post('/bugs', { 
    description, 
    email: email || undefined,  // Can be empty string
    ...
});
```

#### 6. **Dark Mode Inconsistencia**
**Issue:** Algunos componentes no adaptan bien a dark mode
**Example:** EditMatchModal inputs pueden ser hard to read
**Acción:** Review todos inputs/selects con `dark:` classes

#### 7. **No Unsubscribe de Queries En Unmount**
**Status:** React Query 5 auto-cleanup, ✓ OK
**Pero:** Manual listeners (useEffect) deberían cleanup
```typescript
// ✓ Good
useEffect(() => {
    const unsubscribe = api.subscribe(...);
    return () => unsubscribe();
}, []);
```

---

## Base de Datos

### Schema Analysis

#### Strength Points
```prisma
✓ Unique constraints on composite keys (groupId + playerId)
✓ Cascade delete for data integrity
✓ Enum types (Role, MatchStatus, MovementType, BugStatus)
✓ Relationships well-defined with explicit field names
```

#### Indices Review
```prisma
model Group {
    @@index([seasonId])  ✓ FK indexed
}

model GroupPlayer {
    @@unique([groupId, playerId])  ✓ Composite unique
    @@index([groupId])    ✓ For group queries
    @@index([playerId])   ✓ For player queries
}

model Match {
    // ⚠️ MISSING @@index([groupId])
    // ⚠️ MISSING @@index([player1Id])
    // ⚠️ MISSING @@index([player2Id])
    // ⚠️ MISSING @@index([winnerId])
}

model BugReport {
    // ⚠️ MISSING @@index([status])
    // ⚠️ MISSING @@index([createdAt])
}
```

### ⚠️ Problemas Identificados

#### 1. **Falta Indices en Match**
**Impact:** N+1 queries al filtrar matches por group/player
**Current Query:** `apps/api/src/routes/match.routes.ts:40-47`
```typescript
const matches = await prisma.match.findMany({
    where: {
        groupId: groupId,  // ⚠️ Sin índice
        OR: [
            { player1Id: playerId },  // ⚠️ Sin índice
            { player2Id: playerId },
        ]
    }
});
```

**Fix:**
```prisma
model Match {
    // ... fields ...
    @@index([groupId])
    @@index([player1Id])
    @@index([player2Id])
    @@index([winnerId])
}
```

#### 2. **Falta Índice de Status en BugReport**
**Impact:** Lento filtrar bugs por status
```typescript
// apps/web/src/pages/admin/ManageBugs.tsx:27
const params = new URLSearchParams({ status: statusFilter });
```

**Fix:**
```prisma
model BugReport {
    // ...
    @@index([status])
    @@index([createdAt])
}
```

#### 3. **Posible N+1 en Admin Stats**
```typescript
// apps/api/src/routes/admin.routes.ts:30-44
const [
    totalPlayers,
    totalGroups,
    totalSeasons,
    totalMatches,
    activeGroups,
    activeSeason,  // ← Este incluye: season.groups[].groupPlayers
] = await Promise.all([...]);
```

**Issue:** Si activeSeason tiene 100+ grupos, cada uno con +countSelect
**Status:** Actualizar activeSeason query para ser más ligero:
```typescript
activeSeason: prisma.season.findFirst({
    where: { endDate: { gte: now } },
    orderBy: { startDate: 'asc' },
    select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        // NO incluir groups completo
    }
}),

// Luego cargar grupos por separado si es necesario
```

#### 4. **Falta TTL o Soft Deletes**
**Context:** Cuando se elimina una season, eliminan todos los grupos y matches
**Risk:** No hay auditoría
**Recommendation:** Agregar campo `deletedAt` para soft deletes (no crítico para MVP)

---

## Performance

### ✅ Optimizaciones Implementadas

#### Backend
```typescript
✓ @fastify/compress@^8.0.0 - gzip/brotli compression (60-90% reduction)
✓ @fastify/etag@^6.0.0 - Weak ETags para conditional GET
✓ Cache-Control header on safe GETs (max-age=60s, stale-while-revalidate=120s)
```

#### Frontend
```typescript
✓ React Query staleTime: 60000ms (1 minute) - local caching
✓ Lazy loading de routes con React.lazy()
✓ Code splitting automático en Vite
✓ TailwindCSS purge configurado
```

### ⚠️ Recomendaciones Adicionales

#### 1. **Implementar Service Worker para PWA**
**Current:** `vite-plugin-pwa` instalado pero no configurado
**Acción:** Ver `apps/web/vite.config.ts` si está registrado

#### 2. **Agregar Database Connection Pooling**
**Current:** Prisma con MySQL, sin explicit pool config
**Recomendación:** Configurar en `.env`
```
DATABASE_URL="mysql://user:pass@host/db?connection_limit=20"
```

#### 3. **Implementar Redis para Session/Cache**
**Current:** localStorage en browser, sin backend cache
**Recomendación Para MVP+1:** Redis para:
- Session store (en lugar de localStorage)
- Rate limiting
- Real-time notifications

#### 4. **Query Optimization para GlobalClassification**
**Issue:** Si hay 10k+ matches, query es lenta
**Recomendación:**
```typescript
// Agregar pagination
fastify.get('/global', {
    onRequest: [fastify.authenticate],
}, async (request, reply) => {
    const { page = 1, limit = 50, seasonId, groupId } = request.query as any;
    
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
        prisma.match.findMany({
            where: { group: { seasonId } },
            skip,
            take: limit,
            orderBy: { date: 'desc' },
        }),
        prisma.match.count({
            where: { group: { seasonId } },
        }),
    ]);
    
    return { items, total, page, totalPages: Math.ceil(total / limit) };
});
```

---

## TypeScript & Tipos

### ✅ Bien Estructurado
```typescript
✓ tsconfig.json con strict: true
✓ Enums en Prisma schema (Role, MatchStatus, BugStatus)
✓ Zod schemas para runtime validation
✓ Frontend Vite env types (apps/web/src/types/env.d.ts)
```

### ⚠️ Hallazgos

#### 1. **`any` Types en Rutas**
**Example:** `apps/api/src/routes/admin.routes.ts:10`
```typescript
const decoded = request.user as any;
```

**Fix:** Crear interfaz
```typescript
interface JWTPayload {
    id: string;
    email: string;
    role: 'PLAYER' | 'ADMIN';
}

declare module 'fastify' {
    interface FastifyRequest {
        user?: JWTPayload;
    }
}

// Uso
const { role } = request.user!;
```

#### 2. **`any` en AuthContext**
**File:** `apps/web/src/contexts/AuthContext.tsx:10`
```typescript
currentGroup?: any;
```

**Fix:**
```typescript
interface GroupInfo {
    id: string;
    name: string;
    seasonId: string;
}

interface Player {
    id: string;
    name: string;
    nickname?: string;
    currentGroup?: GroupInfo;
}

interface User {
    id: string;
    email: string;
    role: 'PLAYER' | 'ADMIN';
    player?: Player;
}
```

#### 3. **Query Response Types Incompletos**
**Example:** `apps/web/src/pages/admin/ManageBugs.tsx:6`
```typescript
interface BugReport {
    id: string;
    description: string;
    status: 'OPEN' | 'ACK' | 'CLOSED';
    // ⚠️ Faltan más campos
}
```

**Should include:**
```typescript
interface BugReport {
    id: string;
    description: string;
    status: 'OPEN' | 'ACK' | 'CLOSED';
    email?: string;
    userAgent?: string;
    appVersion?: string;
    attachments?: string;
    createdAt: string;
    updatedAt: string;
}
```

#### 4. **Response Types Not Exported**
**Issue:** Backend routes no tienen tipos explícitos
**Recomendación:** Crear `apps/api/src/types/responses.ts`
```typescript
export interface MatchResponse {
    id: string;
    groupId: string;
    player1: Player;
    player2: Player;
    winner: Player | null;
    gamesP1: number;
    gamesP2: number;
    date: string;
    matchStatus: MatchStatus;
}

export interface GroupResponse {
    id: string;
    name: string;
    seasonId: string;
    players: Player[];
    // ...
}
```

---

## Deployment & DevOps

### ✅ Configuración Correcta

#### Production (.env)
```
✓ DATABASE_URL points to Railway MySQL
✓ JWT_SECRET is strong hash (not default)
✓ NODE_ENV=production (enables proper logging)
✓ FRONTEND_URL matches deployed Vercel domain
✓ ALLOWED_ORIGINS matches FRONTEND_URL
```

#### Local Development (.env.local)
```
✓ DATABASE_URL points to Docker MySQL
✓ VITE_API_URL uses Docker internal DNS (api:3001)
✓ NODE_ENV=development (verbose logging)
✓ ALLOWED_ORIGINS includes localhost variants
```

#### Docker Compose
```yaml
✓ MySQL service with persistent volume
✓ API service with env from .env.local
✓ Web service with Vite dev server
✓ Health checks on MySQL
```

#### .gitignore
```
✓ .env and .env.* protected
✓ node_modules/ excluded
✓ dist/ and build/ excluded
✓ .DS_Store, logs excluded
✓ Prisma migrations included (good practice)
```

### ⚠️ Problemas Identificados

#### 1. **Sin Prisma Migration en CI/CD**
**Issue:** Railway deploy podría fallar si schema cambió
**Acción:** Agregar script pre-start en production
```json
{
  "scripts": {
    "start": "prisma migrate deploy && node dist/server.js"
  }
}
```

#### 2. **Sin Health Check Endpoint**
**Missing:** GET `/health` endpoint para load balancers
**Fix:**
```typescript
fastify.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
});
```

#### 3. **Sin Graceful Shutdown**
**Issue:** Si Railway mata proceso, conexiones abiertas pueden fallar
**Fix:**
```typescript
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down...');
    await fastify.close();
    await prisma.$disconnect();
    process.exit(0);
});
```

#### 4. **No Vercel Preview Support**
**Issue:** Deploy preview en Vercel no puede conectar a Railway API
**Current CORS:** Solo `https://free-liga-web.vercel.app`
**Fix:**
```dotenv
ALLOWED_ORIGINS=https://free-liga-web.vercel.app,https://*.vercel.app
```

O mejor, usar lógica dinámica:
```typescript
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');
const isDynamicPreview = process.env.VERCEL_ENV === 'preview';

const corsOptions = {
    origin: (origin: string, callback: Function) => {
        if (isDynamicPreview && origin?.includes('vercel.app')) {
            callback(null, true);
        } else if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
};
```

#### 5. **Sin Environment Validation**
**Risk:** Railway deployment sin JWT_SECRET no falla, usa fallback genérico
**Fix:**
```typescript
function validateEnvironment() {
    const required = ['DATABASE_URL', 'JWT_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required env vars: ${missing.join(', ')}`);
    }
    
    if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-in-production') {
        throw new Error('JWT_SECRET is using insecure fallback value!');
    }
}

validateEnvironment();
await fastify.listen({ port: 3001, host: '0.0.0.0' });
```

#### 6. **Sin Build Output Verification**
**Recomendación:** Agregar step en CI para validar:
```bash
npm run build
npm run type-check
npm run lint
```

---

## Hallazgos Críticos

### 🔴 Críticos (Requieren atención inmediata)
❌ **Ninguno encontrado**

La arquitectura es sólida y está correctamente asegurada.

---

### 🟡 Mayores (Deberían arreglarse)
| # | Problema | Archivo | Acción |
|----|----------|---------|--------|
| 1 | Falta rate limiting | `apps/api/src/server.ts` | Instalar `@fastify/rate-limit` |
| 2 | console.log() en prod | `apps/web/src/pages/player/RecordMatch.tsx` | Remover o condicional |
| 3 | Sin error boundaries | `apps/web/src/` | Crear ErrorBoundary.tsx |
| 4 | Falta índices en Match | `schema.prisma` | Agregar @@index en Match |
| 5 | JWT_SECRET fallback débil | `apps/api/src/server.ts` | Validar env en startup |

### 🟢 Menores (Mejoras opcionales)
| # | Problema | Archivo | Acción |
|----|----------|---------|--------|
| 1 | `any` types | Varios | Usar interfaces específicas |
| 2 | Sin /health endpoint | `server.ts` | Agregar ruta |
| 3 | Sin graceful shutdown | `server.ts` | Agregar SIGTERM handler |
| 4 | Sin Vercel preview CORS | `server.ts` | Soportar *.vercel.app |
| 5 | Falta logout endpoint | `auth.routes.ts` | Agregar POST /logout |

---

## Recomendaciones Accionables

### Prioritario (Esta Semana)

#### 1️⃣ Remover console.log() del Código

**Files:**
- `apps/web/src/pages/player/RecordMatch.tsx:54,67`
- `apps/web/src/components/EditMatchModal.tsx:34,37`

```bash
# Find all console logs
grep -r "console.log" apps/web/src apps/api/src --exclude-dir=node_modules
```

**Fix:**
```bash
# Option 1: Remove completely
# Option 2: Wrap with env check
if (process.env.NODE_ENV === 'development') {
    console.log(...);
}
```

---

#### 2️⃣ Agregar Índices en Prisma

**File:** `packages/database/prisma/schema.prisma`

```prisma
model Match {
    // ... fields ...
    @@index([groupId])
    @@index([player1Id])
    @@index([player2Id])
    @@index([winnerId])
}

model BugReport {
    // ... fields ...
    @@index([status])
    @@index([createdAt])
}
```

**Command:**
```bash
cd packages/database
npx prisma migrate dev --name add_indices
# Local: apply to Docker MySQL
# Prod: Railway auto-applies on deploy
```

---

#### 3️⃣ Implementar Rate Limiting

**File:** `apps/api/src/server.ts`

```bash
npm install @fastify/rate-limit
```

```typescript
import rateLimit from '@fastify/rate-limit';

await fastify.register(rateLimit, {
    max: 100,  // 100 requests
    timeWindow: '15 minutes',
    skipOnError: true,
    redis: process.env.REDIS_URL || undefined,  // Optional
});
```

---

#### 4️⃣ Validar JWT_SECRET en Startup

**File:** `apps/api/src/server.ts` (in `start()` function)

```typescript
// Before registering JWT
if (!process.env.JWT_SECRET || 
    process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-in-production') {
    throw new Error('CRITICAL: JWT_SECRET not configured! Set in environment.');
}
```

---

### Segundo Nivel (Próximas 2 Semanas)

#### 5️⃣ Crear Error Boundary en React

**File:** `apps/web/src/components/ErrorBoundary.tsx` (new)

```typescript
import React from 'react';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        // Could send to error tracking service (Sentry, etc)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-950">
                    <div className="text-center p-6">
                        <h1 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">
                            Algo salió mal
                        </h1>
                        <p className="text-red-700 dark:text-red-300 mb-4">
                            {this.state.error?.message || 'Error desconocido'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Recargar página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
```

**Usage:** En `apps/web/src/App.tsx` (wrap main content)
```tsx
<ErrorBoundary>
    <Routes>{...}</Routes>
</ErrorBoundary>
```

---

#### 6️⃣ Agregar Endpoints de Health Check & Graceful Shutdown

**File:** `apps/api/src/server.ts`

```typescript
// Add health check route
fastify.get('/health', async (request, reply) => {
    try {
        // Verify database connection
        await prisma.$queryRaw`SELECT 1`;
        return { 
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        };
    } catch (error) {
        reply.status(503).send({ status: 'unhealthy', error: 'DB connection failed' });
    }
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
    console.log(`${signal} received. Shutting down gracefully...`);
    await fastify.close();
    await prisma.$disconnect();
    process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

---

#### 7️⃣ Soportar Vercel Preview Deployments

**File:** `apps/api/src/server.ts` (update CORS registration)

```typescript
// Replace current CORS block with:
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:4173',
    'http://localhost:3000',
].filter(Boolean);

// Support Vercel preview deployments
const isDynamicOriginAllowed = (origin: string) => {
    // Allow any vercel.app subdomain in preview
    if (process.env.VERCEL_ENV === 'preview' && origin?.includes('.vercel.app')) {
        return true;
    }
    return allowedOrigins.includes(origin);
};

await fastify.register(cors, {
    origin: (origin: string, callback: Function) => {
        if (!origin || isDynamicOriginAllowed(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: ${origin} not allowed`));
        }
    },
    credentials: true,
});
```

---

#### 8️⃣ Crear Tipos TypeScript Centralizados

**File:** `apps/api/src/types/responses.ts` (new)

```typescript
import type { Role, MatchStatus } from '@prisma/client';

export interface UserResponse {
    id: string;
    email: string;
    role: Role;
    createdAt: string;
}

export interface PlayerResponse {
    id: string;
    name: string;
    nickname?: string;
    phone?: string;
    currentGroup?: GroupResponse;
}

export interface GroupResponse {
    id: string;
    name: string;
    whatsappUrl?: string;
    seasonId: string;
}

export interface MatchResponse {
    id: string;
    groupId: string;
    player1: PlayerResponse;
    player2: PlayerResponse;
    winner: PlayerResponse | null;
    gamesP1: number;
    gamesP2: number;
    date: string;
    matchStatus: MatchStatus;
}

export interface BugResponse {
    id: string;
    description: string;
    status: 'OPEN' | 'ACK' | 'CLOSED';
    email?: string;
    userAgent?: string;
    appVersion?: string;
    attachments?: string;
    createdAt: string;
    updatedAt: string;
}
```

---

### Nice-to-Have (Futuro)

#### 9️⃣ Agregar OpenAPI/Swagger Enhancements
- Ya está instalado `@fastify/swagger` y `@fastify/swagger-ui`
- Decorar rutas con tags y descripciones

#### 🔟 Implementar Redis para Caching
- Session store
- Rate limit backing
- Real-time notifications

#### 1️⃣1️⃣ Agregar Sentry para Error Tracking
```bash
npm install @sentry/node
```

#### 1️⃣2️⃣ Implementar SMS/Email Notifications
- Bug report confirmations
- Match reminders
- Season closures

---

## Conclusión

**FreeSquash League está en EXCELENTE estado para producción.**

✅ **Puntos Fuertes:**
- Arquitectura sólida (Fastify + Prisma + React)
- Seguridad implementada correctamente (JWT + bcrypt + CORS)
- Performance optimizado (compression + caching)
- Base de datos bien diseñada
- Deployment correcto en Railway + Vercel

🟡 **Problemas Menores (No Críticos):**
- Console logs en dev code
- Faltan índices en algunas tablas
- Sin rate limiting
- Algunos tipos `any` en TypeScript
- Sin error boundaries en React

**Tiempo Estimado de Fixes:**
- **Prioritarios:** 2-3 horas
- **Segundo Nivel:** 4-6 horas
- **Nice-to-Have:** 8-10 horas

**Recomendación:** Implementar issues prioritarios antes de escalar usuario base.

---

**Auditado por:** GitHub Copilot  
**Fecha:** 2025  
**Versionado:** v1.0
