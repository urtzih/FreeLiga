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

function Test-RailwayCliAuth {
    try {
        $railwayCmd = Get-Command railway -ErrorAction SilentlyContinue
        if (-not $railwayCmd) {
            return @{
                Available = $false
                Authenticated = $false
                Output = "Railway CLI no encontrada en PATH."
            }
        }

        $authOutput = & railway whoami 2>&1
        $authText = (($authOutput | ForEach-Object { "$_" }) -join [Environment]::NewLine).Trim()

        if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($authText)) {
            return @{
                Available = $true
                Authenticated = $true
                Output = $authText
            }
        }

        return @{
            Available = $true
            Authenticated = $false
            Output = $authText
        }
    }
    catch {
        return @{
            Available = $true
            Authenticated = $false
            Output = $_.Exception.Message
        }
    }
}

function Try-RailwaySshDump {
    param(
        [string]$OutputFile
    )

    try {
        $railwayAuth = Test-RailwayCliAuth
        if (-not $railwayAuth.Available) {
            Write-Output "   Railway CLI no encontrada en PATH."
            return $false
        }

        Write-Output "   Verificando Railway CLI con: railway whoami"
        if (-not $railwayAuth.Authenticated) {
            Write-Output "   Railway CLI sin sesion valida."
            if (-not [string]::IsNullOrWhiteSpace($railwayAuth.Output)) {
                Write-Output "   $($railwayAuth.Output)"
            }
            Write-Output "   Rehaz el login con: railway login"
            Write-Output "   Comprueba la sesion con: railway whoami"
            Write-Output "   Si hace falta relinkar el proyecto: railway link"
            return $false
        }

        Write-Output "   Sesion Railway OK: $($railwayAuth.Output)"
        Write-Output "   Ejecutando mysqldump via railway ssh (servicio MySQL)..."
        $dumpArgs = @(
            "ssh",
            "--service",
            "MySQL",
            'mysqldump --default-character-set=utf8mb4 -u root -p$MYSQL_ROOT_PASSWORD --single-transaction --routines --triggers --events $MYSQLDATABASE'
        )
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        $dumpOutput = & railway @dumpArgs 2>&1
        $exitCode = $LASTEXITCODE
        $dumpText = (($dumpOutput | ForEach-Object { "$_" }) -join [Environment]::NewLine)

        if ($exitCode -ne 0) {
            if (-not [string]::IsNullOrWhiteSpace($dumpText)) {
                Write-Output "   $dumpText"
            }
            return $false
        }

        [System.IO.File]::WriteAllText($OutputFile, $dumpText, $utf8NoBom)

        if (-not (Test-Path $OutputFile)) {
            Write-Output "   No se genero archivo de dump."
            return $false
        }

        if ([string]::IsNullOrWhiteSpace($dumpText)) {
            Write-Output "   Dump vacio."
            return $false
        }

        $fileSize = (Get-Item $OutputFile).Length
        if ($fileSize -le 5000) {
            Write-Output "   Dump pequeno (${fileSize} bytes)."
            return $false
        }

        # El warning inicial de mysqldump rompe la restauracion SQL; lo removemos.
        $lines = [System.IO.File]::ReadAllLines($OutputFile, $utf8NoBom)
        if ($lines.Count -gt 1 -and $lines[0] -like "mysqldump:*") {
            [System.IO.File]::WriteAllLines($OutputFile, $lines[1..($lines.Count - 1)], $utf8NoBom)
            $fileSize = (Get-Item $OutputFile).Length
        }

        Write-Output "   OK - $('{0:N0}' -f $fileSize) bytes"
        return $true
    }
    catch {
        Write-Output "   Error en railway ssh: $($_.Exception.Message)"
        return $false
    }
}

function Test-TcpPort {
    param(
        [string]$HostName,
        [int]$Port,
        [int]$TimeoutMs = 5000
    )

    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $async = $client.BeginConnect($HostName, $Port, $null, $null)
        $wait = $async.AsyncWaitHandle.WaitOne($TimeoutMs, $false)
        if (-not $wait) {
            $client.Close()
            return $false
        }
        $client.EndConnect($async) | Out-Null
        $client.Close()
        return $true
    }
    catch {
        return $false
    }
}

