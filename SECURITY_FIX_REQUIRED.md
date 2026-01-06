# URGENTE: Credenciales Expuestas en Repositorio

## Resumen Critico

**Tu archivo `.env` contiene credenciales de PRODUCCION en texto plano:**

```
DATABASE_URL_PROD=mysql://root:HkwOvwLFXIpySTWoZEVaXPZhQZgPSDbo@metro.proxy.rlwy.net:26282/railway
```

### Riesgos Inmediatos

- Si el repositorio es publico: **CUALQUIERA puede acceder a tu BD de PRODUCCION**
- La contraseña esta en el historico de Git
- Anyone puede leer, modificar o borrar datos de PRODUCCION

---

## ACCIONES REQUERIDAS (HACER AHORA)

### 1. CAMBIAR CONTRASEÑA EN RAILWAY

```
https://railway.app/
  -> Proyecto FreeLiga
  -> MySQL database
  -> Variables
  -> PASSWORD (cambiar a algo random)
  -> Copiar la nueva contraseña
```

**Nueva contraseña debe ser:**
- Minimo 20 caracteres
- Mixta: mayusculas, minusculas, numeros, simbolos
- NO guardar en .env visible

### 2. REMOVER .env DE GIT

```powershell
# Desde el directorio raiz del proyecto

# Remover del control de Git (pero no del disco)
git rm --cached .env

# Actualizar .gitignore
echo ".env" | Add-Content .gitignore

# Commit
git add .gitignore
git commit -m "Remove .env from tracking - contains production credentials"
```

### 3. CREAR .env.example (SIN CREDENCIALES)

```powershell
# Crea template para otros developers
New-Item .env.example -Force

# Contenido:
```

```
# BASE DE DATOS LOCAL (DEV)
DATABASE_URL=mysql://freeliga:freeliga123@mysql:3306/railway

# BASE DE DATOS PRODUCCION (Cambiar PASSWORD!)
DATABASE_URL_PROD=mysql://root:CHANGE_ME_STRONG_PASSWORD@metro.proxy.rlwy.net:26282/railway

# RAILWAY TOKEN (para backups automaticos)
RAILWAY_TOKEN=tu_token_aqui_si_usas_cli

# LOG LEVEL
LOG_LEVEL=error
```

Commit:
```powershell
git add .env.example
git commit -m "Add .env.example template for reference"
```

### 4. LIMPIAR HISTORICO DE GIT (IMPORTANTE!)

Si el repo es publico, alguien ya vio las credenciales en el historico.

**Opcion A: BFG Repo Cleaner (RAPIDO)**

```powershell
# Descargar: https://rtyley.github.io/bfg-repo-cleaner/

# Ejecutar desde fuera del repo
bfg --replace-text passwords.txt c:\xampp\htdocs\personal\FreeLiga

# Crear archivo passwords.txt con:
# HkwOvwLFXIpySTWoZEVaXPZhQZgPSDbo
```

**Opcion B: git filter-branch (LENTO PERO INTEGRADO)**

```powershell
# Revisar todos los cambios con .env
git log --all --full-history -- .env

# Eliminar el archivo de todo el historico
git filter-branch --tree-filter 'rm -f .env' -- --all

# Forzar push (CUIDADO!)
git push --force-with-lease
```

---

## DESPUES DE CAMBIOS

### ✓ Verificar que .env no esta en el repositorio

```powershell
# Deberia estar vacio o solo mostrar .env.example
git ls-tree -r HEAD | grep "\.env"

# Correcto = sin salida o solo .env.example
```

### ✓ Actualizar tu .env local con nueva contraseña

```
DATABASE_URL=mysql://freeliga:freeliga123@mysql:3306/railway
DATABASE_URL_PROD=mysql://root:NUEVA_PASSWORD_DE_RAILWAY@metro.proxy.rlwy.net:26282/railway
```

### ✓ Probar que el backup funciona

```powershell
# Despues de cambiar contraseña en Railway
npm run sync
# Si funciona: OK
# Si no: usa metodo manual de Railway dashboard
```

---

## CHECKLIST DE SEGURIDAD

- [ ] Cambiar PASSWORD en Railway
- [ ] Remover .env del control de Git
- [ ] Crear .env.example
- [ ] Actualizar .gitignore
- [ ] Ejecutar `git rm --cached .env`
- [ ] Commit los cambios
- [ ] Limpiar historico de Git (BFG o git filter-branch)
- [ ] Forzar push al repositorio
- [ ] Verificar que .env no aparece en "git log"
- [ ] Actualizar .env local con nueva contraseña
- [ ] Probar `npm run sync` con nueva contraseña

---

## REFERENCIAS

- [GitHub: Revoking Credentials](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [BFG Repo Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [git filter-branch](https://git-scm.com/docs/git-filter-branch)

---

## PREGUNTAS FRECUENTES

### Q: Ya subiste las credenciales, ¿que hago?
**A:** Cambiar la contraseña en Railway INMEDIATAMENTE, luego limpiar Git.

### Q: ¿Como hago credenciales seguras?
**A:** Usa variables de entorno en CI/CD (GitHub Actions, Railway), no en .env visible.

### Q: ¿Puedo recuperar si algo sale mal?
**A:** Si, con `git reflog` mientras no hayas purgado basura de Git.
