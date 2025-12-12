# Docker Setup para Desarrollo Local

## Requisitos
- Docker Desktop instalado y ejecutándose
- Docker Compose (incluido en Docker Desktop)
- Git (para clonar/versionamiento)

## Inicio Rápido

### 1. Preparar ambiente local
```bash
# Copiar archivo de ambiente
cp .env.local.example .env.local

# Crear .gitignore local para archivos sensibles (opcional)
echo ".env.local" >> .gitignore
```

### 2. Iniciar Stack Completo
```bash
# Iniciar todos los servicios (MySQL + Backend + Frontend)
docker-compose up

# O en background
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f mysql
```

### 3. Acceder a la Aplicación
- **Frontend (Web)**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **MySQL**: localhost:3306 (usuario: freeliga, password: freeliga123)

## Operaciones Comunes

### Detener servicios
```bash
docker-compose down          # Apagar servicios
docker-compose down -v       # Apagar + eliminar volúmenes (resetea DB)
```

### Actualizar código
Los cambios en el código se reflejan automáticamente (hot reload) en:
- Backend: `apps/api/src/**/*.ts`
- Frontend: `apps/web/src/**/*.tsx` y `apps/web/index.html`

### Ejecutar migraciones/seed
```bash
# Dentro del contenedor del API
docker-compose exec api npm run db:generate
docker-compose exec api npx prisma db push
docker-compose exec api npx prisma db seed

# O conectarse al contenedor
docker-compose exec api sh
```

### Acceder a MySQL directamente
```bash
# Desde la máquina host
mysql -h localhost -u freeliga -p freeliga123 freeliga

# O dentro del contenedor
docker-compose exec mysql mysql -u freeliga -p freeliga123 freeliga
```

### Rebuild después de cambios en package.json
```bash
docker-compose down
docker-compose up --build
```

### Limpiar todo (reset total)
```bash
docker-compose down -v
rm -rf node_modules apps/*/node_modules packages/*/node_modules
docker-compose up
```

## Solución de Problemas

### "Port 3306 already in use"
```bash
# Ver qué está usando el puerto
lsof -i :3306      # macOS/Linux
netstat -ano | findstr :3306  # Windows

# O cambiar el puerto en docker-compose.yml
# Cambiar "3306:3306" a "3307:3306"
```

### "Docker daemon is not running"
- Iniciar Docker Desktop desde Aplicaciones

### Los cambios en el código no se reflejan
```bash
# Reconstruir imágenes
docker-compose up --build

# O eliminar y recrear
docker-compose down -v
docker-compose up
```

### Error de conexión a MySQL
```bash
# Verificar que MySQL está listo
docker-compose logs mysql

# Esperar 10-15 segundos después de `docker-compose up`
```

## Estructura de Servicios

```
┌─────────────────────────────────────┐
│       Frontend (Vite)               │
│     http://localhost:5173           │
│      (hot reload enabled)           │
└──────────────┬──────────────────────┘
               │ HTTP (CORS)
               │
┌──────────────▼──────────────────────┐
│       Backend API (Fastify)         │
│     http://localhost:3001           │
│     (hot reload via tsx watch)      │
└──────────────┬──────────────────────┘
               │ Prisma ORM
               │
┌──────────────▼──────────────────────┐
│      MySQL Database (8.0)           │
│     localhost:3306                  │
│   (volumen persistente)             │
└─────────────────────────────────────┘
```

## Variables de Ambiente

### Backend (.env.local)
- `NODE_ENV`: `development` (local) o `production`
- `PORT`: Puerto del API (3001 en desarrollo)
- `DATABASE_URL`: Conexión MySQL
- `JWT_SECRET`: Clave para firmar JWTs
- `FRONTEND_URL`: URL del frontend para CORS
- `ALLOWED_ORIGINS`: Origenes permitidos para CORS

### Frontend (vite.config.ts)
- `VITE_API_URL`: URL base del API backend

## Performance Notes

- Las imágenes Docker están optimizadas para desarrollo (incluyen dev dependencies)
- Los volúmenes montados permiten hot reload sin rebuilds
- MySQL usa volumen persistente (`mysql_data`) - los datos persisten entre `docker-compose down`
- Memoria recomendada: 2GB para Docker Desktop

## Próximos Pasos: Deploy a Producción

Ver [DEPLOYMENT.md] para:
- Railway (Backend con Dockerfile de producción)
- Vercel (Frontend estático)
- Configuración de CI/CD con GitHub Actions
