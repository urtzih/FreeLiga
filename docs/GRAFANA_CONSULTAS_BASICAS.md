# Consultas Básicas para Grafana Loki - FreeSquash

Este archivo contiene las consultas LogQL más útiles para explorar los logs de FreeSquash en Grafana.

## 📋 Cómo usar estas consultas

1. Abre Grafana: http://localhost:3000
2. Ve a **Explore** (icono de brújula en el menú izquierdo)
3. Selecciona datasource **Loki**
4. Copia y pega cualquiera de las consultas de abajo
5. Haz clic en **Run query**
6. Para guardar: haz clic en el icono de estrella ⭐ al lado del botón "Run query"

---

## 🔍 Consultas Básicas

### 1. Todos los logs
```logql
{job="freesquash-api"}
```
Ver todos los logs de la aplicación en tiempo real.

---

### 2. Solo errores (nivel 50)
```logql
{job="freesquash-api"} | json | level="50"
```
Filtrar únicamente logs de nivel ERROR.

---

### 3. Errores y warnings
```logql
{job="freesquash-api"} | json | level=~"40|50"
```
Ver warnings (40) y errores (50).

---

## 📊 Eventos de Negocio

### 4. Todos los eventos de negocio
```logql
{job="freesquash-api"} | json | type="business_event"
```
Ver todos los eventos importantes de la aplicación.

---

### 5. Partidos creados
```logql
{job="freesquash-api"} | json | event="match_created"
```
Específicamente eventos de creación de partidos.

---

### 6. Usuarios registrados
```logql
{job="freesquash-api"} | json | event="user_registered"
```
Eventos de registro de nuevos usuarios.

---

### 7. Cierres de grupo
```logql
{job="freesquash-api"} | json | event="group_closure"
```
Eventos de cierre de grupos y promociones.

---

## 🌐 Requests HTTP

### 8. Todos los requests HTTP
```logql
{job="freesquash-api"} | json | type="http_request"
```
Ver todas las peticiones HTTP con detalles.

---

### 9. Requests lentos (> 1 segundo)
```logql
{job="freesquash-api"} | json | type="http_request" | responseTime > 1000
```
Identificar requests que toman más de 1 segundo.

---

### 10. Errores HTTP (500+)
```logql
{job="freesquash-api"} | json | type="http_request" | statusCode >= 500
```
Requests que resultaron en errores del servidor.

---

### 11. Requests a endpoint específico
```logql
{job="freesquash-api"} | json | url =~ "/api/matches.*"
```
Filtrar por URL/endpoint específico.

---

## 🔐 Autenticación

### 12. Eventos de login/logout
```logql
{job="freesquash-api"} | json | action=~"login|logout"
```
Ver actividad de autenticación.

---

### 13. Logins exitosos
```logql
{job="freesquash-api"} | json | action="login" | level="30"
```
Solo logins exitosos (nivel info).

---

### 14. Intentos de login fallidos
```logql
{job="freesquash-api"} | json | action="login" | level=~"40|50"
```
Logins que fallaron (warnings o errores).

---

## 💾 Base de Datos

### 15. Operaciones de base de datos
```logql
{job="freesquash-api"} | json | type="database_operation"
```
Ver todas las operaciones con la BD.

---

### 16. Queries lentas (> 1 segundo)
```logql
{job="freesquash-api"} | json | type="slow_query"
```
Identificar queries que necesitan optimización.

---

## 📈 Métricas

### 17. Métricas registradas
```logql
{job="freesquash-api"} | json | type="metric"
```
Ver todas las métricas personalizadas.

---

### 18. Métricas de rendimiento
```logql
{job="freesquash-api"} | json | metric="response_time"
```
Específicamente métricas de tiempo de respuesta.

---

## 👤 Por Usuario

### 19. Actividad de usuario específico
```logql
{job="freesquash-api"} | json | userId="123"
```
Ver toda la actividad de un usuario (cambia "123" por el ID real).

