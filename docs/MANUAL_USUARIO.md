# 📖 Manual de Usuario - FreeSquash Liga

## Índice
1. [Introducción](#introducción)
2. [Primeros Pasos](#primeros-pasos)
3. [Para Jugadores](#para-jugadores)
4. [Para Administradores](#para-administradores)
5. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Introducción

### ¿Qué es FreeSquash Liga?

FreeSquash Liga es una plataforma web para gestionar ligas de squash con grupos clasificatorios. Permite:

✅ Registro y seguimiento de partidos  
✅ Clasificaciones automáticas con algoritmo de desempate  
✅ Estadísticas detalladas de jugadores  
✅ Gestión de temporadas y grupos  
✅ Comunicación directa entre jugadores  

### Roles de Usuario

**Jugador (PLAYER)**
- Ver su clasificación y estadísticas
- Registrar resultados de partidos
- Consultar historial y clasificación global
- Contactar con otros jugadores del grupo

**Administrador (ADMIN)**
- Crear y gestionar temporadas
- Crear y gestionar grupos
- Asignar jugadores a grupos
- Acceso al panel de administración

---

## Primeros Pasos

### 1. Registro en la Plataforma

1. **Accede a la aplicación** en tu navegador (http://localhost:4173 en desarrollo)
2. **Haz clic en "Regístrate"** en la página de inicio de sesión
3. **Completa el formulario de registro**:
   - **Nombre Completo*** (obligatorio): Tu nombre completo
   - **Correo Electrónico*** (obligatorio): Tu email (será tu usuario)
   - **Contraseña*** (obligatorio): Mínimo 6 caracteres
   - **Apodo** (opcional): Un alias o apodo
   - **Teléfono** (opcional pero recomendado): Para que otros jugadores puedan contactarte

4. **Haz clic en "Crear Cuenta"**

✅ **¡Listo!** Serás redirigido automáticamente a tu panel de control.

> **Nota**: Por defecto, serás registrado como JUGADOR. Para obtener permisos de administrador, contacta con el administrador del sistema.

### 2. Iniciar Sesión

1. Accede a la página principal
2. Introduce tu **correo electrónico** y **contraseña**
3. Haz clic en **"Iniciar Sesión"**

---

## Para Jugadores

### 📊 Panel de Control (Dashboard)

Tu página principal muestra:

#### Estadísticas Personales
- **Victorias**: Total de partidos ganados
- **Derrotas**: Total de partidos perdidos
- **% Victorias**: Porcentaje de partidos ganados
- **Averás**: Diferencia entre sets ganados y perdidos

#### Grupo Actual
- Nombre del grupo y temporada
- Tu posición en la clasificación
- Botón para ver detalles del grupo

#### Partidos Recientes
- Lista de tus últimos 5 partidos
- Resultado y oponente
- Indicador de victoria/derrota

#### Racha Actual
- Si tienes victorias o derrotas consecutivas
- Número de partidos en racha
- Icono visual (🔥 para victorias, 💧 para derrotas)

---

### 🏆 Ver Detalles del Grupo

Desde el Dashboard, haz clic en **"Ver Detalles del Grupo"**.

#### Indicadores de Progreso

**⏰ Días Restantes**
- Días que quedan hasta el fin de la temporada

**📊 Progreso**
- Porcentaje de partidos jugados
- Número total de partidos posibles

**👥 Total Jugadores**
- Número de jugadores activos en el grupo

#### Tabla de Clasificación

La tabla muestra todos los jugadores ordenados por posición:

- **🏆** Los 2 primeros (zona de ascenso)
- **⚠️** Los 2 últimos (zona de descenso)
- **Nombre y apodo** de cada jugador
- **Botones de contacto** (📞 Llamar, 💬 WhatsApp, 📋 Copiar teléfono)

#### Partidos Recientes del Grupo

Lista de los últimos 10 partidos jugados en el grupo con:
- Nombres de los jugadores
- Resultado (games ganados)
- Fecha del partido
- Nombre del ganador destacado en verde

---

### ⚽ Registrar un Partido

1. **Ve a "Registrar Partido"** en el menú superior
2. **Selecciona los datos del partido**:
   - **Fecha**: Por defecto hoy, puedes cambiarla
   - **Tu Oponente**: Selecciona de la lista de jugadores de tu grupo
   - **Estado del Partido**:
     - **Jugado**: Partido normal (afecta a la clasificación)
     - **Lesión**: Partido anulado por lesión (se registra pero no afecta a clasificación)
     - **Cancelado**: Partido cancelado

3. **Si el partido fue jugado**, introduce los resultados:
   - **Tus Juegos**: Número de games que ganaste (0-3)
   - **Juegos del Oponente**: Número de games que ganó tu oponente (0-3)
   - Verás una **vista previa del resultado**

4. **Haz clic en "Registrar Partido"**

✅ **La clasificación se actualiza automáticamente** tras registrar el partido

> **Validaciones importantes**:
> - Los jugadores deben ser diferentes
> - Los games deben estar entre 0 y 3
> - Si el marcador es empate (ej. 2-2), se registrará como empate

---

### 📜 Historial de Partidos

Ve a **"Historial"** en el menú para ver todos tus partidos.

Cada partido muestra:
- ✅ Victoria / ❌ Derrota
- 🤕 Lesión / 🚫 Cancelado
- Nombre del oponente y apodo
- Grupo y fecha
- Resultado final (si fue jugado)

---

### 🌍 Clasificación Global

Accede a **"Clasificación"** para ver estadísticas de todos los jugadores.

#### Filtros Disponibles

- **Buscar Jugador**: Busca por nombre
- **Temporada**: Filtra por temporada específica
- **Grupo**: Filtra por grupo específico
- **Rango de Fechas**: Ver estadísticas en un período concreto

#### Columnas de la Tabla

| Columna | Descripción |
|---------|-------------|
| **Jugador** | Nombre y apodo |
| **Grupo** | Grupo actual |
| **Victorias** | Partidos ganados (verde) |
| **Derrotas** | Partidos perdidos (rojo) |
| **% Victorias** | Porcentaje de victorias (azul) |
| **Sets+** | Sets ganados |
| **Sets-** | Sets perdidos |
| **Averás** | Diferencia sets (verde si positivo, rojo si negativo) |

**Ordenación**: Haz clic en cualquier encabezado para ordenar por esa columna

---

## Para Administradores

### 🎛️ Panel de Administración

Los administradores tienen acceso al botón **"Administración"** en el menú.

---

### 📅 Gestionar Temporadas

**Acceso**: Administración > Temporadas

#### Crear Nueva Temporada

1. Haz clic en **"+ Nueva Temporada"**
2. Completa el formulario:
   - **Nombre de la Temporada**: Ej. "Otoño 2024"
   - **Fecha de Inicio**: Primer día de la temporada
   - **Fecha de Fin**: Último día de la temporada
3. Haz clic en **"Crear Temporada"**

#### Lista de Temporadas

La tabla muestra:
- Nombre de cada temporada
- Fechas de inicio y fin
- Número de grupos asociados

---

### 👥 Gestionar Grupos

**Acceso**: Administración > Grupos

#### Crear Nuevo Grupo

1. Haz clic en **"+ Nuevo Grupo"**
2. Completa el formulario:
   - **Nombre del Grupo**: Ej. "Grupo A", "Grupo Elite"
   - **Temporada**: Selecciona la temporada a la que pertenece
3. Haz clic en **"Crear Grupo"**

#### Vista de Grupos

- Cada grupo se muestra como una tarjeta
- Muestra nombre, temporada y número de jugadores
- Botón **"Ver"** para acceder a los detalles del grupo

#### Asignar Jugadores a Grupos

**Método 1: A través de API** (ver sección de pruebas)

**Método 2: Prisma Studio**
1. Ejecuta `npm run db:studio`
2. Ve a la tabla **GroupPlayer**
3. Crea un nuevo registro con:
   - `groupId`: ID del grupo
   - `playerId`: ID del jugador
   - `rankingPosition`: Posición inicial (1, 2, 3...)

---

### 🏃 Gestionar Jugadores

**Acceso**: Administración > Jugadores

Visualiza todos los jugadores registrados:

- Nombre completo y apodo
- Correo electrónico
- Teléfono de contacto
- Grupo actual asignado

> **Nota**: La edición de jugadores está disponible a través de la API (`PUT /players/:id`)

---

## Preguntas Frecuentes

### ¿Cómo funciona la clasificación?

La clasificación usa un algoritmo de desempate en 4 niveles:

1. **Partidos Ganados** (principal)
2. **Enfrentamiento Directo** (si hay 2 jugadores empatados)
3. **Mini-Liga** (si hay 3+ jugadores empatados):
   - Victorias internas entre jugadores empatados
   - Averás interno (diferencia de sets entre empatados)
4. **Averás Global** (diferencia total de sets)
5. **Orden Alfabético** (último recurso)

### ¿Los partidos por lesión afectan a la clasificación?

**No**. Los partidos marcados como "Lesión" o "Cancelados" se registran en el historial pero **no afectan a las clasificaciones**.

### ¿Cómo contacto con otros jugadores?

En la **vista de grupo**, cada jugador tiene 3 botones de contacto:

- **📞 Llamar**: Abre tu aplicación de teléfono
- **💬 WhatsApp**: Abre WhatsApp con el número del jugador

> **Nota**: Solo funciona si el jugador registró su teléfono

### ¿Puedo editar un partido después de registrarlo?

Actualmente, la edición de partidos está disponible solo a través de la API:
- `PUT /matches/:id` para actualizar
- `DELETE /matches/:id` para eliminar (solo administradores)

La clasificación se recalcula automáticamente tras cualquier cambio.

### ¿Cómo se calcula el porcentaje de progreso del grupo?

```
Progreso % = (Partidos Jugados / Partidos Posibles) × 100

Partidos Posibles = (N × (N-1)) / 2
Donde N = número de jugadores en el grupo
```

**Ejemplo**: Grupo de 8 jugadores
- Partidos posibles = (8 × 7) / 2 = 28 partidos
- Si se han jugado 21 partidos: 21/28 = 75%

### ¿Qué es "Averás"?

El **Averás** (o average) es la diferencia entre sets ganados y sets perdidos.

**Ejemplo**:
- Has ganado 12 sets
- Has perdido 8 sets
- Tu Averás = 12 - 8 = **+4** ✅

Si es negativo (ej. -3), significa que has perdido más sets de los que has ganado.

### ¿Puedo ver mis estadísticas contra un oponente específico?

Sí, en la **Clasificación Global**:
1. Ve a "Clasificación"
2. Usa el filtro de búsqueda para encontrar al oponente
3. (Próximamente: filtro específico de oponente en desarrollo)

Actualmente, puedes ver todos tus partidos contra ese jugador en tu **Historial**.

---

## 🆘 Soporte

### Problemas Comunes

**No veo mi grupo en el Dashboard**
- Verifica que un administrador te haya asignado a un grupo
- Comprueba en Prisma Studio que exista un registro en `GroupPlayer` con tu `player.id`

**No aparecen jugadores al registrar un partido**
- Solo aparecen jugadores de tu mismo grupo
- Verifica que tu grupo tenga jugadores asignados

**La clasificación no se actualiza**
- Actualiza la página (F5)
- Verifica que el partido esté marcado como "Jugado" (no "Lesión" ni "Cancelado")

**Olvidé mi contraseña**
- Actualmente no hay recuperación automática
- Contacta con un administrador para restablecer tu contraseña en la base de datos

---

## 📱 Próximas Funcionalidades

- 🔄 Ascensos y descensos automáticos
- 📧 Notificaciones por email
- 📊 Gráficos de evolución de estadísticas
- 🗓️ Sistema de disponibilidad de jugadores
- 🤖 Sugerencia automática de partidos pendientes
- ✏️ Edición de partidos desde la interfaz
- 🌙 Selector de tema claro/oscuro

---

## 🌐 Translation Status

**Complete (100%):**
- ✅ All user-facing pages translated to Spanish
- ✅ All validation messages in Spanish
- ✅ All UI labels in Spanish
- ✅ All documentation in Spanish

**Partially Complete:**
- 🟡 Backend API error messages (in progress)

**Implementation Notes:**
- All visible text must be in Spanish
- Variable/function names remain in English (code standard)
- Database model names remain in English
- Code comments can be in Spanish or English

---

**Versión**: 1.0 MVP  
**Última actualización**: 15 de diciembre de 2024

**¿Te ha sido útil este manual?** Si tienes sugerencias o encuentras errores, contacta con el administrador del sistema.
