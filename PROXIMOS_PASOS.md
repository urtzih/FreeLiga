# PROXIMOS PASOS - Acciones Inmediatas

## 🔴 PRIORIDAD 1: SEGURIDAD (HACER HOY)

### Tarea 1: Cambiar contraseña en Railway

```
https://railway.app/
├─ Login
├─ Select FreeLiga project
├─ Resources -> MySQL database
├─ Variables
├─ PASSWORD (click para editar)
├─ Generar nueva contraseña (minimo 20 caracteres)
└─ Copy nueva password
```

**Nueva contraseña debe ser:**
- Minimo 20 caracteres
- Mix: MAYUSCULAS + minusculas + numeros + simbolos
- Ejemplo: `aB3$xYpQ9kL2@mN5vW8rT`

### Tarea 2: Actualizar .env local

```powershell
# Edita: .env

# Cambiar esta linea:
DATABASE_URL_PROD=mysql://root:VIEJA_PASSWORD@metro.proxy.rlwy.net:26282/railway

# A:
DATABASE_URL_PROD=mysql://root:NUEVA_PASSWORD@metro.proxy.rlwy.net:26282/railway
```

### Tarea 3: Remover .env de Git

```powershell
cd c:\xampp\htdocs\personal\FreeLiga

# Remover del tracking (pero no del disco)
git rm --cached .env

# Verificar .gitignore incluye .env
# Si no, agregar:
echo ".env" | Add-Content .gitignore

# Ver cambios
git status
# Deberia mostrar:
# deleted:    .env
# modified:   .gitignore
```

### Tarea 4: Crear .env.example (template)

```powershell
# Crear archivo de referencia sin credenciales
cat > .env.example << 'EOF'
# Base de datos LOCAL (desarrollo)
DATABASE_URL=mysql://freeliga:freeliga123@mysql:3306/railway

# Base de datos PRODUCCION
# CAMBIAR PASSWORD A ALGO FUERTE EN RAILWAY!
DATABASE_URL_PROD=mysql://root:CHANGE_ME_STRONG_PASSWORD@metro.proxy.rlwy.net:26282/railway

# Log level
LOG_LEVEL=error
EOF

# Agregar a Git
git add .env.example
```

### Tarea 5: Commit cambios

```powershell
git add .gitignore .env.example
git commit -m "Security: Remove .env from tracking, add .env.example template"

# Ver que se removio .env
git show --name-status HEAD
# Deberia mostrar: D .env (deleted)
```

### Tarea 6: Limpiar Git history (SOLO SI REPO ES PUBLICO)

Si alguien ya vio las credenciales en Git:

**Opcion A: BFG (rapido)**
```powershell
# Descargar desde: https://rtyley.github.io/bfg-repo-cleaner/
# O via chocolatey:
choco install bfg

# Ejecutar (FUERA del repo):
cd c:\
bfg --delete-files .env --no-blob-protection C:\xampp\htdocs\personal\FreeLiga

# Dentro del repo:
cd FreeLiga
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (CUIDADO!)
git push --force-with-lease origin main
```

**Opcion B: git filter-branch (mas seguro pero lento)**
```powershell
cd FreeLiga

# Ver todos los cambios del archivo
git log --all --full-history -- .env

# Eliminar de todo el historico
git filter-branch --tree-filter 'rm -f .env' -- --all

# Force push
git push --force-with-lease origin main
```

### Tarea 7: Verificar que .env NO aparece en Git

```powershell
# Deberia estar vacio o solo mostrar .env.example
git ls-tree -r HEAD | grep "\.env"
# Correcto = sin salida (o solo .env.example)

# Verificar en log
git log --all --oneline -- .env
# Deberia estar vacio o terminar en "deleted"
```

---

## 🟡 PRIORIDAD 2: TESTING (HACER DESPUÉS DE SEGURIDAD)

### Test 1: Verificar backup LOCAL

```powershell
# Hacer backup rapido
npm run backup:quick

# Deberia crear archivo en backups/
ls backups/ -la

# Esperar salida:
# backup_20260106_HHmmss.sql.gz
# latest.sql.gz
```

