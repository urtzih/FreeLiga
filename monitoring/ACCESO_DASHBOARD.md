# 🎯 Acceso Rápido al Dashboard FreeSquash

## 📊 Dashboard Pre-configurado

El dashboard "FreeSquash - Overview" está provisionado automáticamente.

### Cómo acceder:

1. **Abre Grafana**: http://localhost:3000
   - Usuario: `admin`
   - Contraseña: `freesquash2025`

2. **Buscar el Dashboard**:
   - **Opción A**: Haz clic en el icono de "Dashboards" (📊) en el menú lateral izquierdo
   - **Opción B**: Haz clic en el botón "Home" arriba a la izquierda y busca "FreeSquash"
   - **Opción C**: Acceso directo: http://localhost:3000/d/freesquash-overview

3. **Si no aparece**:
   - Verifica que los contenedores estén corriendo: `docker ps | grep freesquash`
   - Revisa los logs: `docker logs freesquash-grafana`
   - Reinicia Grafana: `docker-compose -f docker-compose.monitoring.yml restart grafana`

---

## 🔍 Consultas Guardadas para Explore

Como Grafana no permite guardar consultas de Explore mediante provisioning, aquí están las **10 consultas más útiles** listas para copiar y pegar:

### En Grafana Explore:
1. Ve a: http://localhost:3000/explore
2. Selecciona datasource: **Loki**
3. Copia y pega cualquiera de las consultas de abajo
4. Haz clic en **"Run query"**
5. Para guardar como favorita: Haz clic en el icono de **estrella ⭐** (arriba a la derecha)

---

### 📋 Top 10 Consultas Básicas

#### 1️⃣ Todos los logs
```logql
{job="freesquash-api"}
```

#### 2️⃣ Solo errores (nivel 50)
```logql
{job="freesquash-api"} | json | level="50"
```

#### 3️⃣ Errores y warnings
```logql
{job="freesquash-api"} | json | level=~"40|50"
```

#### 4️⃣ Eventos de negocio
```logql
{job="freesquash-api"} | json | type="business_event"
```

#### 5️⃣ Requests HTTP
```logql
{job="freesquash-api"} | json | type="http_request"
```

#### 6️⃣ Requests lentos (> 1 segundo)
```logql
{job="freesquash-api"} | json | type="http_request" | responseTime > 1000
```

#### 7️⃣ Partidos creados
```logql
{job="freesquash-api"} | json | event="match_created"
```

#### 8️⃣ Usuarios registrados
```logql
{job="freesquash-api"} | json | event="user_registered"
```

#### 9️⃣ Eventos de autenticación
```logql
{job="freesquash-api"} | json | action=~"login|logout"
```

#### 🔟 Tasa de errores (%)
```logql
sum(rate({job="freesquash-api"} | json | level="50" [5m])) / sum(rate({job="freesquash-api"} [5m]))
```

---

## 🎨 Cómo guardar consultas en Explore

1. Pega una consulta en el editor de Explore
2. Haz clic en **"Run query"** para verificar que funciona
3. Haz clic en el **icono de estrella ⭐** en la parte superior derecha
4. Dale un nombre descriptivo (ej: "Errores últimas 24h")
5. La consulta aparecerá en **"Starred"** en tu perfil

---

## 📚 Más Consultas

Para ver **35+ consultas avanzadas** con explicaciones detalladas, consulta:
- **Documento completo**: `docs/GRAFANA_CONSULTAS_BASICAS.md`
- **Export JSON**: `monitoring/grafana_queries_export.json`

---

## 🔧 Troubleshooting

### El dashboard no aparece:
```bash
# Verificar contenedores
docker ps | grep freesquash

# Ver logs de Grafana
docker logs freesquash-grafana --tail 50

# Reiniciar Grafana
cd c:\xampp\htdocs\personal\FreeLiga
docker-compose -f docker-compose.monitoring.yml restart grafana
```

### No hay datos en los paneles:
```bash
# Generar logs de ejemplo
cd c:\xampp\htdocs\personal\FreeLiga\apps\api
npm run logs:demo

# Iniciar la API para generar logs reales
npm run dev
```

### Verificar que Promtail está recolectando logs:
```bash
# Ver logs de Promtail
docker logs freesquash-promtail --tail 20

# Ver targets activos
# http://localhost:3000/explore
# Query: {job="freesquash-api"} [5m]
```

---

## 🚀 Siguiente Paso

Abre Grafana y explora los datos:
```
http://localhost:3000
```

Usuario: `admin`  
Password: `freesquash2025`
