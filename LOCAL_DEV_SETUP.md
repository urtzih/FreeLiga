# Local Development Setup (Sin Docker)
# Usa XAMPP MySQL existente

## Requisitos
- Node.js 20+
- MySQL corriendo (XAMPP)
- npm

## Pasos

### 1. Crear base de datos
```bash
# Conectar a MySQL
mysql -h localhost -u root

# En MySQL:
```sql
CREATE DATABASE IF NOT EXISTS freesquash CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```
```

### 2. Generar schema
```bash
cd apps/api
npx prisma db push
```

### 3. Seed data (opcional)
```bash
npx prisma db seed
```

### 4. Instalar dependencias (si no está hecho)
```bash
# En raíz del proyecto
npm install
```

### 5. Iniciar en desarrollo
```bash
# En raíz, desde la carpeta del proyecto
npm run dev

# Esto iniciará:
# - Backend API: http://localhost:3001 (tsx watch con hot reload)
# - Frontend: http://localhost:5173 (Vite con hot reload)
```

## Acceso

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- MySQL: localhost:3306 (usuario: root, sin contraseña)

## Logs

Los cambios en TypeScript se recompilan automáticamente.
Los cambios en React/Vite se reflejan al guardar.
