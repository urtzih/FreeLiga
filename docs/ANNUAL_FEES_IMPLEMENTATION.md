# Implementación: Cuotas Anuales de Club

## Descripción General
Se ha implementado un sistema para rastrear y gestionar las cuotas anuales de club a nivel de jugador. Los administradores pueden ver y editar fácilmente qué años ha pagado la cuota cada jugador.

## Cambios Realizados

### 1. Base de Datos (Prisma)

#### Schema Update
Se añadió un nuevo campo al modelo `Player`:
```prisma
model Player {
  // ... otros campos
  annualFeesPaid Json @default("[]") // Array de años cuando se pagó la cuota
  // ... relaciones
}
```

El campo `annualFeesPaid` es un JSON que almacena un array de números (años).

#### Migración BD
Se ejecutó `prisma db push` para aplicar el cambio a la BD:
- Campo creado en tabla `players` como JSON
- Valor inicial: array vacío `[]`
- Soporta cualquier cantidad de años

### 2. API Backend (Fastify)

#### Rutas Nuevas en `/players`

##### PUT `/:id`
Actualización general del jugador (existente, mejorada):
```typescript
PUT /players/:id
{
  "name": "...",
  "nickname": "...",
  "phone": "...",
  "annualFeesPaid": [2024, 2023]  // Opcional
}
```

##### PUT `/:id/annual-fees` (NUEVA)
Actualizar todas las cuotas del jugador:
```typescript
PUT /players/:id/annual-fees
{
  "annualFeesPaid": [2024, 2023, 2022]
}
```
- Valida que sea un array de números
- Ordena automáticamente los años en ascendente
- Requiere autenticación y rol ADMIN

##### POST `/:id/annual-fees/toggle/:year` (NUEVA)
Toggle para añadir/quitar un año específico:
```typescript
POST /players/:id/annual-fees/toggle/2024
```
- Añade el año si no existe
- Lo quita si ya está registrado
- Útil para cambios rápidos
- Requiere autenticación y rol ADMIN

### 3. Frontend (React)

#### Componente: ManageUsers.tsx

##### Nueva UI en Tabla de Usuarios
- Botón verde "💰 Cuotas" en acciones para cada jugador
- Permite abrir un modal para editar las cuotas

##### Modal de Edición de Cuotas
**Características:**
- Muestra todos los años en los que se pagó
- Botón para quitar cada año registrado
- Quick buttons para años comunes (año actual, anterior, siguiente)
- Input manual para años personalizados
- Auto-ordenación de años
- Validación de entrada

**Flujo:**
1. Click en botón "💰 Cuotas" de un jugador
2. Se abre modal con información actual
3. Seleccionar/deseleccionar años
4. Click "Guardar Cambios"
5. Se actualiza la BD via API

#### Nueva Interfaz
```typescript
interface User {
  // ... campos existentes
  player?: {
    // ... campos existentes
    annualFeesPaid?: number[];  // NUEVO
  };
}
```

#### Nuevos Estados
```typescript
const [showFeesModal, setShowFeesModal] = useState(false);
const [editingFees, setEditingFees] = useState<number[]>([]);
```

#### Nuevo Mutation
```typescript
const updateAnnualFeesMutation = useMutation({
  mutationFn: async ({ playerId, annualFeesPaid }) => {
    const { data } = await api.put(
      `/players/${playerId}/annual-fees`,
      { annualFeesPaid }
    );
    return data;
  }
  // ...
});
```

#### Nuevos Handlers
- `handleOpenFeesModal(user)` - Abre el modal
- `handleToggleFeeYear(year)` - Añade/quita un año
- `handleAddFeeYear(year)` - Añade un año
- `handleSaveFees()` - Guarda los cambios

## Casos de Uso

### Caso 1: Registrar que un jugador pagó la cuota este año
1. Ir a Gestión de Usuarios
2. Buscar el jugador
3. Click "💰 Cuotas"
4. Click button "2026" (o año actual)
5. Click "Guardar Cambios"

### Caso 2: El jugador NO pagó la cuota este año pero pagó años anteriores
1. Modal muestra [2024, 2023]
2. Admin puede dejar como está o quitar un año si fue error

### Caso 3: Arreglar historial completo
1. Modal abierto
2. Quitar todos los años con botón ✕
3. Añadir manualmente los años correctos
4. Guardar

## UI/UX

