# Reglas de Cierre de Temporada

## Resumen

Al finalizar cada ciclo (temporada), el sistema aplica un proceso de cierre automático que calcula ascensos, descensos y permanencias según las posiciones finales de cada jugador en su grupo.

## Reglas Generales

### 1. Grupos y Tamaño
- Los grupos siempre tienen un **mínimo de 8 jugadores**.
- Los grupos están ordenados jerárquicamente de forma alfabética (Grupo 1 es el superior, Grupo 8 el inferior, etc.).

### 2. Ascensos y Descensos

#### Grupo Superior (Grupo 1)
- **No hay ascensos** (ya están en el nivel más alto).
- **2 descensos**: los 2 últimos jugadores (posiciones 7 y 8 si el grupo tiene 8) descienden al Grupo 2.

#### Grupos Intermedios (Grupos 2-7)
- **2 ascensos**: los 2 primeros jugadores (posiciones 1 y 2) ascienden al grupo superior.
- **2 descensos**: los 2 últimos jugadores descienden al grupo inferior.

#### Grupo Inferior (Último Grupo)
- **2 ascensos**: los 2 primeros jugadores ascienden al grupo superior.
- **No hay descensos** (no existe grupo inferior).

### 3. Permanencias
- Todos los jugadores que no ascienden ni descienden permanecen en su grupo actual.

### 4. Descensos Adicionales (Grupos >8)
- Si un grupo tiene más de 8 jugadores (ej. 10), se aplicarán **descensos adicionales** para reducirlo a 8:
  - `descensos_total = 2 + (tamaño - 8)`
  - Ejemplo: grupo de 10 → 2 + (10 - 8) = **4 descensos**.
- **Pendiente confirmar fórmula exacta**.

### 5. Tie-Break (Empates en Posición)
Cuando varios jugadores están empatados en posiciones de ascenso o descenso, se aplican las siguientes reglas en cascada:

1. **Head-to-head** (cara a cara): si solo 2 jugadores, el ganador del partido directo.
2. **Mini-league** (mini-liga interna): si 3+ jugadores:
   - Victorias internas (solo entre los jugadores empatados).
   - Si persiste empate: averás internas (diferencia de sets ganados/perdidos dentro del empate).
3. **Averás global**: diferencia total de sets ganados/perdidos en todo el grupo.
4. **Averás particular**: diferencia de sets en "mini-liga particular" (interna).
5. **Orden alfabético** (último recurso).

## Proceso de Cierre

### Flujo Híbrido
1. El sistema calcula el cierre automáticamente y genera un **registro PENDING** (pendiente).
2. El administrador revisa la propuesta de ascensos/descensos.
3. El administrador **aprueba** el cierre.
4. El sistema aplica los movimientos:
   - Crea registros en `PlayerGroupHistory` para cada jugador.
   - Genera registros de historial (`PlayerGroupHistory`) con la temporada, grupo final, ranking y tipo de movimiento.

### Persistencia Histórica
- Se guardan todos los resultados (incluso de jugadores sin partidos).
- Cada entrada incluye:
  - Jugador
  - Grupo de origen
  - Grupo de destino (si aplica)
  - Tipo de movimiento (PROMOTION, RELEGATION, STAY)
  - Posición final

## Temporada Siguiente (Regla D)
- La nueva temporada se crea a partir de la temporada actual sumando **n meses** (pendiente parametrizar).
- Ejemplo: `Ciclo 25-26/11-12` → `Ciclo 26-27/02-03` si n = 3 meses.
- **Pendiente documentar parámetros y flujo de creación**.

## Endpoints API

### POST `/api/seasons/:id/closure/preview`
- Genera (o regenera) el cierre PENDING aplicando las reglas de ascenso/descenso.
- Recalcula rankings de todos los grupos antes de generar el cierre.
- Devuelve el cierre con todas las entradas (jugadores, movimientos, posiciones).

### POST `/api/seasons/:id/closure/approve`
- Aprueba un cierre PENDING y lo marca como APPROVED.
- Aplica movimientos (crea registros en `PlayerGroupHistory`).
- Crea registros históricos (`PlayerGroupHistory`).
- Retorna el cierre aprobado con todas las entradas.

## Notas de Implementación
- La lógica de cierre está en `ranking.service.ts` → `computeSeasonClosure`.
- Los endpoints están en `season.routes.ts`.
- El esquema Prisma incluye:
  - `SeasonClosure` (registro de cierre, estado PENDING/APPROVED)
  - `SeasonClosureEntry` (entrada individual por jugador)
  - `PlayerGroupHistory` (historial de participaciones por temporada)
