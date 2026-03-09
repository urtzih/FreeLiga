# 📊 Sistema de Caché FreeLiga (Documento Unificado)

Este es el documento maestro de caché. Desde hoy centraliza arquitectura, operación, panel admin, troubleshooting y cambios.

## ✅ Estado actual

| Aspecto | Estado |
|---------|--------|
| Cache implementado | ✅ Sí, en memoria de API |
| TTL público | ✅ 24h |
| TTL privado (jugadores) | ✅ 5-30 min |
| Service Worker | ❌ No necesario para este caso |
| Control admin | ✅ Panel completo con acciones granulares |

## 🧱 Arquitectura (3 niveles)

1. Navegador: cache del cliente (puede retener datos visuales)
2. API cache (principal): memoria en servidor (`public:*`, `private:*`)
3. Base de datos: fuente de verdad

Flujo: `Request -> API cache -> (si miss) DB -> set cache -> response`

## 👥 Qué ve cada perfil

| Perfil | Datos | Cache principal | TTL |
|--------|------|------------------|-----|
| Público | rankings/resumen/partidos públicos | `public:*` | 24h |
| Jugador | grupo, clasificación, partidos | `private:*` + parte pública | 5-30 min |
| Admin | estado de cache + invalidación | lectura/escritura admin | n/a |

## 🔄 Invalidación automática al tocar partidos

Cuando se crea/edita/borra un partido (`/api/matches`):

- Se actualiza DB
- Se recalcula ranking del grupo
- Se invalidan claves relacionadas:
  - `public:recent-matches`
  - `public:groups-summary`
  - `public:stats`
  - `public:group:{groupId}:classification*`
  - `private:group:{groupId}:detail`
  - `private:classification:*`

Resultado: jugadores y público ven datos frescos en la siguiente carga.

## 🛠️ Panel admin (`/admin/cache`)

### Acciones disponibles

- `🔄 Recargar`: solo lectura de estado actual
- `🗑️ Pública`: invalida `public:*`
- `🧹 Privada`: invalida `private:*`
- `💥 Todo`: invalida pública + privada
- `🗑️` por fila: invalida una key específica

### Registro visible

El panel muestra `Última invalidación` junto a los botones (fecha/hora + scope: public/private/all).

## 📈 Métricas y lectura rápida

| Métrica | Significado |
|---------|-------------|
| Hit Rate | % lecturas servidas desde cache |
| Hits | aciertos de cache |
| Misses | fallos de cache |
| Sets | escrituras en cache |
| Invalidations | borrados manuales/por patrón |
| Expirations | expiraciones por TTL |

## ❓ FAQ corta

### “¿Por qué todo sale a 0?”
Normal si la temporada actual aún no tiene partidos jugados.

### “¿Hace falta Service Worker?”
No, porque aquí priorizamos frescura de datos y ya existe cache server-side eficaz.

### “¿Qué pasa si reinicio la API?”
Se vacía la cache en memoria y se regenera sola con nuevas peticiones.

## 🧯 Troubleshooting

Si un usuario ve datos viejos:

1. Invalidar caché desde `/admin/cache` (según alcance)
2. Pedir hard refresh del navegador (`Ctrl+F5`)
3. Verificar temporada activa y partidos reales en DB

## 🔗 Endpoints de cache (admin)

- `GET /api/public/cache/stats`
- `POST /api/public/cache/invalidate/admin` (public)
- `POST /api/public/cache/invalidate/private/admin` (private)
- `POST /api/public/cache/invalidate/all/admin` (public+private)
- `POST /api/public/cache/invalidate/key/:key` (key individual)

## 📝 Notas de gobierno

- Mantener este archivo como única referencia de caché
- Evitar duplicar información en otros `.md`
- Cuando cambie comportamiento de cache, actualizar aquí primero

---

Actualizado: 4 de marzo de 2026
