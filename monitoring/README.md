# 🚀 Sistema de Monitoreo FreeSquash - Integrado

## ✅ Estado Actual

El sistema de monitoreo está **completamente integrado** en `docker-compose.yml` y captura logs de:

### 📦 Contenedores Monitoreados (7 servicios)

1. **freeliga-mysql** - Base de datos MySQL
2. **freeliga-api** - Backend API Node.js (+ archivos de logs estructurados)
3. **freeliga-web** - Frontend React/Vite
4. **freesquash-grafana** - Dashboard de visualización
5. **freesquash-loki** - Agregador de logs
6. **freesquash-prometheus** - Métricas
7. **freesquash-promtail** - Recolector de logs

---

## ⚡ Inicio Rápido (1 comando)

### Iniciar TODO el sistema (app + monitoreo)
```bash
docker-compose up -d
```

### Ver estado
```bash
docker-compose ps
```

### Detener todo
```bash
docker-compose down
```

---

## 📊 URLs de Acceso

- **Grafana**: http://localhost:3000 (admin/freesquash2025)
- **Grafana Explore**: http://localhost:3000/explore
- **Dashboard**: http://localhost:3000/d/freesquash-overview
- **Loki API**: http://localhost:3100
- **Prometheus**: http://localhost:9090
- **API**: http://localhost:3001
- **Web**: http://localhost:4173

---

## 🔍 Consultas por Contenedor

Abre http://localhost:3000/explore y usa estas consultas:

### 1. API (logs estructurados JSON)
```logql
{job="freesquash-api"}
```

### 2. MySQL
```logql
{container_name="freeliga-mysql"}
```

### 3. Frontend Web
```logql
{container_name="freeliga-web"}
```

### 4. Todos los contenedores FreeSquash
```logql
{container_name=~"freeliga-.*|freesquash-.*"}
```

### 5. Solo errores de la API
```logql
{job="freesquash-api"} | json | level="50"
```

### 6. Eventos de negocio
```logql
{job="freesquash-api"} | json | type="business_event"
```

### 7. Requests HTTP
```logql
{job="freesquash-api"} | json | type="http_request"
```

---

## 📋 Etiquetas Disponibles

**Logs de Docker** (automáticos):
- `container_name` - freeliga-api, freeliga-mysql, freeliga-web, etc.
- `container_id` - ID único
- `image` - Imagen Docker
- `service` - Nombre del servicio

**Logs de API** (estructurados):
- `job` - freesquash-api
- `level` - 30 (info), 40 (warn), 50 (error), 60 (fatal)
- `type` - http_request, business_event, metric, error
- `operation`, `userId`, `matchId`, `groupId`

---

## 🎯 Generar Logs de Prueba

```bash
cd apps/api
npm run logs:demo
```

### Eventos de negocio:
```
{job="freesquash-api"} | json | type="business_event"
```

### Usuario específico:
```
{job="freesquash-api"} | json | userId="42"
```

## 🛠️ Comandos Útiles

```bash
# Ver estado de servicios
docker-compose -f docker-compose.monitoring.yml ps

# Ver logs de un servicio
docker logs freesquash-grafana
docker logs freesquash-loki
docker logs freesquash-promtail

# Reiniciar servicios
docker-compose -f docker-compose.monitoring.yml restart

# Parar servicios
docker-compose -f docker-compose.monitoring.yml down

# Parar y limpiar volúmenes
docker-compose -f docker-compose.monitoring.yml down -v
```

## 📚 Documentación Completa

Ver [MONITORING_GRAFANA_LOKI.md](../docs/MONITORING_GRAFANA_LOKI.md)
