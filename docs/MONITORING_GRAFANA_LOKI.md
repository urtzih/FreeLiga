# 📊 Sistema de Monitoreo Completo con Grafana + Loki

## 🎯 ¿Qué se ha implementado?

### Sistema de Logging Mejorado

✅ **Logging HTTP Completo**
- Todas las requests con: método, URL, status code, duración, userId, IP
- Detección automática de requests lentas (>1s)
- Separación por nivel según status code (500=error, 400=warn, 200=info)

✅ **Logging de Base de Datos**
- CREATE, UPDATE, DELETE operations
- Detección de queries lentas
- Errores de BD con contexto completo
- Middleware de Prisma para logging automático

✅ **Logging de Autenticación y Autorización**
- Login exitoso/fallido
- Accesos a endpoints protegidos
- Intentos de acceso no autorizados

✅ **Tipos de Logs Capturados**
```typescript
- http_request_start       // Inicio de request
- http_request_complete    // Request completado
- http_error               // Error HTTP
- slow_request             // Request >1s
- auth_success             // Login exitoso
- auth_failure             // Login fallido
- protected_access         // Acceso a endpoint protegido
- authorization_denied     // Acceso denegado
- db_create                // Registro creado
- db_update                // Registro actualizado
- db_delete                // Registro eliminado
- slow_query               // Query >1s
- db_error                 // Error de BD
- business_event           // Eventos de negocio
- metric                   // Métricas personalizadas
```

## 🚀 Cómo Usar

### Opción 1: Solo Logs (Sin Grafana)

```bash
# Ejecutar API normalmente
cd apps/api
npm run dev

# Analizar logs
npm run logs:events
npm run logs:errors
npm run logs:performance
npm run logs:dashboard
```

### Opción 2: Con Grafana + Loki (RECOMENDADO)

#### 1. Iniciar el Stack de Monitoreo

```bash
# Iniciar Grafana + Loki + Promtail
docker-compose -f docker-compose.monitoring.yml up -d

# Verificar que todo está corriendo
docker-compose -f docker-compose.monitoring.yml ps
```

#### 2. Iniciar la Aplicación

```bash
# Opción A: Solo API
cd apps/api
npm run dev

# Opción B: Todo el stack (API + Web + DB + Monitoring)
docker-compose up -d
docker-compose -f docker-compose.monitoring.yml up -d
```

#### 3. Acceder a Grafana

1. Abrir http://localhost:3000
2. Login:
   - **Usuario**: `admin`
   - **Password**: `freesquash2025`

3. Configurar datasource (ya viene pre-configurado):
   - Ir a Configuration → Data Sources
   - Verificar que "Loki" está conectado

#### 4. Crear Dashboard

En Grafana:

**Panel 1: Logs en Tiempo Real**
```logql
{job="freesquash-api"} |= ``
```

**Panel 2: Errores**
```logql
{job="freesquash-api"} | json | level_name="ERROR"
```

**Panel 3: Requests HTTP por Status Code**
```logql
sum by (statusCode) (rate({job="freesquash-api"} | json | type="http_request_complete" [5m]))
```

**Panel 4: Requests Lentas**
```logql
{job="freesquash-api"} | json | type="slow_request"
```

**Panel 5: Top Endpoints**
```logql
topk(10, sum by (url) (count_over_time({job="freesquash-api"} | json | type="http_request_complete" [1h])))
```

**Panel 6: Autenticación**
```logql
{job="freesquash-api"} | json | type=~"auth_success|auth_failure"
```

**Panel 7: Performance de Operaciones**
```logql
{job="freesquash-api"} | json | duration > 0 | unwrap duration | avg_over_time({job="freesquash-api"}[5m])
```

**Panel 8: Errores de Base de Datos**
```logql
{job="freesquash-api"} | json | type=~"db_error|slow_query"
```

## 📊 Dashboards Pre-configurados

### Dashboard Principal FreeSquash

Crear dashboard con estos paneles:

#### Métricas Generales
- Total requests (última hora)
- Tasa de errores (%)
- Latencia promedio (ms)
- Usuarios activos

#### Gráficas
- Requests por minuto (timeline)
- Distribución de status codes (pie chart)
- Top 10 endpoints más usados (bar chart)
- Latencia por endpoint (heatmap)

#### Logs en Vivo
- Stream de logs en tiempo real
- Últimos errores
- Últimas autenticaciones
- Operaciones de BD recientes

#### Eventos de Negocio
- Partidos creados por hora
- Usuarios registrados
- Actualizaciones de rankings
- Eventos personalizados

## 🔍 Queries Útiles en Loki

### Búsquedas Básicas