---

### 20. Usuarios activos
```logql
{job="freesquash-api"} | json | userId != "" | type="http_request"
```
Requests de usuarios autenticados.

---

## ⏰ Búsquedas por Tiempo

### 21. Últimos 5 minutos
```logql
{job="freesquash-api"} [5m]
```
Agregar `[5m]` al final de cualquier consulta.

---

### 22. Última hora
```logql
{job="freesquash-api"} [1h]
```

---

### 23. Últimas 24 horas
```logql
{job="freesquash-api"} [24h]
```

---

## 📊 Agregaciones

### 24. Contar requests por minuto
```logql
rate({job="freesquash-api"} | json | type="http_request" [1m])
```
Usar en visualizaciones de gráficos.

---

### 25. Tasa de errores
```logql
sum(rate({job="freesquash-api"} | json | level="50" [5m])) / sum(rate({job="freesquash-api"} [5m]))
```
Porcentaje de errores sobre total de logs.

---

### 26. Top 10 endpoints más usados
```logql
topk(10, sum by (url) (rate({job="freesquash-api"} | json | type="http_request" [5m])))
```

---

### 27. Promedio de tiempo de respuesta
```logql
avg_over_time({job="freesquash-api"} | json | type="http_request" | unwrap responseTime [5m])
```

---

## 🔎 Búsquedas de Texto

### 28. Buscar palabra específica
```logql
{job="freesquash-api"} |= "palabra_a_buscar"
```
Buscar cualquier log que contenga el texto.

---

### 29. Excluir palabra
```logql
{job="freesquash-api"} != "palabra_a_excluir"
```

---

### 30. Expresión regular
```logql
{job="freesquash-api"} |~ "match|partido|game"
```
Buscar múltiples palabras con regex.

---

## 🎯 Consultas Avanzadas

### 31. Operaciones con duración
```logql
{job="freesquash-api"} | json | operation != "" | duration > 0
```
Ver operaciones con seguimiento de tiempo.

---

### 32. Errores con stack trace
```logql
{job="freesquash-api"} | json | level="50" | error != ""
```

---

### 33. Eventos por grupo
```logql
{job="freesquash-api"} | json | groupId != ""
```
Actividad relacionada con grupos específicos.

---

### 34. Métricas con etiquetas
```logql
{job="freesquash-api"} | json | type="metric" | tags != ""
```

---

### 35. Logs desde hace 1 hora con patrón
```logql
{job="freesquash-api"} [1h] | json | type="business_event" | event="match_created"
```

---

## 💡 Tips de Uso

1. **Combinar filtros**: Puedes encadenar múltiples filtros con `|`
   ```logql
   {job="freesquash-api"} | json | level="50" | userId="123"
   ```

2. **Case insensitive**: Usa `(?i)` en regex
   ```logql
   {job="freesquash-api"} |~ "(?i)error|warning"
   ```

3. **Guardar consultas**: Haz clic en la estrella ⭐ para guardar tus consultas favoritas

4. **Exportar logs**: Usa el botón "Inspector" para exportar resultados

5. **Live tail**: Activa el toggle "Live" en la parte superior derecha para ver logs en tiempo real

---

## 📝 Estructura de los Logs

Los logs tienen esta estructura JSON:
```json
{
  "level": 30,              // 30=info, 40=warn, 50=error, 60=fatal
  "time": "timestamp",
  "env": "development",
  "app": "freesquash-api",
  "type": "...",           // http_request, business_event, metric, etc
  "msg": "mensaje",
  // ... campos adicionales según el tipo
}
```

Campos comunes:
- `userId`: ID del usuario
- `requestId`: ID de la petición
- `operation`: Nombre de la operación
- `duration`: Duración en ms
- `statusCode`: Código HTTP
- `event`: Tipo de evento de negocio
- `error`: Detalles del error
