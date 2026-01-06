# Descargar Backup de PRODUCCION

Primero prueba el flujo automatizado de solo descarga (NO restaura):

```powershell
npm run backup:prod
```

Esto crea un archivo `.sql.gz` en `backups/` y actualiza `latest_prod.sql.gz`. Si prefieres descargar manualmente desde Railway o `npm run sync` falla por conectividad, sigue alguno de los métodos de abajo.

## METODO 1: Via Dashboard de Railway (MAS SIMPLE)

### Pasos:

1. **Abre Railway**
   ```
   https://railway.app/
   ```

2. **Selecciona tu proyecto** (FreeLiga)

3. **Accede a la Base de Datos MySQL**
   - En el menu izquierdo, haz click en "railway" (la BD MySQL)
   - O busca en "Resources" -> "MySQL"

4. **Ve a Backups**
   - Tab superior: "Backups"
   - Veras una lista de backups automaticos

5. **Descarga el mas reciente**
   - Haz click en el backup
   - Boton "Download" o similar
   - Espera a que descargue el archivo `.sql.gz`

6. **Coloca el archivo en carpeta backups**
   ```powershell
   Move-Item "C:\Users\TuUsuario\Downloads\railway_*.sql.gz" ".\backups\"
   ```

7. **Restaura en LOCAL**
   ```powershell
   npm run restore
   # Selecciona el archivo que descargaste
   ```

---

## METODO 2: Via Railway CLI (SI TIENES CLI INSTALADO)

### Instalacion de Railway CLI

```powershell
# En PowerShell como administrador
npm install -g @railway/cli
```

### Descargar backup con CLI

```powershell
# Conectate a tu proyecto
railway login

# Lista las bases de datos
railway db ls

# Exporta el backup
railway db export --output backup_manual.sql

# Comprime (opcional)
# El backup es un .sql plano
```

---

## METODO 3: Via MySQL CLI Remoto (RECOMENDADO SI FUNCIONA)

### Requisitos

- Tener MySQL Community instalado
  ```
  https://dev.mysql.com/downloads/mysql/
  ```

### Descargar con mysqldump directo

```powershell
# En PowerShell en el directorio del proyecto
mysqldump `
    -h metro.proxy.rlwy.net `
    -P 26282 `
    -u root `
    -p `
    --single-transaction `
    railway > backups\manual_backup.sql

# Te pedira contraseña - copia de .env
```

Si funciona:

```powershell
# Comprime manualmente
# Abre Git Bash o WSL
gzip backups\manual_backup.sql
# Resultado: backups\manual_backup.sql.gz

# Luego restaura
npm run restore
```

---

## METODO 4: Via Comando npm run sync (IDEAL)

Si tienes MySQL CLI instalado:

```powershell
# Simplemente ejecuta:
npm run sync

# Si funciona:
# 1. Descarga backup de PROD
# 2. Lo comprime
# 3. Lo restaura en LOCAL
# TODO AUTOMATICO
```

---

## Si NADA funciona: Hacer backup desde tu conexion local

Si las opciones anteriores fallan, puedes hacer un backup de lo que tengas en LOCAL:

```powershell
# Backup de tu BD LOCAL actual
npm run backup:quick

# Luego puedes trabajar normalmente
# En produccion se hacen backups automaticos via GitHub Actions
```

---

## Verificar que el restore funciono

```powershell
# Ver el numero de tablas importadas
docker exec freeliga-mysql mysql -u freeliga -pfreeliga123 railway -e "SHOW TABLES;"

# Deberia salir algo como:
# Tables_in_railway
# admin_notifications
# classification_matches
# classifications
# ... mas tablas
```

---

## Notas

- **Backups en Railway**: Se guardan automaticamente cada dia
- **Credenciales**: Estan en `.env` (no compartir)
- **Archivos descargados**: Guardalos en `backups/` para organizacion
- **Alternativa mas simple**: Descargar manualmente via dashboard