### Test 2: Verificar restore

```powershell
# Restaurar desde backup anterior
npm run restore

# Deberia restaurar sin errores
```

### Test 3: Intentar sync (opcional, si MySQL CLI instalado)

```powershell
# Si tienes MySQL instalado:
npm run sync

# Si NO tienes MySQL:
# Ver: DESCARGAR_BACKUP_RAILWAY.md para alternativas
```

---

## 🟢 PRIORIDAD 3: ALTERNATIVAS DESCARGA (SI SYNC NO FUNCIONA)

### Opcion A: Descargar via Railway dashboard (RECOMENDADO)

```
1. https://railway.app/ -> Login
2. Proyecto -> MySQL -> Backups
3. Descargar archivo .sql.gz mas reciente
4. Guardar en: c:\xampp\htdocs\personal\FreeLiga\backups\
5. Ejecutar: npm run restore
```

### Opcion B: Instalar MySQL CLI (OPCIONAL)

```powershell
# Descargar: https://dev.mysql.com/downloads/mysql/
# O con chocolatey:
choco install mysql-connector-net

# Luego:
npm run sync
# Funcionara si MySQL CLI esta en PATH
```

### Opcion C: Railway CLI (AVANZADO)

```powershell
npm install -g @railway/cli
railway login
railway db export --output backup.sql
# Comprime manualmente si quieres
```

---

## 📋 Checklist Final

- [ ] Cambiar password en Railway
- [ ] Actualizar .env local con nueva password
- [ ] `git rm --cached .env`
- [ ] Crear `.env.example`
- [ ] `git add .gitignore .env.example`
- [ ] `git commit` cambios
- [ ] Limpiar Git history (si repo es publico)
- [ ] Verificar `.env` no aparece en Git
- [ ] `npm run backup:quick` funciona
- [ ] `npm run restore` funciona
- [ ] Decidir: sync automatico vs descargas manuales
- [ ] (Opcional) Instalar MySQL CLI para sync automatico

---

## ⚠️ Notas Importantes

### No hacer esto:

```powershell
# ❌ MAL: Force push sin estar seguro
git push --force origin main

# ❌ MAL: Commitear .env
git add .env
git commit -m "Add env"

# ❌ MAL: Dejar credenciales en comentarios
# PASSWORD=algo_secreto  <- nunca

# ❌ MAL: Subir backups a Git
git add backups/
```

### Hacer esto:

```powershell
# ✅ BIEN: Usar .gitignore
echo ".env" >> .gitignore
git add .gitignore

# ✅ BIEN: Usar force-with-lease (mas seguro que --force)
git push --force-with-lease origin main

# ✅ BIEN: Guardar backups localmente
backups/ -> en .gitignore
```

---

## 🆘 Si algo sale mal

### "¿Hice un force push incorrecto?"
```
git reflog  <- ver historico
git reset --hard <commit>  <- volver atras si es necesario
```

### "¿Subi .env accidentalmente?"
```
Ver SECURITY_FIX_REQUIRED.md -> Limpiar Git history
```

### "¿No puedo hacer git filter-branch?"
```
Usar BFG repo cleaner (mas facil)
https://rtyley.github.io/bfg-repo-cleaner/
```

### "¿Sigo teniendo problemas con sync?"
```
Ver: DESCARGAR_BACKUP_RAILWAY.md
Usa descargas manuales mientras
```

---

## ✅ Una vez completes TODO:

1. ✅ Sistema de backups SEGURO (credenciales protegidas)
2. ✅ Puedes hacer `npm run backup:quick` sin miedo
3. ✅ Puedes hacer `npm run restore` si algo falla
4. ✅ Puedes descargar PROD manualmente o automaticamente
5. ✅ Git no tiene credenciales expuestas
6. ✅ Nuevo developers pueden usar `.env.example` como referencia

---

**Tiempo estimado**: 30 minutos para todo
**Critico**: Tarea 1-5 (cambiar password y remover .env)
**Importante**: Tarea 6 (si repo es publico)