### Ubicación de Funcionalidad
- Tabla de Usuarios: Columna "Acciones"
- Botón claramente identificado con icono 💰
- Modal independiente para no contaminar otra UI
- Suficientemente visible pero no invasivo

### Colores y Estilos
- Botón de cuotas: Verde (diferente de editar/resetear)
- Modal: Mismo estilo que otros modales del admin
- Años: Display claro con opción fácil de quitar
- Inputs: Validación visual estándar

### Información Mostrada
```
Cuotas Anuales de Club
Jugador: [nombre]

Años en los que ha pagado la cuota:
┌─────────────────────────────────┐
│ 2026                    [✕ Quitar] │
│ 2025                    [✕ Quitar] │
│ 2024                    [✕ Quitar] │
└─────────────────────────────────┘

Añadir año: [2026] [2025] [2024]

Entrada manual: [input] [Añadir button]

[Guardar Cambios] [Cancelar]
```

## Validación

### Backend
- ✓ Array validation (debe ser array)
- ✓ Type validation (todos números)
- ✓ Admin-only operations
- ✓ Auto-sort de años

### Frontend
- ✓ Type checking TypeScript
- ✓ Prevención de duplicados
- ✓ Validación de rango de años (2000 - año actual + 1)
- ✓ Feedback visual al guardar

## Estados Posibles

```
Player.annualFeesPaid = []              // Sin cuota pagada
Player.annualFeesPaid = [2024]          // Pagó solo 2024
Player.annualFeesPaid = [2023, 2024]    // Pagó 2023 y 2024
Player.annualFeesPaid = [2022, 2023, 2024, 2025, 2026]  // Pagó múltiples años
```

## Testing Manual

### Pruebas Recomendadas
1. **Crear nuevo jugador y asignar cuotas**
   - Crear jugador
   - Abrir modal de cuotas
   - Añadir año actual
   - Guardar y verificar

2. **Editar cuotas existentes**
   - Seleccionar jugador con cuotas actuales
   - Quitar un año
   - Verificar en BD

3. **Validación de input**
   - Intentar año inválido (< 2000)
   - Intentar duplicados (debe ignorarse)
   - Caracteres no numéricos

4. **Persistencia**
   - Guardar cambios
   - Recargar página
   - Verificar que persista

## Estructura de Datos

### JSON en BD
```json
// players.annualFeesPaid
[]                    // Vacío
[2024]               // Un año
[2023, 2024, 2025]   // Múltiples, siempre ordenados
```

### API Request/Response
```json
{
  "annualFeesPaid": [2023, 2024, 2025]
}
```

## Rendimiento

- Campo JSON es eficiente para arrays pequeños (< 100 items)
- Query típica de jugadores incluye este campo automáticamente
- Cambios puntuales no impactan performance
- Índices: no necesarios para array pequeño

## Seguridad

- ✓ Operaciones requieren autenticación
- ✓ Solo admins pueden actualizar cuotas
- ✓ Validación de tipo en backend
- ✓ No hay inyección SQL (Prisma ORM)

## Futuras Mejoras

1. **Auditoría**: Guardar quién cambió qué y cuándo
2. **Notificaciones**: Alertar cuando se debe pagar
3. **Reportes**: Listar jugadores pending de cuota
4. **Automatización**: Pagar cuota automáticamente en fecha
5. **Exportación**: Incluir cuotas en CSV de usuarios

## Archivos Modificados

```
packages/database/prisma/schema.prisma      ✓ Actualizado
apps/api/src/routes/player.routes.ts        ✓ Actualizado
apps/web/src/pages/admin/ManageUsers.tsx    ✓ Actualizado
```

## Dependencias

- Prisma: ^5.7.1 (ya incluido)
- Fastify: (ya incluido)
- React Query: (ya incluido)
- React: (ya incluido)

No se requieren nuevas dependencias externas.

## Notas Técnicas

- El campo `Json` de Prisma se mapea a JSON en MySQL 8.0+
- Ordenación se hace en backend para consistencia
- Array siempre va ordenado ascendente para predictibilidad
- El estado del modal se mantiene en componente (no en Query cache)

## Estado Actual

✅ Base de datos: Actualizada
✅ API: Endpoints implementados y testeable
✅ Frontend: UI completa y funcional
✅ TypeScript: Sin errores
✅ Compilación: Exitosa

**Status**: LISTO PARA TESTING
