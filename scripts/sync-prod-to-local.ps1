param(
    [string]$BackupDir = ".\backups"
)

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Parse-DatabaseUrl {
    param([string]$Url)
    if ($Url -match 'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)') {
        return @{
            User = $matches[1]
            Pass = $matches[2]
            Host = $matches[3]
            Port = $matches[4]
            Database = $matches[5]
        }
    }
    return $null
}

function Decompress-GzipFile {
    param([string]$SourceFile, [string]$TargetFile)
    try {
        $gzipFile = [System.IO.File]::OpenRead($SourceFile)
        $output = [System.IO.File]::Create($TargetFile)
        $gzipStream = New-Object System.IO.Compression.GzipStream($gzipFile, [System.IO.Compression.CompressionMode]::Decompress)
        $gzipStream.CopyTo($output)
        $gzipStream.Close()
        $output.Close()
        $gzipFile.Close()
        return $true
    }
    catch {
        return $false
    }
}

function Compress-GzipFile {
    param([string]$SourceFile, [string]$TargetFile)
    try {
        $source = [System.IO.File]::OpenRead($SourceFile)
        $target = [System.IO.File]::Create($TargetFile)
        $gzip = New-Object System.IO.Compression.GzipStream($target, [System.IO.Compression.CompressionMode]::Compress)
        $source.CopyTo($gzip)
        $gzip.Close()
        $target.Close()
        $source.Close()
        return $true
    }
    catch {
        return $false
    }
}

Write-Output ""
Write-ColorOutput Green "SINCRONIZAR PRODUCCION A LOCAL"
Write-Output ""
Write-Host "Este proceso:"
Write-Host "  1. Descarga una copia de PROD desde Railway"
Write-Host "  2. Restaura en tu BD LOCAL"
Write-Host "  3. Puedes trabajar con datos reales en desarrollo"
Write-Host ""

# Crear directorio de backups si no existe
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

# Cargar .env
if (-not (Test-Path ".env")) {
    Write-ColorOutput Red "[ERROR] No encontrado: .env"
    exit 1
}

Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]*)\s*=\s*(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Variable -Name $name -Value $value -Scope Script
    }
}

$prodInfo = Parse-DatabaseUrl $DATABASE_URL_PROD
$localInfo = Parse-DatabaseUrl $DATABASE_URL

if (-not $prodInfo) {
    Write-ColorOutput Red "[ERROR] DATABASE_URL_PROD vacio o invalido en .env"
    exit 1
}

if (-not $localInfo) {
    Write-ColorOutput Red "[ERROR] DATABASE_URL vacio o invalido en .env"
    exit 1
}

Write-ColorOutput Yellow "DESCARGANDO DE PRODUCCION..."
Write-Output "Host: $($prodInfo.Host):$($prodInfo.Port)"
Write-Output "Database: $($prodInfo.Database)"
Write-Output ""

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "$BackupDir\prod_sync_$timestamp.sql.gz"
$tempUncompressed = "$env:TEMP\prod_raw_$timestamp.sql"
$decompressed = "$env:TEMP\prod_restore_$timestamp.sql"

# Opcion 1: Intentar con docker exec
Write-Output "1. Intentando: Docker exec con mysqldump..."
$dockerSuccess = $false
$tempUncompressed = "$env:TEMP\prod_raw_$timestamp.sql"

try {
    # Usar bash -c para asegurar que la contraseña se pase correctamente
    $cmd = "mysqldump -h $($prodInfo.Host) -P $($prodInfo.Port) -u $($prodInfo.User) -p$($prodInfo.Pass) --single-transaction --routines --triggers --events $($prodInfo.Database) 2>/dev/null"
    
    # Guardar directamente en archivo para evitar issues con variables
    docker exec freeliga-mysql bash -c "$cmd > /tmp/dump.sql" 2>&1 | Out-Null
    
    # Copiar del container al host
    docker cp freeliga-mysql:/tmp/dump.sql $tempUncompressed 2>&1 | Out-Null
    
    $fileSize = if (Test-Path $tempUncompressed) { (Get-Item $tempUncompressed).Length } else { 0 }
    
    if ($fileSize -gt 5000) {
        $dockerSuccess = $true
        Write-Output "   OK - $('{0:N0}' -f $fileSize) bytes"
    }
    else {
        Write-Output "   Dump pequeño ($fileSize bytes) - intentando alternativa..."
    }
}
catch {
    Write-Output "   Error - intentando alternativa..."
}