```logql
# Todos los logs
{job="freesquash-api"}

# Solo errores
{job="freesquash-api"} | json | level_name="ERROR"

# Solo warnings
{job="freesquash-api"} | json | level_name="WARN"

# Requests HTTP
{job="freesquash-api"} | json | type="http_request_complete"

# Eventos de negocio
{job="freesquash-api"} | json | type="business_event"
```

### Filtros Avanzados

```logql
# Requests de un usuario específico
{job="freesquash-api"} | json | userId="42"

# Requests a un endpoint específico
{job="freesquash-api"} | json | url=~"/api/matches.*"

# Errores 500
{job="freesquash-api"} | json | statusCode="500"

# Requests lentas
{job="freesquash-api"} | json | responseTime > 1000

# Match específico
{job="freesquash-api"} | json | matchId="abc123"

# Búsqueda de texto
{job="freesquash-api"} |= "database connection"
```

### Agregaciones

```logql
# Contar errores por minuto
sum(rate({job="freesquash-api"} | json | level_name="ERROR" [1m]))

# Requests por status code
sum by (statusCode) (rate({job="freesquash-api"} | json | type="http_request_complete" [5m]))

# Latencia promedio
avg(avg_over_time({job="freesquash-api"} | json | unwrap responseTime [5m]))

# Top usuarios más activos
topk(10, sum by (userId) (count_over_time({job="freesquash-api"} | json | userId != "" [1h])))

# Eventos por tipo
sum by (event) (count_over_time({job="freesquash-api"} | json | type="business_event" [1h]))
```

## 🚨 Configurar Alertas

### En Grafana

1. Ir a Alerting → Alert Rules
2. Create Alert Rule

**Ejemplo: Tasa de Errores Alta**
```
Query: sum(rate({job="freesquash-api"} | json | level_name="ERROR" [5m]))
Condition: WHEN last() IS ABOVE 5
Evaluate every: 1m
For: 5m
```

**Ejemplo: Request Lenta**
```
Query: avg(avg_over_time({job="freesquash-api"} | json | unwrap responseTime [5m]))
Condition: WHEN last() IS ABOVE 2000
Evaluate every: 1m
```

### Canales de Notificación

Configurar en Grafana → Alerting → Contact Points:

- **Email**
- **Slack**
- **Discord**
- **Webhook**
- **Telegram**

## 📈 Métricas con Prometheus (Opcional)

Si necesitas métricas más avanzadas (contadores, histogramas):

```bash
# Instalar cliente de Prometheus
npm install prom-client
```

Ejemplo de uso:
```typescript
import { register, Counter, Histogram } from 'prom-client';

// Contador de requests
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Histograma de latencia
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code']
});

// Exponer métricas en /metrics
fastify.get('/metrics', async (request, reply) => {
  reply.type('text/plain');
  return register.metrics();
});
```

## 🎯 Ventajas del Stack Grafana + Loki

### vs Logs en Archivos
✅ Búsqueda en tiempo real  
✅ Visualización interactiva  
✅ Alertas automáticas  
✅ Retención configurable  
✅ No requiere parseo manual  

### vs ELK Stack
✅ Más ligero (menos recursos)  
✅ Más fácil de configurar  
✅ Diseñado para logs (no para búsqueda general)  
✅ Mejor integración con Kubernetes/Docker  

### vs Servicios Cloud (Datadog, Logtail)
✅ Gratis y open source  
✅ Sin vendor lock-in  
✅ Control total de datos  
✅ Sin límites de ingesta  

## 🔧 Troubleshooting

### Grafana no se conecta a Loki
```bash
# Verificar que Loki está corriendo
docker logs freesquash-loki

# Verificar conectividad
curl http://localhost:3100/ready
```

### No aparecen logs en Grafana
```bash
# Verificar Promtail
docker logs freesquash-promtail

# Verificar que hay logs
ls -la apps/api/logs/

# Reiniciar Promtail
docker-compose -f docker-compose.monitoring.yml restart promtail
```

### Logs no se rotan
```bash
# Verificar permisos en directorio logs
chmod 755 apps/api/logs
```

## 📚 Recursos Adicionales

- **Grafana Docs**: https://grafana.com/docs/
- **Loki Docs**: https://grafana.com/docs/loki/
- **LogQL Cheat Sheet**: https://grafana.com/docs/loki/latest/logql/
- **Dashboard Examples**: https://grafana.com/grafana/dashboards/

## 🎊 Siguiente Nivel

Una vez domines el stack básico, puedes añadir:

1. **Grafana Tempo** - Distributed tracing
2. **Grafana Mimir** - Long-term metrics storage
3. **Node Exporter** - Métricas del sistema (CPU, RAM, Disk)
4. **cAdvisor** - Métricas de contenedores Docker
5. **AlertManager** - Gestión avanzada de alertas

---

**Con este stack tienes un sistema de monitoreo profesional y completo! 🚀**
