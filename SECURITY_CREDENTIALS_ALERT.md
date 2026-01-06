# ⚠️ CREDENCIALES EXPUESTAS - ACCION INMEDIATA

## Problema:

Tu archivo `.env` contiene credenciales de PROD:

```
DATABASE_URL_PROD=mysql://root:HkwOvwLFXIpySTWoZEVaXPZhQZgPSDbo@metro.proxy.rlwy.net:26282/railway
```

**Si el repositorio es PUBLICO, CUALQUIERA puede acceder a tu BD.**

---

## Pasos a seguir AHORA:

### 1. Cambiar contraseña en Railway

1. Ve a Railway dashboard
2. Encuentra tu MySQL database
3. Regenera la contraseña
4. Copia la nueva contraseña

### 2. Actualizar .env localmente

```powershell
# Edita .env y reemplaza:
DATABASE_URL_PROD=mysql://root:NUEVA_CONTRASEÑA@metro.proxy.rlwy.net:26282/railway
```

### 3. Limpiar Git

```powershell
# Remover .env del repositorio
git rm --cached .env
git commit -m "Remove .env from git tracking"
git push

# Si quieres mantener un template:
# Copia .env a .env.example y borra las contraseñas
cp .env .env.example

# Edita .env.example:
# DATABASE_URL_PROD=mysql://root:PASSWORD_AQUI@metro.proxy.rlwy.net:26282/railway

git add .env.example
git commit -m "Add .env.example template"
git push
```

### 4. Verificar el historio

```powershell
# Si las credenciales estuvieron en GitHub, también limpiar historial:
git log --all --full-history -- .env
# Si aparecen commits anteriores, contactar admin para hacer force-push
```

---

## Crear .env.example

Archivo para que otros desarrolladores sepan que variables necesitan:

```
# Local Development Environment
NODE_ENV=development
PORT=3001
DATABASE_URL=mysql://freeliga:PASSWORD@mysql:3306/railway
DATABASE_URL_PROD=mysql://root:PASSWORD@metro.proxy.rlwy.net:26282/railway
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:4173
ALLOWED_ORIGINS=http://localhost:4173,http://localhost:3000
VITE_API_URL=http://localhost:3001
VITE_API_TIMEOUT=30000
VITE_API_URL_PROD=https://freesquashapi-production.up.railway.app
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=railway
MYSQL_USER=freeliga
MYSQL_PASSWORD=PASSWORD
```

---

## Gitignore correcto

Asegúrate de que `.gitignore` tenga:

```
# Environment variables
.env
.env.local
.env.*.local

# Backups (sensibles)
backups/
```

---

## Referencias

- [Github: Remove sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Railway: Regenerate credentials](https://railway.app/docs)
