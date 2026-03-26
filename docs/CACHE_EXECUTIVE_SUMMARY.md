# Sistema de Caché FreeLiga (Documento Unificado)

Este es el documento maestro de caché. Centraliza arquitectura, operación, panel admin, troubleshooting y cambios.

## Estado actual

| Aspecto | Estado |
|---------|--------|
| Cache implementado | Sí, en memoria de API |
| TTL público | 7 días |
| TTL privado (jugadores y grupo) | 24h |
| Service Worker | No necesario para este caso |
| Control admin | Panel con acciones granulares + historial |

## Arquitectura (3 niveles)

1. Navegador: caché del cliente (puede retener datos visuales)
2. API cache (principal): memoria en servidor (`public:*`, `private:*`)
3. Base de datos: fuente de verdad

Flujo: `Request -> API cache -> (si miss) DB -> set cache -> response`

## Qué ve cada perfil

| Perfil | Datos | Cache principal | TTL |
|--------|------|------------------|-----|
| Público | rankings/resumen/partidos públicos | `public:*` | 7 días |
| Jugador | grupo, clasificación, partidos | `private:*` + parte pública | 24h |
| Admin | estado de cache + invalidación | lectura/escritura admin | n/a |

## Invalidación automática al tocar partidos (privado)

Cuando se crea/edita/borra un partido (`/api/matches`) en un grupo activo:

- Se actualiza DB
- Se recalcula ranking del grupo
- Se invalidan claves privadas relacionadas al grupo activo:
  - `private:group:{groupId}:detail`
  - `private:classification:{seasonId}:{groupId}:*`
  - `private:player:{playerId}:*` (todos los jugadores del grupo activo)
- Se invalidan clasificaciones globales sin grupo:
  - `private:classification:{seasonId}:all:*`

Resultado: jugadores del grupo activo ven datos frescos en la siguiente carga.

## Caché pública semanal

- Las rutas `public:*` cachean por 7 días.
- No se invalidan automáticamente por partidos.
- Se invalidan manualmente desde `/admin/cache` cuando se requiere.

## Panel admin (`/admin/cache`)

### Acciones disponibles

- Recargar: solo lectura de estado actual
- Pública: invalida `public:*`
- Privada: invalida `private:*`
- Todo: invalida pública + privada
- Por key: invalida una clave específica
- Por patrón: invalida claves que coinciden con un patrón
- Por entidad: grupo, jugador o temporada (mapea a patrones)

### Registro visible

El panel muestra historial de invalidaciones (timestamp, scope, key/patrón, userId).

## Métricas y lectura rápida

| Métrica | Significado |
|---------|-------------|
| Hit Rate | % lecturas servidas desde caché |
| Hits | aciertos de cache |
| Misses | fallos de cache |
| Sets | escrituras en caché |
| Invalidations | borrados manuales/por patrón |
| Expirations | expiraciones por TTL |

## FAQ corta

### ¿Por qué todo sale a 0?
Normal si la temporada actual aún no tiene partidos jugados.

### ¿Hace falta Service Worker?
No, aquí priorizamos frescura de datos y ya existe caché server-side eficaz.

### ¿Qué pasa si reinicio la API?
Se vacía la caché en memoria y se regenera sola con nuevas peticiones.

## Troubleshooting

Si un usuario ve datos viejos:

1. Invalidar caché desde `/admin/cache` (según alcance)
2. Pedir hard refresh del navegador (`Ctrl+F5`)
3. Verificar temporada activa y partidos reales en DB

## Endpoints de cache (admin)

- `GET /api/public/cache/stats`
- `POST /api/public/cache/invalidate/admin` (public)
- `POST /api/public/cache/invalidate/private/admin` (private)
- `POST /api/public/cache/invalidate/all/admin` (public+private)
- `POST /api/public/cache/invalidate/key/:key` (key individual)
- `POST /api/public/cache/invalidate/pattern/:pattern` (patrón)

## Notas de gobierno

- Mantener este archivo como única referencia de caché
- Evitar duplicar información en otros `.md`
- Cuando cambie comportamiento de caché, actualizar aquí primero

---

Actualizado: 26 de marzo de 2026

