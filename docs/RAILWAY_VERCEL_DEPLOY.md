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

Asegúrate de que Railway sabe cómo construir tu API.
Ve a **Settings (Configuración)** del servicio API:

- **Root Directory**: Déjalo vacío (`/`) si es un monorepo, o `apps/api` si lo prefieres, pero el Dockerfile está en la raíz.
- **Build Command**: Déjalo vacío (usaremos Docker).
- **Start Command**: Déjalo vacío.

**Verifica el Dockerfile**:
Railway debería detectar el `Dockerfile` en la raíz automáticamente.

### Paso 5: Desplegar (Redeploy)

Si el primer despliegue falló:
1. Ve a la pestaña **Deployments**.
2. Haz clic en **Redeploy** (o Trigger Deploy) ahora que las variables están configuradas.
3. Observa los **Logs**. Deberías ver "Server listening on port 3001".

### Paso 6: Obtener URL del Backend

Una vez desplegado y en verde:
1. Ve a **Settings** → **Networking**.
2. Genera un dominio (Generate Domain) si no tienes uno.
3. Copia esa URL (ej: `https://freeliga-production.up.railway.app`).

---

## 🌐 Despliegue del Frontend (Vercel)

### Paso 1: Importar Proyecto en Vercel

1. Ve a [vercel.com](https://vercel.com) → **Add New** → **Project**.
2. Importa el repositorio **FreeLiga**.

### Paso 2: Configurar Build

Vercel detectará que es un proyecto Vite, pero como es un monorepo, ajusta lo siguiente:

- **Framework Preset**: Vite
- **Root Directory**: Haz clic en "Edit" y selecciona `apps/web`.
- **Build Settings**:
    - Build Command: `npm run build --workspace=apps/web` (o dejarlo por defecto si Vercel lo detecta bien dentro de la carpeta).
    - Output Directory: `dist`
    - Install Command: `npm install` (Vercel suele manejar esto bien en monorepos).

### Paso 3: Variables de Entorno

En la sección **Environment Variables** antes de desplegar:

```env
VITE_API_URL=https://tu-backend-en-railway.up.railway.app
```

*Pega aquí la URL que obtuviste en el Paso 6 del Backend.*

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
| Frontend (Vercel) | `https://tu-proyecto.vercel.app` |
| Backend API (Railway) | `https://tu-proyecto.up.railway.app` |
