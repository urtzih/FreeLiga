# 🔍 Consultas Guardadas para Grafana Explore - FreeSquash

## Instrucciones para Guardar en Explore

1. Abre Grafana Explore: http://localhost:3000/explore
2. Selecciona datasource: **Loki**
3. Copia una consulta de abajo y pégala
4. Haz clic en **"Run query"**
5. Para guardarla: Haz clic en el icono de **estrella ⭐** (esquina superior derecha)
6. Dale un nombre descriptivo

---

## 📊 CONSULTAS PRINCIPALES - API

### 1. 📋 Todos los logs de la API
```logql
{job="freesquash-api"}
```
**Guardar como:** "API - Todos los logs"

---

### 2. 🔴 Solo errores (nivel 50)
```logql
{job="freesquash-api"} | json | level="50"
```
**Guardar como:** "API - Solo errores"

---

### 3. ⚠️ Errores y warnings
```logql
{job="freesquash-api"} | json | level=~"40|50"
```
**Guardar como:** "API - Errores y warnings"

---

### 4. 📊 Eventos de negocio
```logql
{job="freesquash-api"} | json | type="business_event"
```
**Guardar como:** "API - Eventos de negocio"

---

### 5. 🌐 Requests HTTP
```logql
{job="freesquash-api"} | json | type="http_request"
```
**Guardar como:** "API - Requests HTTP"

---

### 6. 🏁 Partidos creados
```logql
{job="freesquash-api"} | json | event="match_created"
```
**Guardar como:** "API - Partidos creados"

---

### 7. 👤 Usuarios registrados
```logql
{job="freesquash-api"} | json | event="user_registered"
```
**Guardar como:** "API - Usuarios registrados"

---

### 8. 🔐 Autenticación
```logql
{job="freesquash-api"} | json | action=~"login|logout"
```
**Guardar como:** "API - Autenticación"

---

### 9. 📈 Métricas personalizadas
```logql
{job="freesquash-api"} | json | type="metric"
```
**Guardar como:** "API - Métricas"

---

### 10. ⏱️ Operaciones con duración
```logql
{job="freesquash-api"} | json | operation!="" | duration > 0
```
**Guardar como:** "API - Operaciones con tiempo"

---

## 🐳 CONSULTAS CONTENEDORES DOCKER

### 11. 🗄️ MySQL logs
```logql
{container_name="freeliga-mysql"}
```
**Guardar como:** "MySQL - Logs"

---

### 12. 🌐 Frontend logs
```logql
{container_name="freeliga-web"}
```
**Guardar como:** "Web - Logs"

---

### 13. 📊 Grafana logs
```logql
{container_name="freesquash-grafana"}
```
**Guardar como:** "Grafana - Logs"

---

### 14. 🔍 Todos los contenedores
```logql
{container_name=~"freeliga-.*|freesquash-.*"}
```
**Guardar como:** "Todos los contenedores"

---

### 15. 🔴 Errores en cualquier contenedor
```logql
{container_name=~"freeliga-.*|freesquash-.*"} |~ "(?i)error|exception|fatal"
```
**Guardar como:** "Todos - Errores"

---

## 🎯 CONSULTAS AVANZADAS

### 16. 📊 Tasa de logs por minuto
```logql
sum(rate({job="freesquash-api"} [1m]))
```
**Guardar como:** "API - Tasa de logs/min"

---

### 17. 📈 Distribución de niveles
```logql
sum by (level) (count_over_time({job="freesquash-api"} | json [1h]))
```
**Guardar como:** "API - Distribución niveles"

---

### 18. 👥 Usuarios activos (última hora)
```logql
count(count_over_time({job="freesquash-api"} | json | userId!="" [1h]) by (userId))
```
**Guardar como:** "API - Usuarios activos"

---

### 19. 🔍 Buscar texto específico
```logql
{job="freesquash-api"} |~ "match|partido"
```
**Guardar como:** "API - Buscar texto"

---

### 20. 📉 Solo últimos 5 minutos
```logql
{job="freesquash-api"} [5m]
```
**Guardar como:** "API - Últimos 5 min"

---

## 💡 TIPS

### Combinar filtros
```logql
{job="freesquash-api"} | json | level="50" | type="error" | userId="123"
```

### Case insensitive
```logql
{job="freesquash-api"} |~ "(?i)error|warning"
```

### Excluir texto
```logql
{job="freesquash-api"} != "health check"
```

### Unwrap (extraer valores numéricos)
```logql
avg_over_time({job="freesquash-api"} | json | unwrap duration [5m])
```

---

## 📱 Acceso Rápido

- **Explore**: http://localhost:3000/explore
- **Dashboard**: http://localhost:3000/d/freesquash-overview
- **Home**: http://localhost:3000

---

## ✨ Después de Guardar

Tus consultas guardadas aparecerán en:
- Menú "Starred" en Explore
- Historial de consultas
- Puedes exportarlas desde tu perfil de usuario