function Test-WorkspacePackageHealthy {
    param(
        [string]$PackageName
    )

    try {
        $lsOutput = npm ls $PackageName 2>&1
        $lsText = (($lsOutput | ForEach-Object { "$_" }) -join [Environment]::NewLine).Trim()

        if ($LASTEXITCODE -eq 0 -and $lsText -notmatch '\binvalid\b' -and $lsText -notmatch '\bUNMET\b') {
            return @{
                Healthy = $true
                Output = $lsText
            }
        }

        return @{
            Healthy = $false
            Output = $lsText
        }
    }
    catch {
        return @{
            Healthy = $false
            Output = $_.Exception.Message
        }
    }
}

function Ensure-WorkspaceDependencies {
    param(
        [string]$PackageName
    )

    $packageStatus = Test-WorkspacePackageHealthy -PackageName $PackageName
    if ($packageStatus.Healthy) {
        Write-Output "   Workspace OK: $PackageName"
        return $true
    }

    Write-Output "   Detectado workspace invalido o incompleto para $PackageName."
    if (-not [string]::IsNullOrWhiteSpace($packageStatus.Output)) {
        Write-Output "   $($packageStatus.Output)"
    }

    Write-Output "   Reparando workspaces con: npm install --workspaces"
    npm install --workspaces 2>&1 | Out-Null

    if ($LASTEXITCODE -ne 0) {
        Write-Output "   Fallo al ejecutar npm install --workspaces"
        return $false
    }

    $recheck = Test-WorkspacePackageHealthy -PackageName $PackageName
    if (-not $recheck.Healthy) {
        Write-Output "   El workspace sigue invalido tras la reparacion."
        if (-not [string]::IsNullOrWhiteSpace($recheck.Output)) {
            Write-Output "   $($recheck.Output)"
        }
        return $false
    }

    Write-Output "   Workspace reparado correctamente: $PackageName"
    return $true
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

# Verificar y levantar Docker + MySQL si no está corriendo
Write-Output ""
Write-ColorOutput Yellow "Verificando Docker y contenedor MySQL..."
$dockerRunning = $null
try {
    $dockerRunning = docker ps 2>&1 | Select-String "CONTAINER" -Quiet
} catch {
    $dockerRunning = $false
}

if (-not $dockerRunning) {
    Write-Output "Levantando Docker..."
    # Docker Desktop debería iniciarse automáticamente
    docker ps > $null 2>&1
    Start-Sleep -Seconds 2
}

# Verificar si el contenedor MySQL está corriendo
$mysqlRunning = docker ps | Select-String "freeliga-mysql" -Quiet

if (-not $mysqlRunning) {
    Write-Output "Levantando contenedor MySQL..."
    docker-compose up -d mysql 2>&1 | Out-Null
    Start-Sleep -Seconds 3
    Write-Output "Contenedor MySQL listo"
}

Write-ColorOutput Yellow "DESCARGANDO DE PRODUCCION..."
Write-Output "Host: $($prodInfo.Host):$($prodInfo.Port)"
Write-Output "Database: $($prodInfo.Database)"
Write-Output ""

Write-Output "Verificando conectividad TCP con Railway..."
$tcpOk = Test-TcpPort -HostName $prodInfo.Host -Port ([int]$prodInfo.Port) -TimeoutMs 6000
if (-not $tcpOk) {
    Write-Output "Sin conectividad TCP publica. Se intentara Railway SSH como fallback..."
}
else {
    Write-Output "Conectividad TCP OK"
}
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
    $cmd = "mysqldump --default-character-set=utf8mb4 -h $($prodInfo.Host) -P $($prodInfo.Port) -u $($prodInfo.User) -p$($prodInfo.Pass) --single-transaction --routines --triggers --events $($prodInfo.Database) 2>/dev/null"
    
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
    $mysqldumpPath = $null

    if ($LASTEXITCODE -eq 0) {
        $mysqldumpCheck = cmd /c "where mysqldump" 2>&1
        if ($LASTEXITCODE -eq 0) {
            $mysqldumpPath = "mysqldump"
        }
    }

    if (-not $mysqldumpPath -and (Test-Path "C:\xampp\mysql\bin\mysqldump.exe")) {
        $mysqldumpPath = "C:\xampp\mysql\bin\mysqldump.exe"
    }

    if ($mysqldumpPath) {
        try {
            $dumpArgs = @(
                "--default-character-set=utf8mb4",
                "-h", $prodInfo.Host,
                "-P", $prodInfo.Port,
                "-u", $prodInfo.User,
                "-p$($prodInfo.Pass)",
                "--single-transaction",
                "--routines",
                "--triggers",
                "--events",
                $prodInfo.Database
            )
            $process = Start-Process -FilePath $mysqldumpPath -ArgumentList $dumpArgs -NoNewWindow -Wait -PassThru -RedirectStandardOutput $tempUncompressed -RedirectStandardError "$env:TEMP\prod_dump_error_$timestamp.log"
            
            $fileSize = if (Test-Path $tempUncompressed) { (Get-Item $tempUncompressed).Length } else { 0 }
            
            if ($process.ExitCode -eq 0 -and $fileSize -gt 5000) {
                $dockerSuccess = $true
                Write-Output "   OK - $('{0:N0}' -f $fileSize) bytes"
            }
            else {
                Write-Output "   Dump pequeno ($fileSize bytes) - intentando alternativa..."
            }
        }
        catch {
            Write-Output "   Fallo - intentando alternativa..."
        }
    }
    else {
        Write-Output "   mysqldump no disponible en PATH ni en C:\\xampp\\mysql\\bin\\mysqldump.exe"
    }
}

