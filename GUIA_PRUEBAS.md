# 🧪 Guía Detallada de Pruebas - FreeSquash League

## Índice
1. [Configuración Inicial](#configuración-inicial)
2. [Pruebas Backend (API)](#pruebas-backend-api)
3. [Pruebas Frontend (UI)](#pruebas-frontend-ui)
4. [Escenarios de Prueba Completos](#escenarios-de-prueba-completos)
5. [Verificación del Algoritmo de Ranking](#verificación-del-algoritmo-de-ranking)
6. [Checklist de Funcionalidades](#checklist-de-funcionalidades)

---

## Configuración Inicial

### 1. Preparar el Entorno

```powershell
# Desde la raíz del proyecto (c:\xampp\htdocs\personal\FreeLiga)

# 1. Instalar dependencias
npm install

# 2. Configurar base de datos
cd packages/database
cp .env.example .env
# Edita .env y configura DATABASE_URL

# 3. Crear y aplicar migraciones
npm run migrate
npm run generate

# Volver a la raíz
cd ../..
```

### 2. Iniciar los Servidores

**Terminal 1 - Backend:**
```powershell
cd apps/api
npm run dev
```
✅ Debería mostrar: `Server listening on http://localhost:3000`

**Terminal 2 - Frontend:**
```powershell
cd apps/web
npm run dev
```
✅ Debería mostrar: `Local: http://localhost:5173/`

**Terminal 3 (Opcional) - Prisma Studio:**
```powershell
cd packages/database
npm run db:studio
```
✅ Abre en: `http://localhost:5555`

---

## Pruebas Backend (API)

### Herramientas Recomendadas

Use any of these tools to test the API:
- **Thunder Client** (VS Code Extension - Recomendado)
- **Postman**
- **cURL** (línea de comandos)
- **REST Client** (VS Code Extension)

### Base URL
```
http://localhost:3000
```

---

### 🔐 1. Autenticación

#### 1.1 Registro de Usuario (Administrador)

**Endpoint:** `POST /auth/register`

**Body (JSON):**
```json
{
  "email": "admin@freesquash.com",
  "password": "admin123",
  "name": "Admin Principal",
  "role": "ADMIN"
}
```

**Respuesta Esperada (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@freesquash.com",
    "role": "ADMIN",
    "player": {
      "id": "...",
      "name": "Admin Principal"
    }
  }
}
```

✅ **Guarda el token** para las siguientes peticiones

#### 1.2 Registro de Jugadores Adicionales

Crea al menos 8 jugadores para pruebas completas:

```json
// Jugador 1
{
  "email": "carlos@email.com",
  "password": "pass123",
  "name": "Carlos García",
  "nickname": "Carlitos",
  "phone": "656123456",
  "role": "PLAYER"
}

// Jugador 2
{
  "email": "maria@email.com",
  "password": "pass123",
  "name": "María López",
  "nickname": "Mari",
  "phone": "656234567",
  "role": "PLAYER"
}

// Jugador 3-8... (repite el patrón)
```

#### 1.3 Iniciar Sesión

**Endpoint:** `POST /auth/login`

**Body:**
```json
{
  "email": "admin@freesquash.com",
  "password": "admin123"
}
```

**Respuesta:** Token JWT

#### 1.4 Obtener Usuario Actual

**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer {TOKEN_AQUI}
```

**Respuesta:** Información del usuario autenticado

---

### 📅 2. Gestión de Temporadas

> **Importante**: Todas las peticiones siguientes requieren el header `Authorization: Bearer {TOKEN}`

#### 2.1 Crear Temporada

**Endpoint:** `POST /seasons` (Solo ADMIN)

**Body:**
```json
{
  "name": "Otoño 2024",
  "startDate": "2024-09-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.999Z"
}
```

**Respuesta Esperada (201):**
```json
{
  "id": "...",
  "name": "Otoño 2024",
  "startDate": "2024-09-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.999Z",
 "createdAt": "...",
  "updatedAt": "..."
}
```

✅ **Guarda el `id` de la temporada**

#### 2.2 Listar Temporadas

**Endpoint:** `GET /seasons`

**Respuesta:** Array de todas las temporadas

#### 2.3 Obtener Temporada por ID

**Endpoint:** `GET /seasons/:id`

**Respuesta:** Detalles de la temporada con grupos asociados

---

### 👥 3. Gestión de Grupos

#### 3.1 Crear Grupos

**Endpoint:** `POST /groups` (Solo ADMIN)

**Grupo A:**
```json
{
  "name": "Grupo A",
  "seasonId": "{SEASON_ID_AQUI}"
}
```

**Grupo B:**
```json
{
  "name": "Grupo B",
  "seasonId": "{SEASON_ID_AQUI}"
}
```

✅ **Guarda los `id` de los grupos**

#### 3.2 Asignar Jugadores a Grupos

**Endpoint:** `POST /groups/:groupId/players` (Solo ADMIN)

**Asignar 8 jugadores al Grupo A:**
```json
{
  "playerId": "{PLAYER_1_ID}"
}
```

Repite para los 8 jugadores (ajusta el `playerId` cada vez)

> **Tip**: Usa Prisma Studio para obtener los IDs de los jugadores fácilmente

#### 3.3 Ver Detalles del Grupo

**Endpoint:** `GET /groups/:groupId`

**Respuesta Esperada:**
```json
{
  "id": "...",
  "name": "Grupo A",
  "season": {
    "id": "...",
    "name": "Otoño 2024",
    "startDate": "...",
    "endDate": "..."
  },
  "groupPlayers": [
    {
      "id": "...",
      "rankingPosition": 1,
      "player": {
        "id": "...",
        "name": "Carlos García",
        "nickname": "Carlitos",
        "phone": "656123456"
      }
    }
    // ... más jugadores
  ],
  "matches": []
}
```

---

### ⚽ 4. Gestión de Partidos

#### 4.1 Registrar Partido Normal

**Endpoint:** `POST /matches`

**Body:**
```json
{
  "date": "2024-11-15T18:00:00.000Z",
  "player1Id": "{PLAYER_1_ID}",
  "player2Id": "{PLAYER_2_ID}",
  "gamesP1": 3,
  "gamesP2": 1,
  "matchStatus": "PLAYED"
}
```

**Respuesta Esperada (201):**
```json
{
  "id": "...",
  "date": "2024-11-15T18:00:00.000Z",
  "player1Id": "...",
  "player2Id": "...",
  "gamesP1": 3,
  "gamesP2": 1,
  "winnerId": "{PLAYER_1_ID}",  // Calculado automáticamente
  "matchStatus": "PLAYED",
  "group": { ... }
}
```

✅ **La clasificación se actualiza automáticamente**

#### 4.2 Registrar Partido por Lesión

**Body:**
```json
{
  "date": "2024-11-16T18:00:00.000Z",
  "player1Id": "{PLAYER_3_ID}",
  "player2Id": "{PLAYER_4_ID}",
  "gamesP1": 0,
  "gamesP2": 0,
  "matchStatus": "INJURY"
}
```

✅ **Este partido NO afecta a la clasificación**

#### 4.3 Registrar Varios Partidos

Crea al menos 10-15 partidos con diferentes resultados:

```json
// Partido Carlos (3) vs María (1)
{
  "date": "2024-11-15T18:00:00.000Z",
  "player1Id": "{CARLOS_ID}",
  "player2Id": "{MARIA_ID}",
  "gamesP1": 3,
  "gamesP2": 1,
  "matchStatus": "PLAYED"
}

// Partido María (3) vs Pedro (0)
{
  "date": "2024-11-16T18:00:00.000Z",
  "player1Id": "{MARIA_ID}",
  "player2Id": "{PEDRO_ID}",
  "gamesP1": 3,
  "gamesP2": 0,
  "matchStatus": "PLAYED"
}

// ... más partidos
```

#### 4.4 Listar Partidos de un Jugador

**Endpoint:** `GET /players/:playerId`

**Respuesta:** Incluye array `matches` con todos los partidos del jugador

#### 4.5 Actualizar Partido

**Endpoint:** `PUT /matches/:matchId`

**Body:**
```json
{
  "gamesP1": 3,
  "gamesP2": 2
}
```

✅ **La clasificación se recalcula automáticamente**

#### 4.6 Eliminar Partido

**Endpoint:** `DELETE /matches/:matchId` (Solo ADMIN)

✅ **La clasificación se recalcula automáticamente**

---

### 📊 5. Clasificación Global

#### 5.1 Obtener Clasificación Completa

**Endpoint:** `GET /classification`

**Respuesta:**
```json
[
  {
    "playerId": "...",
    "playerName": "Carlos García",
    "nickname": "Carlitos",
    "currentGroup": "Grupo A",
    "totalMatches": 5,
    "wins": 4,
    "losses": 1,
    "draws": 0,
    "winPercentage": 80,
    "setsWon": 13,
    "setsLost": 5,
    "averas": 8
  }
  // ... más jugadores
]
```

#### 5.2 Filtrar por Temporada

**Endpoint:** `GET /classification?seasonId={SEASON_ID}`

#### 5.3 Filtrar por Grupo

**Endpoint:** `GET /classification?groupId={GROUP_ID}`

#### 5.4 Filtrar por Rango de Fechas

**Endpoint:** `GET /classification?startDate=2024-11-01T00:00:00Z&endDate=2024-11-30T23:59:59Z`

#### 5.6 Filtros Combinados

**Endpoint:** `GET /classification?seasonId={ID}&groupId={ID}&startDate=...&endDate=...`

---

### 🏆 6. Estadísticas de Jugadores

#### 6.1 Obtener Detalles Completos de un Jugador

**Endpoint:** `GET /players/:playerId`

**Respuesta:**
```json
{
  "id": "...",
  "name": "Carlos García",
  "nickname": "Carlitos",
  "email": "carlos@email.com",
  "phone": "656123456",
  "user": { ... },
  "groupPlayers": [
    {
      "id": "...",
      "rankingPosition": 1,
      "group": {
        "id": "...",
        "name": "Grupo A",
        "season": { ... }
      }
    }
  ],
  "matches": [ ... ],  // Todos los partidos
  "stats": {
    "totalMatches": 10,
    "wins": 7,
    "losses": 3,
    "winPercentage": 70,
    "setsWon": 22,
    "setsLost": 12,
    "averas": 10,
    "currentStreak": {
      "type": "WIN",  // o "LOSS"
      "count": 3
    }
  }
}
```

---

## Pruebas Frontend (UI)

### 1. Autenticación

#### Registro de Usuario

1. Abre http://localhost:5173
2. Haz clic en **"Regístrate"**
3. Completa el formulario:
   ```
   Nombre: Juan Pérez
   Email: juan@email.com
   Contraseña: test123
   Apodo: Juanito
   Teléfono: 656111222
   ```
4. Clic en **"Crear Cuenta"**

✅ **Verificar**:
- Redirección automática al Dashboard
- Mensaje de bienvenida visible
- No hay errores en consola

#### Inicio de Sesión

1. Cierra sesión (botón "Cerrar Sesión")
2. Introduce email y contraseña
3. Clic en **"Iniciar Sesión"**

✅ **Verificar**:
- Login exitoso
- Redirección a Dashboard
- Token guardado en localStorage

#### Cierre de Sesión

1. Clic en **"Cerrar Sesión"**

✅ **Verificar**:
- Redirección a /login
- Token eliminado de localStorage
- No se puede acceder a rutas protegidas

---

### 2. Dashboard del Jugador

#### Visualizar Estadísticas

1. Inicia sesión como jugador con partidos registrados
2. Ve al Dashboard

✅ **Verificar**:
- Las 4 tarjetas de estadísticas muestran datos correctos:
  - Victorias (verde)
  - Derrotas (rojo)
  - % Victorias (azul)
  - Averás (morado)

#### Grupo Actual

✅ **Verificar**:
- Se muestra el nombre del grupo y temporada
- Se muestra la posición actual
- Botón "Ver Detalles del Grupo" funciona

#### Partidos Recientes

✅ **Verificar**:
- Se muestran los últimos 5 partidos
- Fechas en formato español (ej. "15/11/2024")
- Resultado correcto (ej. "3-1")
- Ganador destacado en verde

#### Racha Actual

Registra 3 victorias consecutivas:

✅ **Verificar**:
- Muestra 🔥 icono de fuego
- Texto: "Racha de 3 victorias"
- Color verde

Registra 2 derrotas consecutivas:

✅ **Verificar**:
- Muestra 💧 icono de gota
- Texto: "Racha de 2 derrotas"
- Color rojo

---

### 3. Vista de Grupo

1. Desde el Dashboard, clic en **"Ver Detalles del Grupo"**

#### Indicadores de Progreso

✅ **Verificar**:
- **Días Restantes**: Número correcto hasta fin de temporada
- **Progreso**: Porcentaje calculado correctamente
  - Fórmula: (Partidos Jugados / Total Posible) × 100
- **Total Jugadores**: Número correcto de jugadores activos

#### Tabla de Clasificación

✅ **Verificar**:
- Jugadores ordenados por `rankingPosition`
- Los 2 primeros tienen icono 🏆
- Los 2 últimos tienen icono ⚠️
- Apodos se muestran si existen
- Botones de contacto funcionan:
  - **📞 Llamar**: Abre app de teléfono
  - **💬 WhatsApp**: Abre WhatsApp Web
  - **📋 Copiar**: Muestra alerta "¡Teléfono copiado!"

#### Partidos Recientes del Grupo

✅ **Verificar**:
- Se muestran los últimos 10 partidos
- Ganador en verde
- Fechas en formato español
- Estados especiales (LESIÓN, CANCELADO) se muestran

---

### 4. Registrar Partido

1. Ve a **"Registrar Partido"** en el menú

#### Formulario

✅ **Verificar**:
- Fecha por defecto es hoy
- Dropdown de oponente muestra solo jugadores del mismo grupo
- Estados disponibles: Jugado, Lesión, Cancelado

#### Registrar Partido Normal

1. Selecciona oponente
2. Introduce resultado: Tus Juegos = 3, Juegos Oponente = 1
3. Mantén "Jugado" como estado

✅ **Verificar**:
- Vista previa muestra: "Resultado: 3 - 1"
- Al enviar: Mensaje de éxito
- Redirección al Dashboard
- Estadísticas actualizadas

#### Registrar Lesión

1. Introduce cualquier resultado
2. Cambia estado a **"Lesión"**
3. Envía el formulario

✅ **Verificar**:
- Partido se registra en historial
- **NO** afecta a estadísticas ni clasificación

#### Validaciones

Prueba estos casos de error:

**Mismo jugador:**
- Oponente = Tu mismo jugador
- ✅ Error: "Por favor, selecciona jugadores diferentes"

**Games inválidos:**
- Tus Juegos = 5
- ✅ Error en frontend

---

### 5. Historial de Partidos

1. Ve a **"Historial"** en el menú

✅ **Verificar**:
- Todos tus partidos se muestran
- Iconos correctos:
  - ✅ Victoria (fondo verde)
  - ❌ Derrota (fondo rojo)
  - 🤕 Lesión (fondo amarillo)
  - 🚫 Cancelado (fondo gris)
- Información completa: oponente, grupo, fecha, resultado
- Orden cronológico (más recientes primero)

---

### 6. Clasificación Global

1. Ve a **"Clasificación"** en el menú

#### Tabla Principal

✅ **Verificar**:
- Se muestran todos los jugadores
- Columnas correctas:
  - Jugador (nombre + apodo)
  - Grupo
  - Victorias (verde)
  - Derrotas (rojo)
  - % Victorias (azul)
  - Sets+, Sets-
  - Averás (verde si positivo, rojo si negativo)

#### Ordenación

Haz clic en diferentes encabezados:

✅ **Verificar**:
- Al hacer clic, la tabla se ordena
- Icono de flecha (↑ o ↓) aparece
- Orden correcto (ascendente/descendente)

#### Filtros

**Búsqueda por nombre:**
1. Escribe "Carlos" en el campo de búsqueda

✅ **Verificar**: Solo aparecen jugadores con "Carlos" en el nombre

**Filtro por temporada:**
1. Selecciona una temporada del dropdown

✅ **Verificar**: Solo aparecen jugadores de esa temporada

**Filtro por grupo:**
1. Selecciona un grupo

✅ **Verificar**: Solo aparecen jugadores de ese grupo

**Filtro por fechas:**
1. Introduce fecha inicio: 01/11/2024
2. Introduce fecha fin: 30/11/2024

✅ **Verificar**: Solo se cuentan partidos en ese rango de fechas

#### Sin Resultados

1. Aplica filtros que no devuelvan resultados

✅ **Verificar**: Mensaje "No se encontraron jugadores con los filtros seleccionados"

---

### 7. Panel de Administración

#### Acceso

1. Inicia sesión como usuario con `role: ADMIN`
2. Verifica que aparece botón **"Administración"** en menú
3. Haz clic en **"Administración"**

✅ **Verificar**: Redirección a /admin

#### Gestionar Temporadas

1. Haz clic en **"Temporadas"**
2. Clic en **"+ Nueva Temporada"**
3. Completa formulario:
   ```
   Nombre: Primavera 2025
   Fecha Inicio: 01/03/2025
   Fecha Fin: 31/05/2025
   ```
4. Clic en **"Crear Temporada"**

✅ **Verificar**:
- Temporada aparece en la tabla
- Fechas en formato español
- Muestra "0 grupos" inicialmente

#### Gestionar Grupos

1. Haz clic en **"Grupos"**
2. Clic en **"+ Nuevo Grupo"**
3. Completa:
   ```
   Nombre: Grupo Elite
   Temporada: Otoño 2024
   ```
4. Clic en **"Crear Grupo"**

✅ **Verificar**:
- Grupo aparece como tarjeta
- Muestra temporada asociada
- Muestra "0 jugadores" inicialmente
- Botón "Ver" funciona

#### Gestionar Jugadores

1. Haz clic en **"Jugadores"**

✅ **Verificar**:
- Tabla con todos los jugadores
- Columnas: Nombre, Apodo, Email, Teléfono, Grupo
- Datos correctos

---

## Escenarios de Prueba Completos

### Escenario 1: Ciclo Completo de un Jugador Nuevo

**Objetivo**: Simular el recorrido completo de un jugador nuevo

1. **Registro**
   - Crea cuenta nueva
   - Verifica email de confirmación (si está implementado)
   
2. **Primer Login**
   - Inicia sesión
   - Dashboard vacío (sin grupo asignado)

3. **Admin asigna a grupo** (Desde API o Prisma Studio)
   - Admin crea grupo (si no existe)
   - Admin asigna jugador al grupo

4. **Jugador ve su grupo**
   - Refresca página
   - Dashboard ahora muestra grupo
   - Va a "Ver Detalles del Grupo"
   - Ve a otros jugadores
   - Prueba botones de contacto

5. **Juega primer partido**
   - Va a "Registrar Partido"
   - Introduce resultado: Victoria 3-0
   - Verifica actualización inmediata

6. **Revisa estadísticas**
   - Dashboard muestra: 1 victoria, 0 derrotas, 100% victorias
   - Averás: +3
   - Racha: 🔥 1 victoria

7. **Juega más partidos**
   - Registra 3 victorias más
   - Luego 1 derrota
   - Luego 2 victorias

8. **Consulta historial**
   - Va a "Historial"
   - Ve todos los 7 partidos
   - Iconos correctos

9. **Ve clasificación global**
   - Va a "Clasificación"
   - Se encuentra en la tabla
   - Filtra por su grupo
   - Ordena por Victorias

✅ **Resultado esperado**: Experiencia fluida sin errores

---

### Escenario 2: Administración de una Temporada

**Objetivo**: Administrador gestiona una liga completa

1. **Crear Temporada**
   - Admin crea "Invierno 2024-2025"
   - Fechas: 01/12/2024 - 28/02/2025

2. **Crear Grupos**
   - Crea Grupo A, B, C (3 grupos)

3. **Asignar Jugadores**
   - Distribuye 24 jugadores (8 por grupo)
   - Usa API o Prisma Studio

4. **Generar Actividad**
   - Registra 10-15 partidos por grupo
   - Mezcla de resultados variados

5. **Monitorear Progreso**
   - Ve detalles de cada grupo
   - Verifica porcentaje de progreso
   - Identifica quién está en zona de ascenso/descenso

6. **Verificar Clasificación Global**
   - Filtra por grupos individuales
   - Compara estadísticas entre grupos

✅ **Resultado esperado**: Liga funcional con datos correctos

---

## Verificación del Algoritmo de Ranking

### Caso de Prueba 1: Ranking Simple (Sin Empates)

**Setup:**
- Grupo de 4 jugadores: A, B, C, D
- Resultados:
  - A vs B: 3-0 (A gana)
  - A vs C: 3-1 (A gana)
  - A vs D: 3-0 (A gana)
  - B vs C: 3-2 (B gana)
  - B vs D: 3-1 (B gana)
  - C vs D: 3-0 (C gana)

**Clasificación Esperada:**
1. A (3 victorias)
2. B (2 victorias)
3. C (1 victoria)
4. D (0 victorias)

✅ **Verificar**: Orden correcto en `rankingPosition`

---

### Caso de Prueba 2: Empate de 2 Jugadores (Head-to-Head)

**Setup:**
- Jugadores A y B ambos con 2 victorias
- A vs B: 3-1 (A gana)

**Clasificación Esperada:**
1. A (gana el enfrentamiento directo)
2. B

✅ **Verificar**: A está por encima de B

---

### Caso de Prueba 3: Empate de 3+ Jugadores (Mini-Liga)

**Setup:**
- A, B, C todos con 2 victorias
- Enfrentamientos entre ellos:
  - A vs B: 3-1 (A gana)
  - B vs C: 3-0 (B gana)
  - C vs A: 3-2 (C gana)
- Resultados parciales:
  - A: 1V, sets 3-5 (averás -2)
  - B: 1V, sets 3-3 (averás 0)
  - C: 1V, sets 5-3 (averás +2)

**Clasificación Esperada (por averás mini-liga):**
1. C (averás +2)
2. B (averás 0)
3. A (averás -2)

✅ **Verificar**: Orden correcto aplicando mini-liga

---

### Caso de Prueba 4: Averás Global

**Setup:**
- A y B con 2 victorias
- No han jugado entre sí (o empataron)
- Averás global:
  - A: +5
  - B: +3

**Clasificación Esperada:**
1. A (mejor averás global)
2. B

✅ **Verificar**: A por encima de B

---

### Caso de Prueba 5: Partidos por Lesión No Cuentan

**Setup:**
- A tiene 3 victorias normales
- B tiene 2 victorias normales + 1 por lesión

**Clasificación Esperada:**
1. A (3 victorias válidas)
2. B (2 victorias válidas)

✅ **Verificar**: Partido por lesión no cuenta en ranking

---

## Checklist de Funcionalidades

### Autenticación ✅
- [ ] Registro de usuario
- [ ] Login
- [ ] Logout
- [ ] Autenticación persistente (refresh de página)
- [ ] Protección de rutas
- [ ] Roles (PLAYER/ADMIN)

### Dashboard Jugador ✅
- [ ] Estadísticas personales
- [ ] Grupo actual
- [ ] Partidos recientes
- [ ] Racha actual
- [ ] Responsive design

### Grupo ✅
- [ ] Indicadores de progreso (días, %, total jugadores)
- [ ] Clasificación ordenada
- [ ] Iconos ascenso/descenso
- [ ] Botones de contacto (call, WhatsApp, copy)
- [ ] Partidos recientes del grupo
- [ ] Formato de fechas español

### Registrar Partido ✅
- [ ] Selección de oponente (solo del mismo grupo)
- [ ] Input de resultado
- [ ] Estados (Jugado, Lesión, Cancelado)
- [ ] Vista previa del resultado
- [ ] Validaciones
- [ ] Actualización automática de clasificación

### Historial ✅
- [ ] Lista completa de partidos
- [ ] Iconos por estado
- [ ] Información detallada
- [ ] Orden cronológico

### Clasificación Global ✅
- [ ] Tabla completa
- [ ] Ordenación por columnas
- [ ] Búsqueda por nombre
- [ ] Filtro por temporada
- [ ] Filtro por grupo
- [ ] Filtro por rango de fechas
- [ ] Mensaje si no hay resultados

### Administración ✅
- [ ] Panel admin (solo para ADMIN)
- [ ] Crear temporadas
- [ ] Listar temporadas
- [ ] Crear grupos
- [ ] Listar grupos
- [ ] Listar jugadores
- [ ] Asignar jugadores a grupos (via API)

### Algoritmo de Ranking ✅
- [ ] Nivel 1: Victorias
- [ ] Nivel 2: Head-to-head (2 jugadores)
- [ ] Nivel 3: Mini-liga (3+ jugadores)
- [ ] Nivel 4: Averás global
- [ ] Nivel 5: Orden alfabético
- [ ] Excluir lesiones/cancelados
- [ ] Recálculo automático tras cambios

### Backend API ✅
- [ ] Endpoints de autenticación
- [ ] CRUD Temporadas
- [ ] CRUD Grupos
- [ ] CRUD Partidos
- [ ] Estadísticas de jugador
- [ ] Clasificación global
- [ ] Asignar/remover jugadores de grupos
- [ ] Validaciones con Zod
- [ ] Manejo de errores

### Extras ✅
- [ ] Loading states
- [ ] Error handling
- [ ] Modo oscuro (opcional)
- [ ] Responsive design
- [ ] Textos en castellano (España)
- [ ] Formato de fechas español

---

## Problemas Comunes y Soluciones

### Error: "Player not in any group"

**Causa**: El jugador no está asignado a ningún grupo

**Solución**:
1. Como admin, usa API: `POST /groups/:groupId/players { "playerId": "..." }`
2. O en Prisma Studio: Crea registro en tabla `GroupPlayer`

---

### Error: "Both players must be in the same group"

**Causa**: Intentas registrar un partido entre jugadores de diferentes grupos

**Solución**: Solo puedes registrar partidos con jugadores de tu mismo grupo

---

### Clasificación no se actualiza

**Causa**: Partido marcado como INJURY o CANCELLED

**Solución**: Solo partidos con `matchStatus: PLAYED` afectan al ranking

---

### No aparecen jugadores en dropdown

**Causa 1**: No estás asignado a ningún grupo  
**Causa 2**: Tu grupo está vacío

**Solución**: Verifica en Prisma Studio la tabla `GroupPlayer`

---

### Error 401 Unauthorized

**Causa**: Token JWT expirado o inválido

**Solución**:
1. Cierra sesión y vuelve a iniciar
2. Verifica que el header `Authorization: Bearer {token}` está presente

---

### Error CORS en desarrollo

**Causa**: Frontend y backend en puertos diferentes

**Solución**: Vite proxy ya está configurado en `vite.config.ts`. Verifica que el backend esté en puerto 3000.

---

## Métricas de Éxito

Al completar todas las pruebas, deberías tener:

✅ Al menos 2 temporadas creadas  
✅ Al menos 2 grupos con 8 jugadores cada uno  
✅ Mínimo 20 partidos registrados  
✅ Clasificaciones correctas en todos los grupos  
✅ Sin errores en consola del navegador  
✅ Sin errores en logs del servidor  
✅ Todos los filtros funcionando  
✅ Toda la UI en castellano  

---

**Versión**: 1.0  
**Última actualización**: 22 de noviembre de 2024

¡Buenas pruebas! 🚀
