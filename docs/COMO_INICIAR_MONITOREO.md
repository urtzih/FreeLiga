# ⚠️ Docker Desktop no está iniciado

Para probar el stack de monitoreo, necesitas:

## 1. Iniciar Docker Desktop

1. Abre Docker Desktop desde el menú inicio de Windows
2. Espera a que se inicie completamente (el icono dejará de girar)
3. Verifica que está corriendo ejecutando:
   ```powershell
   docker ps
   ```

## 2. Iniciar el Stack de Monitoreo

Una vez Docker esté corriendo:

```powershell
cd c:\xampp\htdocs\personal\FreeLiga
docker-compose -f docker-compose.monitoring.yml up -d
```

## 3. Verificar que los servicios están corriendo

```powershell
docker-compose -f docker-compose.monitoring.yml ps
```

Deberías ver:
- ✅ freesquash-grafana
- ✅ freesquash-loki
- ✅ freesquash-promtail
- ✅ freesquash-prometheus

## 4. Acceder a Grafana

1. Abre tu navegador
2. Ve a: http://localhost:3000
3. Login:
   - Usuario: `admin`
   - Password: `freesquash2025`

## 5. Iniciar la API (para generar logs)

En otra terminal:

```powershell
cd c:\xampp\htdocs\personal\FreeLiga\apps\api
npm run dev
```

## 6. Generar logs de prueba

```powershell
cd c:\xampp\htdocs\personal\FreeLiga\apps\api
npm run logs:demo
```

## 7. Ver logs en Grafana

1. En Grafana, ve a: **Explore** (icono de brújula en el menú lateral)
2. Selecciona datasource: **Loki**
3. Escribe la query:
   ```
   {job="freesquash-api"}
   ```
4. Click en **Run query**

¡Deberías ver tus logs en tiempo real! 🎉

## Troubleshooting

### Si Docker no inicia:
- Reinicia Windows
- Reinstala Docker Desktop
- Verifica que la virtualización está habilitada en la BIOS

### Si no aparecen logs en Grafana:
```powershell
# Verificar que Promtail está leyendo los logs
docker logs freesquash-promtail

# Reiniciar Promtail
docker-compose -f docker-compose.monitoring.yml restart promtail
```

### Para parar los servicios:
```powershell
docker-compose -f docker-compose.monitoring.yml down
```

### Para ver logs de los contenedores:
```powershell
docker-compose -f docker-compose.monitoring.yml logs -f
```