# Opcion 2: MySQL CLI local
if (-not $dockerSuccess) {
    Write-Output "2. Intentando: MySQL CLI local..."
    
    $mysqlCheck = cmd /c "where mysql" 2>&1
    if ($LASTEXITCODE -eq 0) {
        try {
            mysqldump `
                -h $($prodInfo.Host) `
                -P $($prodInfo.Port) `
                -u $($prodInfo.User) `
                -p$($prodInfo.Pass) `
                --single-transaction `
                --routines `
                --triggers `
                --events `
                $($prodInfo.Database) > $tempUncompressed 2>&1
            
            $fileSize = if (Test-Path $tempUncompressed) { (Get-Item $tempUncompressed).Length } else { 0 }
            
            if ($fileSize -gt 5000) {
                $dockerSuccess = $true
                Write-Output "   OK - $('{0:N0}' -f $fileSize) bytes"
            }
        }
        catch {
            Write-Output "   Fallo - intentando alternativa..."
        }
    }
}

# Opcion 3: Mostrar alternativas manuales
if (-not $dockerSuccess) {
    Write-Output "3. Métodos alternativos disponibles:"
    Write-Output ""
    Write-ColorOutput Yellow "ALTERNATIVA A: Descargar manualmente en Railway"
    Write-Output "  1. Abre: https://railway.app/"
    Write-Output "  2. Proyecto FreeLiga -> MySQL -> Backups"
    Write-Output "  3. Descarga el archivo SQL.GZ"
    Write-Output "  4. Guarda en carpeta: backups/"
    Write-Output "  5. Ejecuta: npm run restore"
    Write-Output ""
    Write-ColorOutput Yellow "ALTERNATIVA B: Instalar MySQL CLI"
    Write-Output "  1. chocolatey install mysql-connector-net"
    Write-Output "  2. Luego intenta: npm run sync"
    Write-Output ""
    Write-Host "Ver: docs/DESCARGAR_BACKUP_RAILWAY.md para mas detalles"
    exit 1
}

# Si llegamos aqui, tenemos el dump
if ($fileSize -gt 5000) {
    Write-Output ""
    Write-Output "2. Comprimiendo backup..."
    if (Compress-GzipFile -SourceFile $tempUncompressed -TargetFile $backupFile) {
        $backupSize = (Get-Item $backupFile).Length
        $backupSizeMB = [math]::Round($backupSize / 1MB, 2)
        Write-Output "   OK - ${backupSizeMB}MB"
    }
    else {
        Write-ColorOutput Red "[ERROR] Fallo al comprimir"
        exit 1
    }
    
    Write-Output ""
    Write-ColorOutput Green "3. Restaurando en LOCAL..."
    
    # Decomprimir
    if (Decompress-GzipFile -SourceFile $backupFile -TargetFile $decompressed) {
        Write-Output "   Descomprimido..."
        
        # Copiar al container
        Write-Output "   Importando en contenedor LOCAL..."
        docker cp $decompressed freeliga-mysql:/tmp/restore.sql 2>&1 | Out-Null
        
        # Restaurar en local
        $restoreCmd = "mysql -u $($localInfo.User) -p$($localInfo.Pass) $($localInfo.Database) < /tmp/restore.sql"
        docker exec freeliga-mysql bash -c $restoreCmd 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            if (Test-Path $decompressed) { Remove-Item $decompressed }
            
            Write-Output ""
            Write-ColorOutput Green "COMPLETADO!"
            Write-Output ""
            Write-ColorOutput Green "TU BD LOCAL TIENE DATOS FRESCOS DE PRODUCCION"
            Write-Output ""
            Write-Host "Puedes:"
            Write-Host "  1. Trabajar en desarrollo con datos reales"
            Write-Host "  2. Hacer pruebas sin afectar PRODUCCION"
            Write-Host "  3. Hacer backup: npm run backup:quick"
            Write-Host ""
            Write-Host "Backup guardado: $backupFile"
            exit 0
        }
        else {
            Write-ColorOutput Red "[ERROR] Fallo restauracion en LOCAL"
            if (Test-Path $decompressed) { Remove-Item $decompressed }
            exit 1
        }
    }
    else {
        Write-ColorOutput Red "[ERROR] Fallo descomprimir"
        exit 1
    }
}
