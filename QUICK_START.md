# Quick Start Guide - Docker Local Development

## 1️⃣ Instalación Inicial (primera vez)

```bash
# Clonar repo (si no está ya)
cd c:\xampp\htdocs\personal\FreeLiga

# Copiar archivo de ambiente
copy .env.local.example .env.local

# Iniciar todo (MySQL, API Backend, Web Frontend)
docker-compose up

# O en background
docker-compose up -d
```

**Espera 15-20 segundos** mientras MySQL se inicia y genera tablas.

## 2️⃣ Acceder a la App

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Base de datos**: localhost:3306 (usuario: `freeliga`, contraseña: `freeliga123`)

## 3️⃣ Desarrollo en Vivo

Los cambios se reflejan automáticamente:
- Edita archivos en `apps/api/src/` → se recompilan al instante
- Edita archivos en `apps/web/src/` → Vite recarga la página automáticamente

```bash
# Ver logs en tiempo real
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f mysql
```

## 4️⃣ Detener servicios

```bash
# Parar (guarda datos)
docker-compose down

# Parar y resetear BD completamente
docker-compose down -v
```

## 5️⃣ Solución de Problemas

### "Port already in use"
```bash
# PowerShell: Ver qué usa el puerto 3001
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Format-Table ProcessName

# Matar el proceso si es necesario
Stop-Process -Id <PID> -Force
```

### "MySQL no se conecta"
```bash
# Ver logs de MySQL
docker-compose logs mysql

# Esperar más tiempo (a veces tarda 30s)
# Reintentar después
docker-compose restart mysql
```

### Cambios en package.json no se aplican
```bash
# Reconstruir imágenes
docker-compose down
docker-compose up --build
```

### "Cannot find module" en backend
```bash
# Regenerar Prisma Client
docker-compose exec api npm run db:generate

# O dentro del contenedor
docker-compose exec api sh
cd packages/database
npx prisma generate
```

## 📊 Estructura

```
localhost:5173 (Frontend React)
    ↓ HTTP + CORS
localhost:3001/api/* (Backend Fastify)
    ↓ Prisma ORM
localhost:3306 (MySQL)
```

## 🚀 Próximos Pasos

Una vez que funcione localmente:
1. Push a GitHub
2. Deploy a Railway (backend)
3. Deploy a Vercel (frontend)

Ver [DOCKER_SETUP.md](DOCKER_SETUP.md) para instrucciones completas.
