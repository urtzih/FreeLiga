# FreeSquash League - Traducción Completa al Castellano

## 📋 Estado de la Traducción

### ✅ Archivos Completamente Traducidos

**Páginas de Autenticación:**
- ✅ `apps/web/src/pages/auth/Login.tsx` - 100% traducido
- ✅ `apps/web/src/pages/auth/Register.tsx` - 100% traducido

**Páginas de Jugador:**
- ✅ `apps/web/src/pages/player/Dashboard.tsx` - 100% traducido
- ✅ `apps/web/src/pages/player/GroupView.tsx` - 100% traducido
- ✅ `apps/web/src/pages/player/RecordMatch.tsx` - 100% traducido
- ✅ `apps/web/src/pages/player/MatchHistory.tsx` - 100% traducido

**Páginas de Administrador:**
- ✅ `apps/web/src/pages/admin/AdminDashboard.tsx` - 100% traducido
- ✅ `apps/web/src/pages/admin/ManageSeasons.tsx` - 100% traducido
- ✅ `apps/web/src/pages/admin/ManageGroups.tsx` - 100% traducido
- ✅ `apps/web/src/pages/admin/ManagePlayers.tsx` - 100% traducido

**Total:** 9 archivos principales de frontend completados

---

## 🔄 Archivos Pendientes de Traducción

###  **GlobalClassification.tsx**

**Archivo:** `apps/web/src/pages/player/GlobalClassification.tsx`

**Textos a traducir:**

```typescript
// Línea 47: Título del encabezado
"Global Classification" → "Clasificación Global"

// Línea 48: Subtítulo
"League-wide player rankings and statistics" → "Clasificaciones y estadísticas de todos los jugadores"

// Línea 52: Título de filtros
"Filters" → "Filtros"

// Línea 55: Label búsqueda
"Search Player" → "Buscar Jugador"

// Línea 61: Placeholder
"Search by name..." → "Buscar por nombre..."

// Línea 68: Label temporada
"Season" → "Temporada"

// Línea 76: Opción por defecto
"All Seasons" → "Todas las Temporadas"

// Línea 84: Label grupo
"Group" → "Grupo"

// Línea 92: Opción por defecto
"All Groups" → "Todos los Grupos"

// Línea 100: Label rango fecha
"Date Range" → "Rango de Fechas"

// Línea 130: Texto de carga
"Loading..." → "Cargando..."

// Línea 133-140: Encabezados de tabla
"Player" → "Jugador"
"Group" → "Grupo"
"Wins" → "Victorias"
"Losses" → "Derrotas"
"Win %" → "% Victorias"
"Sets+" → "Sets+"
"Sets-" → "Sets-"
"Averás" → "Aver ás" (ya en castellano)

// Línea 220: Mensaje sin resultados
"No players found with the selected filters" → "No se encontraron jugadores con los filtros seleccionados"
```

### **Layout.tsx**

**Archivo:** `apps/web/src/components/Layout.tsx`

**Textos a traducir:**

```typescript
// Navegación principal
"Dashboard" → "Inicio"
"My Group" → "Mi Grupo"
"Record Match" → "Registrar Partido"
"Match History" → "Historial"
"Classification" → "Clasificación"

// Navegación admin
"Admin" → "Administración"
"Seasons" → "Temporadas"
"Groups" → "Grupos"
"Players" → "Jugadores"

// Usuario
"Logout" → "Cerrar Sesión"
```

### **App.tsx** (Rutas)

**Archivo:** `apps/web/src/App.tsx`

Si hay mensajes de error o redirecciones, traducir cualquier texto visible al usuario.

### **Backend - Mensajes de Error API**

**Archivo:** `apps/api/src/routes/auth.routes.ts`

```typescript
// Línea ~40: Error credenciales inválidas
"Invalid credentials" → "Credenciales inválidas"

// Línea ~70: Error usuario ya existe
"User already exists" → "El usuario ya existe"

// Línea ~90: Error usuario no encontrado
"User not found" → "Usuario no encontrado"
```

**Archivo:** `apps/api/src/routes/match.routes.ts`

```typescript
// Validaciones
"Players must be different" → "Los jugadores deben ser diferentes"
"Both players must be in the same group" → "Ambos jugadores deben estar en el mismo grupo"
"Invalid game scores" → "Puntuación de juegos inválida"
"Match not found" → "Partido no encontrado"
```

**Archivo:** `apps/api/src/routes/group.routes.ts`

```typescript
"Group not found" →  "Grupo no encontrado"
"Player not found" → "Jugador no encontrado"
"Player already in group" → "El jugador ya está en el grupo"
```

---

## 📝 Documentación (Pendiente)

### README.md

**Archivo:** `README.md`

El README completo debe traducirse al castellano. Archivo largo, pero importante para usuarios hispanohablantes.

**Secciones principales a traducir:**
- Título y descripción
- Tech Stack
- Features list
- Setup Instructions
- Project Structure
- API Endpoints
- Testing guide
- Deployment
- Troubleshooting

### Walkthrough.md

**Archivo:** `walkthrough.md` (en artifacts)

Documento completo de demostración que también debe estar en castellano para el equipo.

---

## 🎯 Próximos Pasos

Para completar la traducción al 100%:

1. **Traducir GlobalClassification.tsx** - Aplicar traducciones listadas arriba
2. **Traducir Layout.tsx** - Menús de navegación
3. **Traducir mensajes de error del backend** - Para mensajes consistentes
4. **Traducir documentación** - README.md y walkthrough.md
5. **Verificar formato de fechas** - Asegurar que todas usan `toLocaleDateString('es-ES')`

---

## ✅ Validaciones en Castellano

Todas las validaciones de formularios ya están en castellano:

- "Este campo es obligatorio"
- "Por favor, selecciona jugadores diferentes"
- "Los juegos deben estar entre 0 y 3"
- "Error al iniciar sesión. Verifica tus credenciales."
- "Error al crear la cuenta. Inténtalo de nuevo."
- "¡Teléfono copiado!"

---

## 📊 Progreso Total

- **Frontend Páginas Principales:** 9/11 (82%)
- **Componentes UI:** 0/1 (0%) - Layout pendiente
- **Backend Mensajes:** 0% - Pendiente
- **Documentación:** 0% - Pendiente

**Progreso Global Estimado: ~70%**

---

## 🔧 Aplicar Traducciones Rápidamente

Para los archivos pendientes, usa buscar/reemplazar (Ctrl+H en VS Code) con las traducciones listadas arriba.

**Ejemplo:**
1. Abrir `GlobalClassification.tsx`
2. Buscar: `"Search Player"`
3. Reemplazar: `"Buscar Jugador"`
4. Reemplazar todo

Repetir para cada texto listado.

---

## 🌐 Mantenimiento de la Traducción

**Regla general**: TODO texto visible para el usuario debe estar en castellano.

**Excepciones permitidas (en inglés):**
- Nombres de variables/funciones en código
- Nombres de modelos de base de datos (`Player`, `Match`, `Group`, etc.)
- Comentarios de código (opcional, puede ser castellano o inglés)
- Nombres de archivos y carpetas

**Siempre en castellano:**
- Labels de formularios
- Botones
- Mensajes de error/éxito
- Títulos y encabezados
- Placeholders
- Tooltips
- Validaciones
- Documentación de usuario

---

Creado: 22 de noviembre de 2024
