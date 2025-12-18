# 🔍 Ejemplos de Consultas Útiles para Logs

## Usando los comandos NPM

### 1. Análisis General
```bash
# Ver todos los eventos de negocio
npm run logs:events

# Ver todos los errores
npm run logs:errors

# Ver métricas de performance
npm run logs:performance

# Ver actividad de usuarios
npm run logs:users

# Ver timeline de actividad
npm run logs:timeline
```

### 2. Consultas Filtradas
```bash
# Solo errores, últimos 50
npm run logs:query -- --level error --limit 50

# Solo eventos de negocio, últimos 100
npm run logs:query -- --type business_event --limit 100

# Evento específico
npm run logs:query -- --event match_created --limit 20

# Logs de nivel warning o superior
npm run logs:query -- --level warn --limit 100
```

### 3. Dashboard Visual
```bash
# Generar dashboard HTML con gráficas
npm run logs:dashboard

# Luego abrir en navegador:
# apps/api/logs/dashboard.html
```

## Usando jq (Linux/Mac/WSL)

### Conteo y Agrupación
```bash
# Contar eventos por tipo
cat apps/api/logs/app.log | jq -r '.type' | sort | uniq -c

# Contar por nivel de log
cat apps/api/logs/app.log | jq -r '.level' | sort | uniq -c

# Top 10 usuarios más activos
cat apps/api/logs/app.log | jq -r 'select(.userId) | .userId' | sort | uniq -c | sort -rn | head -10

# Eventos de negocio por tipo
cat apps/api/logs/app.log | jq -r 'select(.type=="business_event") | .event' | sort | uniq -c
```

### Filtrado por Condiciones
```bash
# Solo errores (level >= 50)
cat apps/api/logs/app.log | jq 'select(.level >= 50)'

# Operaciones que tardaron más de 500ms
cat apps/api/logs/app.log | jq 'select(.duration > 500)'

# Logs de un usuario específico
cat apps/api/logs/app.log | jq 'select(.userId == 42)'

# Logs de un grupo específico
cat apps/api/logs/app.log | jq 'select(.groupId == "group-A")'

# Logs de hoy
cat apps/api/logs/app.log | jq --arg today "$(date +%Y-%m-%d)" 'select(.time | startswith($today))'
```

### Extracción de Datos
```bash
# Listar todos los matchIds únicos
cat apps/api/logs/app.log | jq -r 'select(.matchId) | .matchId' | sort -u

# Listar errores únicos con su mensaje
cat apps/api/logs/app.log | jq 'select(.level >= 50) | {time, msg, error: .error.message}'

# Duración promedio de operaciones
cat apps/api/logs/app.log | jq 'select(.duration) | {operation, duration}'

# Partidos creados hoy
cat apps/api/logs/app.log | jq 'select(.event == "match_created") | {time, player1, player2, score}'
```

### Análisis de Errores
```bash
# Errores con stack trace completo
cat apps/api/logs/app.log | jq 'select(.level >= 50) | {time, msg, error}'

# Top errores más frecuentes
cat apps/api/logs/app.log | jq -r 'select(.level >= 50) | .error.message // .msg' | sort | uniq -c | sort -rn

# Errores por usuario
cat apps/api/logs/app.log | jq 'select(.level >= 50 and .userId) | {userId, error: .error.message // .msg}'
```

### Timeline y Tendencias
```bash
# Eventos por hora
cat apps/api/logs/app.log | jq -r '.time | .[0:13]' | uniq -c

# Actividad por día
cat apps/api/logs/app.log | jq -r '.time | .[0:10]' | uniq -c

# Requests HTTP por endpoint
cat apps/api/logs/app.log | jq -r 'select(.type == "http_request") | .url' | sort | uniq -c | sort -rn
```

## Usando PowerShell (Windows)

### Lectura Básica
```powershell
# Ver últimas 100 líneas
Get-Content apps/api/logs/app.log -Tail 100

# Seguir logs en tiempo real
Get-Content apps/api/logs/app.log -Wait -Tail 50

# Solo errores
Get-Content apps/api/logs/error.log
```

### Con ConvertFrom-Json
```powershell
# Parsear JSON y filtrar errores
Get-Content apps/api/logs/app.log | 
    ForEach-Object { $_ | ConvertFrom-Json } | 
    Where-Object { $_.level -ge 50 }

# Contar eventos por tipo
Get-Content apps/api/logs/app.log | 
    ForEach-Object { $_ | ConvertFrom-Json } | 
    Group-Object -Property type | 
    Select-Object Name, Count

# Top usuarios
Get-Content apps/api/logs/app.log | 
    ForEach-Object { $_ | ConvertFrom-Json } | 
    Where-Object { $_.userId } | 
    Group-Object -Property userId | 
    Sort-Object Count -Descending | 
    Select-Object Name, Count -First 10
```

## Consultas Programáticas (TypeScript)

