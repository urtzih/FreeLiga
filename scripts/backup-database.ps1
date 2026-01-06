param(
    [string]$BackupDir = ".\backups",
    [int]$RetentionDays = 30
)

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
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
        
        Remove-Item $SourceFile -Force
        return $true
    } catch {
        return $false
    }
}

Write-ColorOutput Green "[INFO] Iniciando backup de base de datos..."
Write-Output "Fecha: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Output "Directorio: $BackupDir"
Write-Output ""

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
    Write-ColorOutput Yellow "Directorio de backups creado"
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dateOnly = Get-Date -Format "yyyyMMdd"

if (-not (Test-Path ".env")) {
    Write-ColorOutput Red "[ERROR] Archivo .env no encontrado"
    exit 1
}

Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]*)\s*=\s*(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Variable -Name $name -Value $value -Scope Script
    }
}

$containerName = if ($MYSQL_CONTAINER_NAME) { $MYSQL_CONTAINER_NAME } else { "freeliga-mysql" }
$dbName = $MYSQL_DATABASE
$dbUser = $MYSQL_USER
$dbPass = $MYSQL_PASSWORD

$backupFileTemp = Join-Path $BackupDir "local_backup_${dateOnly}_${timestamp}.sql"
$backupFile = Join-Path $BackupDir "local_backup_${dateOnly}_${timestamp}.sql.gz"

Write-ColorOutput Green "[BACKUP] Creando backup..."
Write-Output "   Container: $containerName"
Write-Output "   Base de datos: $dbName"
Write-Output ""

$containerStatus = docker ps --filter "name=$containerName" --format "{{.Status}}"
if (-not $containerStatus) {
    Write-ColorOutput Red "[ERROR] El contenedor $containerName no esta corriendo"
    exit 1
}

try {
    Write-Output "Extrayendo datos de BD..."
    
    $cmd = @(
        "docker", "exec", $containerName, "mysqldump",
        "-h", "127.0.0.1",
        "-u", $dbUser,
        "-p$dbPass",
        "--single-transaction",
        "--routines",
        "--triggers",
        "--events",
        $dbName
    )
    
    & $cmd[0] $cmd[1..($cmd.Length-1)] > $backupFileTemp 2>&1
    
    $fileSize = if (Test-Path $backupFileTemp) { (Get-Item $backupFileTemp).Length } else { 0 }
    
    if ($fileSize -gt 5000) {
        Write-Output "Comprimiendo..."
        if (Compress-GzipFile -SourceFile $backupFileTemp -TargetFile $backupFile) {
            $backupSize = (Get-Item $backupFile).Length
            $backupSizeKB = [math]::Round($backupSize / 1KB, 2)
            $backupSizeMB = [math]::Round($backupSize / 1MB, 2)
            
            Write-ColorOutput Green "[SUCCESS] Backup completado exitosamente"
            Write-Output "Archivo: $backupFile"
            if ($backupSizeMB -gt 1) {
                Write-Output "Tamanio: $backupSizeMB MB"
            } else {
                Write-Output "Tamanio: $backupSizeKB KB"
            }
            Write-Output ""
            
            $latestBackup = Join-Path $BackupDir "latest.sql.gz"
            if (Test-Path $latestBackup) {
                Remove-Item $latestBackup
            }
            Copy-Item $backupFile $latestBackup
            
            Write-ColorOutput Yellow "[CLEANUP] Limpiando backups antiguos (mas de $RetentionDays dias)..."
            $cutoffDate = (Get-Date).AddDays(-$RetentionDays)
            @(Get-ChildItem $BackupDir -Filter "*.sql.gz" -ErrorAction SilentlyContinue) | 
                Where-Object { $_.LastWriteTime -lt $cutoffDate -and $_.Name -ne "latest.sql.gz" } |
                ForEach-Object {
                    Write-Output "   Eliminando: $($_.Name)"
                    Remove-Item $_.FullName
                }
            
            Write-Output ""
            Write-ColorOutput Green "[INFO] Backups disponibles:"
            @(Get-ChildItem $BackupDir -Filter "*.sql.gz" -ErrorAction SilentlyContinue) | 
                Sort-Object LastWriteTime -Descending |
                Select-Object -First 5 |
                ForEach-Object {
                    $size = [math]::Round($_.Length / 1MB, 2)
                    Write-Output "   $($_.Name) - ${size}MB - $($_.LastWriteTime)"
                }
            
            Write-Output ""
            Write-ColorOutput Green "[SUCCESS] Proceso completado"
            exit 0
        } else {
            Write-ColorOutput Red "[ERROR] Fallo la compresion"
            if (Test-Path $backupFileTemp) { Remove-Item $backupFileTemp -Force }
            exit 1
        }
    } else {
        Write-ColorOutput Red "[ERROR] Mysqldump genero archivo demasiado pequenio ($fileSize bytes)"
        if (Test-Path $backupFileTemp) { Remove-Item $backupFileTemp -Force }
        exit 1
    }
    
} catch {
    Write-ColorOutput Red "[ERROR] Al crear el backup: $_"
    if (Test-Path $backupFileTemp) {
        Remove-Item $backupFileTemp -Force
    }
    exit 1
}