# Opcion 3: Railway SSH
if (-not $dockerSuccess) {
    Write-Output "3. Intentando: Railway SSH..."
    $railwayOk = Try-RailwaySshDump -OutputFile $tempUncompressed
    if ($railwayOk) {
        $dockerSuccess = $true
        $fileSize = (Get-Item $tempUncompressed).Length
    }
}

# Opcion 4: Mostrar alternativas manuales
if (-not $dockerSuccess) {
    Write-Output "4. Metodos alternativos disponibles:"
    Write-Output ""
    Write-ColorOutput Yellow "ALTERNATIVA A: Descargar manualmente en Railway"
    Write-Output "  1. Abre: https://railway.app/"
    Write-Output "  2. Proyecto FreeLiga -> MySQL -> Backups"
    Write-Output "  3. Descarga el archivo SQL.GZ"
    Write-Output "  4. Guarda en carpeta: backups/"
    Write-Output "  5. Ejecuta: npm run restore"
    Write-Output ""
    Write-ColorOutput Yellow "ALTERNATIVA B: Revisar Railway CLI"
    Write-Output "  1. railway login"
    Write-Output "  2. railway whoami"
    Write-Output "  3. railway link"
    Write-Output "  4. railway service link MySQL"
    Write-Output "  5. Luego intenta: npm run sync"
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
        $restoreCmd = "mysql --default-character-set=utf8mb4 -u $($localInfo.User) -p$($localInfo.Pass) $($localInfo.Database) < /tmp/restore.sql"
        docker exec freeliga-mysql bash -c $restoreCmd 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            if (Test-Path $decompressed) { Remove-Item $decompressed }

            Write-Output ""
            Write-ColorOutput Yellow "4. Aplicando migraciones locales de Prisma..."
            # Tras sincronizar datos de PROD, aplicar migraciones versionadas valida el camino real de despliegue.
            $env:DATABASE_URL = $DATABASE_URL
            $schemaPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\packages\database\prisma\schema.prisma"))
            npx prisma migrate deploy --schema "$schemaPath" 2>&1 | Out-Null

            if ($LASTEXITCODE -ne 0) {
                Write-ColorOutput Red "[ERROR] Restauracion OK, pero fallo al aplicar migraciones Prisma."
                Write-Output "Ejecuta manualmente: npx prisma migrate deploy --schema packages/database/prisma/schema.prisma"
                Write-Output "Backup guardado: $backupFile"
                exit 1
            }

            Write-Output ""
            Write-ColorOutput Yellow "5. Verificando workspaces locales..."
            $workspaceOk = Ensure-WorkspaceDependencies -PackageName "@freesquash/database"
            if (-not $workspaceOk) {
                Write-ColorOutput Red "[ERROR] Sync completado, pero el workspace @freesquash/database sigue invalido."
                Write-Output "Prueba manualmente: npm install --workspaces"
                Write-Output "Backup guardado: $backupFile"
                exit 1
            }
            
            Write-Output ""
            Write-ColorOutput Green "COMPLETADO!"
            Write-Output ""
            Write-ColorOutput Green "TU BD LOCAL TIENE DATOS FRESCOS DE PRODUCCION"
            Write-ColorOutput Green "Y LAS MIGRACIONES LOCALES APLICADAS"
            Write-ColorOutput Green "Y LOS WORKSPACES VERIFICADOS"
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
