param(
    [string]$Environment = "local",
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

if ($Environment -eq "prod") {
    $dbUrl = $DATABASE_URL_PROD
    $envLabel = "PRODUCCION"
    $envColor = [ConsoleColor]::Red
} else {
    $dbUrl = $DATABASE_URL
    $envLabel = "LOCAL"
    $envColor = [ConsoleColor]::Green
}

$dbInfo = Parse-DatabaseUrl $dbUrl

if (-not $dbInfo) {
    Write-ColorOutput Red "[ERROR] No se pudo parsear DATABASE_URL"
    exit 1
}

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dateOnly = Get-Date -Format "yyyyMMdd"

Write-ColorOutput $envColor "[INFO] Backup - Ambiente $envLabel"
Write-Output "Host: $($dbInfo.Host)"
Write-Output "Database: $($dbInfo.Database)"
Write-Output ""

$backupFileTemp = Join-Path $BackupDir "backup_${Environment}_${dateOnly}_${timestamp}.sql"
$backupFile = Join-Path $BackupDir "backup_${Environment}_${dateOnly}_${timestamp}.sql.gz"

try {
    Write-ColorOutput Green "[BACKUP] Extrayendo datos..."
    
    if ($Environment -eq "prod") {
        # Generar dump dentro del contenedor y copiarlo al host para evitar contaminación del stream
        $dumpPath = "/tmp/prod_dump_${timestamp}.sql"
        $dumpCmd = "mysqldump -h $($dbInfo.Host) -P $($dbInfo.Port) -u $($dbInfo.User) -p$($dbInfo.Pass) --single-transaction --routines --triggers --events $($dbInfo.Database) > $dumpPath 2>/dev/null"
        docker exec freeliga-mysql bash -c $dumpCmd 2>$null | Out-Null
        
        # Copiar el dump del contenedor al host
        docker cp "freeliga-mysql:$dumpPath" $backupFileTemp 2>$null | Out-Null
        
        # Limpiar el archivo temporal en el contenedor
        docker exec freeliga-mysql rm -f $dumpPath 2>$null | Out-Null
    } else {
        docker exec freeliga-mysql mysqldump `
            -h 127.0.0.1 `
            -u $($dbInfo.User) `
            -p$($dbInfo.Pass) `
            --single-transaction `
            --routines `
            --triggers `
            --events `
            $($dbInfo.Database) > $backupFileTemp 2>&1
    }
    
    $fileSize = if (Test-Path $backupFileTemp) { (Get-Item $backupFileTemp).Length } else { 0 }
    
    if ($fileSize -gt 5000) {
        Write-ColorOutput Green "[BACKUP] Comprimiendo..."
        if (Compress-GzipFile -SourceFile $backupFileTemp -TargetFile $backupFile) {
            $backupSize = (Get-Item $backupFile).Length
            $backupSizeKB = [math]::Round($backupSize / 1KB, 2)
            $backupSizeMB = [math]::Round($backupSize / 1MB, 2)
            
            Write-ColorOutput Green "[SUCCESS] Backup completado"
            Write-Output "Archivo: $(Split-Path $backupFile -Leaf)"
            if ($backupSizeMB -gt 1) {
                Write-Output "Tamanio: $backupSizeMB MB"
            } else {
                Write-Output "Tamanio: $backupSizeKB KB"
            }
            Write-Output ""
            
            $latestBackup = Join-Path $BackupDir "latest_${Environment}.sql.gz"
            if (Test-Path $latestBackup) {
                Remove-Item $latestBackup
            }
            Copy-Item $backupFile $latestBackup
            
            Write-Output ""
            Write-Output "[INFO] Ultimos backups:"
            Get-ChildItem $BackupDir -Filter "backup_${Environment}_*.sql.gz" -ErrorAction SilentlyContinue | 
                Sort-Object LastWriteTime -Descending |
                Select-Object -First 3 |
                ForEach-Object {
                    $size = [math]::Round($_.Length / 1MB, 2)
                    Write-Output "   $($_.Name) - ${size}MB"
                }
            
            Write-Output ""
            Write-ColorOutput Green "[SUCCESS] Completado"
            exit 0
        } else {
            Write-ColorOutput Red "[ERROR] Fallo compresion"
            exit 1
        }
    } else {
        Write-ColorOutput Red "[ERROR] Archivo muy pequeno ($fileSize bytes)"
        exit 1
    }
    
} catch {
    Write-ColorOutput Red "[ERROR] $_"
    exit 1
}