### Ejemplos de Uso de LogAnalyzer
```typescript
import { LogAnalyzer } from './apps/api/src/scripts/analyze-logs';

const analyzer = new LogAnalyzer();

// Errores de las últimas 24 horas
const recentErrors = await analyzer.query({
  level: 'error',
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  limit: 1000
});

// Eventos de un usuario específico
const userEvents = await analyzer.query({
  userId: 42,
  type: 'business_event',
  limit: 100
});

// Performance de operaciones lentas
const slowOps = await analyzer.query({
  startDate: '2025-12-01',
  endDate: '2025-12-31'
});

// Filtrar operaciones que tardaron más de 1 segundo
const verySlowOps = slowOps.filter(log => 
  log.duration && log.duration > 1000
);
```

## Consultas para Análisis de Negocio

### Actividad de Partidos
```bash
# Total de partidos creados
cat apps/api/logs/app.log | jq 'select(.event == "match_created")' | wc -l

# Partidos por grupo
cat apps/api/logs/app.log | jq -r 'select(.event == "match_created") | .groupId' | sort | uniq -c

# Distribución de scores
cat apps/api/logs/app.log | jq -r 'select(.event == "match_created") | .score' | sort | uniq -c
```

### Actividad de Usuarios
```bash
# Usuarios únicos activos
cat apps/api/logs/app.log | jq -r 'select(.userId) | .userId' | sort -u | wc -l

# Eventos por usuario (top 10)
cat apps/api/logs/app.log | jq -r 'select(.userId) | .userId' | sort | uniq -c | sort -rn | head -10

# Actividad por hora del día
cat apps/api/logs/app.log | jq -r '.time | .[11:13]' | sort | uniq -c
```

### Performance
```bash
# Operaciones más lentas (top 20)
cat apps/api/logs/app.log | jq 'select(.duration) | {operation, duration}' | jq -s 'sort_by(.duration) | reverse | .[0:20]'

# Duración promedio por operación
cat apps/api/logs/app.log | jq 'select(.operation) | {operation, duration}' | jq -s 'group_by(.operation) | map({operation: .[0].operation, avg: (map(.duration) | add / length)})'
```

## Alertas Automatizadas

### Script de Monitoreo
```bash
#!/bin/bash
# monitor.sh - Chequeo cada 5 minutos

while true; do
  # Contar errores en última hora
  errors=$(find apps/api/logs -name "error.log" -mmin -60 -exec cat {} \; | wc -l)
  
  if [ $errors -gt 10 ]; then
    echo "⚠️  ALERTA: $errors errores en la última hora" | mail -s "FreeSquash Alert" admin@freesquash.com
  fi
  
  sleep 300
done
```

### PowerShell Monitor
```powershell
# monitor.ps1 - Ejecutar cada 5 minutos

while ($true) {
    $errors = Get-Content apps/api/logs/error.log -Tail 1000 | 
        ForEach-Object { $_ | ConvertFrom-Json } |
        Where-Object { 
            $_.time -gt (Get-Date).AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ss")
        }
    
    if ($errors.Count -gt 10) {
        Write-Host "⚠️  ALERTA: $($errors.Count) errores en la última hora"
        # Enviar email, Slack, etc.
    }
    
    Start-Sleep -Seconds 300
}
```

## Exportar para Análisis Externo

### CSV Export
```bash
# Exportar eventos a CSV
cat apps/api/logs/app.log | jq -r 'select(.type == "business_event") | [.time, .event, .userId, .matchId] | @csv' > events.csv

# Exportar errores a CSV
cat apps/api/logs/app.log | jq -r 'select(.level >= 50) | [.time, .msg, .userId] | @csv' > errors.csv
```

### JSON Export Filtrado
```bash
# Solo logs de hoy
cat apps/api/logs/app.log | jq "select(.time | startswith(\"$(date +%Y-%m-%d)\"))" > today.json

# Solo eventos de negocio
cat apps/api/logs/app.log | jq 'select(.type == "business_event")' > business_events.json
```

## Tips y Trucos

### 1. Watch en Tiempo Real
```bash
# Linux/Mac
tail -f apps/api/logs/app.log | jq

# Windows PowerShell
Get-Content apps/api/logs/app.log -Wait -Tail 20
```

### 2. Buscar Texto Específico
```bash
# Buscar por mensaje
grep "Match created" apps/api/logs/app.log | jq

# Buscar por ID
grep "match-001" apps/api/logs/app.log | jq
```

### 3. Combinar con Grep
```bash
# Solo logs de un usuario
grep '"userId":42' apps/api/logs/app.log | jq

# Solo errores
grep '"level":50' apps/api/logs/app.log | jq
```

### 4. Estadísticas Rápidas
```bash
# Total de líneas (logs)
wc -l apps/api/logs/app.log

# Tamaño del archivo
du -h apps/api/logs/app.log

# Logs por día
ls -lh apps/api/logs/
```

## Recursos Adicionales

- **jq Manual**: https://stedolan.github.io/jq/manual/
- **PowerShell JSON**: https://docs.microsoft.com/powershell/module/microsoft.powershell.utility/convertfrom-json
- **Pino Docs**: https://getpino.io/
