# 🚀 Guía de Despliegue en Producción: Railway + Vercel

Guía completa para desplegar **FreeSquash League** a producción utilizando **Railway** (para el Backend y Base de Datos) y **Vercel** (para el Frontend).

---

## 📋 Prerrequisitos

- Cuenta de GitHub con el repositorio de FreeLiga subido.
- Cuenta en Railway ([railway.app](https://railway.app)).
- Cuenta en Vercel ([vercel.com](https://vercel.com)).

---

## 🔧 Despliegue del Backend (Railway)

### Paso 1: Crear Proyecto en Railway

1. Ve a [railway.app](https://railway.app) e inicia sesión con GitHub.
2. Crea un nuevo proyecto: **Dashboard → New Project**.
3. Selecciona **Deploy from GitHub Repo**.
4. Elige el repositorio **FreeLiga**.
5. **IMPORTANTE**: Railway intentará detectar múltiples aplicaciones.
   - Si te pregunta qué carpetas desplegar, selecciona solo la raíz o asegúrate de que luego configuraremos solo el backend.
   - Si crea automáticamente servicios para `apps/web` y `apps/api`, puedes **borrar el servicio `web`** más tarde, ya que usaremos Vercel para eso.

### Paso 2: Añadir Base de Datos MySQL

1. En el Dashboard de tu proyecto en Railway, haz clic en el botón **New (Nuevo)** o haz clic derecho en el lienzo.
2. Selecciona **Database → MySQL**.
3. Railway creará un servicio de MySQL. Espera a que esté en verde (Online).
4. Este servicio generará automáticamente variables como `DATABASE_URL`.


### Paso 3: Configurar Variables de Entorno (CRUCIAL)

**⚠️ IMPORTANTE**: Si el despliegue falla la primera vez, es normal. Necesitamos configurar las variables **ANTES** de que el servidor pueda arrancar correctamente.

1. Haz clic en tu servicio del repositorio (ej. `@freesquash/api` o `FreeLiga`).
2. Ve a la pestaña **Variables**.
3. Añade las siguientes variables (puedes usar el botón "Raw Editor" para pegar varias a la vez):

```env
# Conexión a Base de Datos
# Railway suele autocompletar esto si escribes "${{MySQL.DATABASE_URL}}"
# O puedes copiar el valor de la pestaña "Variables" del servicio MySQL.
DATABASE_URL=${{MySQL.DATABASE_URL}}

# Secreto para autenticación JWT
# Escribe una cadena larga y aleatoria
JWT_SECRET=tu-secreto-super-seguro-minimo-32-caracteres

# URL del Frontend (Vercel)
# Por ahora pon una temporal, luego volveremos a actualizarla cuando tengamos la de Vercel
FRONTEND_URL=https://tu-dominio-en-vercel.vercel.app

# Orígenes CORS permitidos
ALLOWED_ORIGINS=https://tu-dominio-en-vercel.vercel.app

# Entorno
NODE_ENV=production
PORT=3001
```

> **Nota sobre `DATABASE_URL`**: En Railway, puedes referenciar variables de otros servicios. Si escribes `${{MySQL.DATABASE_URL}}`, Railway cogerá automáticamente la URL de tu servicio MySQL dentro del mismo proyecto. ¡Es la forma recomendada!

### Paso 4: Configurar Ajustes de Despliegue

Ve a **Settings (Configuración)** del servicio API y verifica/configura:

**Build (Construcción):**
- **Builder**: Dockerfile
- **Dockerfile Path**: `./Dockerfile`
- **Custom Build Command**: `npm run build --workspace=@freesquash/api`
- **Watch Paths**: `/apps/api/**` (para redesplegar solo cuando cambien archivos del backend)

**Deploy (Despliegue):**
- **Custom Start Command**: `node apps/api/dist/server.js`

**Networking (Redes):**
1. Ve a la sección **Public Networking**
2. Click en **Generate Domain** ⚠️ **OBLIGATORIO**
3. Railway generará una URL como: `https://freesquashapi-production.up.railway.app`
4. **Guarda esta URL** - la necesitarás para configurar Vercel

**Healthcheck:**
- **Healthcheck Path**: `/health` (asegura que Railway espera a que el servidor esté listo antes de marcar el deploy como exitoso)

**Resource Limits (Opcional):**
- CPU: 2 vCPU (máximo del plan Hobby)
- Memory: 1 GB (máximo del plan Hobby)

### Paso 5: Verificar Deployment

1. Ve a la pestaña **Deployments**.
2. El deployment debería estar en progreso o completado.
3. Haz clic en el deployment más reciente para ver los **Logs**.
4. Busca en los logs: `"Server listening on port 3001"` o `"🚀 Server running on http://0.0.0.0:3001"`

Si el deployment falla, verifica:
- Variables de entorno configuradas correctamente
- Logs del build (errores de compilación TypeScript)
- Logs del runtime (errores de conexión a BD)

### Paso 6: Probar el Backend

Una vez desplegado exitosamente (ícono verde ✅):

1. Copia la URL pública generada (de Networking → Public Domain)
2. Prueba el healthcheck en tu navegador:
   ```
   https://freesquashapi-production.up.railway.app/health
   ```
   Deberías ver: `{"status":"ok","timestamp":"..."}`

3. Prueba la documentación Swagger:
   ```
   https://freesquashapi-production.up.railway.app/documentation
   ```

---

## 🌐 Despliegue del Frontend (Vercel)

### Paso 1: Importar Proyecto en Vercel

1. Ve a [vercel.com](https://vercel.com) → **Add New** → **Project**.
2. Importa el repositorio **FreeLiga**.

### Paso 2: Configurar Build

Vercel detectará que es un proyecto Vite, pero como es un **monorepo**, debes configurar manualmente:

1. **Framework Preset**: Vite (se autodetecta)
2. **Root Directory**: 
   - Haz clic en **Edit** junto a Root Directory
   - Selecciona `apps/web` (⚠️ muy importante para monorepos)
3. **Build Settings**:
   - **Build Command**: Déjalo en `npm run build` (Vercel añade automáticamente el workspace correcto al detectar la raíz)
   - **Output Directory**: `dist` (por defecto de Vite)
   - **Install Command**: `npm install --prefix=../..` (recomendado por Vercel para monorepos)
      - Alternativa: `npm ci --prefix=../..` para instalaciones reproducibles
      - Si usas `pnpm`, Vercel suele autodetectarlo; puedes dejar este campo vacío para que use la detección automática

**ANTES de hacer el primer deploy**, configura las variables de entorno:

1. En la pantalla de configuración de Vercel, busca **Environment Variables**
2. Añade la siguiente variable (aplica a **Production, Preview, Development**):

```env
VITE_API_URL=https://freesquashapi-production.up.railway.app
```

**Importante:**
- Pega la URL **exacta** que generaste en Railway (Paso 6 del Backend)
- **NO incluyas barra final** (no uses `/` al final de la URL)
- Ejemplo correcto: `https://freesquashapi-production.up.railway.app`
- Ejemplo incorrecto: ~~`https://freesquashapi-production.up.railway.app/`~~
- ✅ **URL confirmada funcionando**: `https://freesquashapi-production.up.railway.app`

**Si olvidaste añadirla antes del deploy:**
1. Revisa la configuración final (Root Directory = `apps/web`, variables añadidas)
2. Haz clic en **Deploy**
3. Espera a que termine el build (2-3 minutos)
4. Vercel te mostrará una URL de producción cuando termine
CORS en Railway (CRUCIAL)

Ahora que tienes la URL final de Vercel, **DEBES** actualizar el backend para permitir peticiones desde el frontend:

1. Vuelve a **Railway** → Servicio API → **Variables**
2. Actualiza estas dos variables con tu URL **real** de Vercel:
   ```env
   FRONTEND_URL=https://free-liga-1rowpktnc-urtzihs-projects.vercel.app
   ALLOWED_ORIGINS=https://free-liga-1rowpktnc-urtzihs-projects.vercel.app
   ```
3. Railway reiniciará el backend automáticamente (30 segundos aprox.)

**⚠️ Sin esto, el frontend mostrará errores CORS y no podrá comunicarse con el backend.**

### Paso 6: Verificar Integración Completa

1. Abre tu frontend en Vercel: `https://tu-proyecto.vercel.app`
2. Intenta hacer login:
   - Email: `admin@freesquash.com`
   - Password: `123456`
3. Si el login funciona, ¡enhorabuena! 🎉 El despliegue está completo.

**Si el login falla:**
- Abre **DevTools** (F12) → **Console** y **Network**
- Busca errores CORS (verifica `ALLOWED_ORIGINS` en Railway)
- Verifica que `VITE_API_URL` en Vercel apunte a la URL correcta de Railway
- Prueba el endpoint directamente: `https://freesquashapi-production.up.railway.app/api/auth/login`
```env
VITE_API_URL=https://freesquashapi-production.up.railway.app
```

*✅ URL confirmada funcionando (healthcheck OK)*

### Paso 4: Desplegar

Haz clic en **Deploy**.

**Nota**: Hemos añadido un archivo `vercel.json` en `apps/web` para que la navegación funcione correctamente (evita errores 404 al recargar).

### Paso 5: Actualizar Backend en Railway

Ahora que tienes la URL final de Vercel (ej: `https://freeliga.vercel.app`):

1. Vuelve a **Railway**.
2. Ve a las variables de tu API.
3. Actualiza `FRONTEND_URL` y `ALLOWED_ORIGINS` con tu URL real de Vercel.
4. El backend se reiniciará automáticamente.

---

## �️ Solución de Problemas Comunes

### El Build falla en Railway
- **Causa**: Falta la variable `DATABASE_URL` durante el build (Prisma la necesita para generar el cliente).
- **Solución**: Asegúrate de haber añadido la variable `DATABASE_URL` (usando la referencia `${{MySQL.DATABASE_URL}}`) en la pestaña Variables **antes** de que termine el build. Si falló, añádela y dale a "Redeploy".

### Veo dos servicios fallando en Railway (api y web)
- **Causa**: Railway ha intentado desplegar todo el monorepo.
- **Solución**: Borra el servicio `web` de Railway (clic derecho -> Delete). Solo necesitamos el servicio `api` y el servicio `MySQL`.

### Error de Conexión a Base de Datos
- **Verificación**: Comprueba que la variable `DATABASE_URL` en el servicio API coincide con la Connection URL del servicio MySQL. La referencia `${{MySQL.DATABASE_URL}}` es la forma más segura.

---

## 📊 URLs de Producción

| Servicio | URL |
|---------|-----|
| Frontend (Vercel) | `https://free-liga-web.vercel` |
| Backend API (Railway) | `https://freesquashapi-production.up.railway.app` ✅ |
