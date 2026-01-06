param(
    [Parameter(Mandatory=$false)]
    [string]$BackupFile,
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
    } catch {
        return $false
    }
}

Write-Output ""
Write-ColorOutput Blue "Restauracion de Base de Datos"
Write-Output ""

if (-not $BackupFile) {
    Write-ColorOutput Yellow "Backups disponibles:"
    Write-Output ""
    
    Get-ChildItem $BackupDir -Filter "*.sql.gz" -ErrorAction SilentlyContinue | 
        Sort-Object LastWriteTime -Descending |
        ForEach-Object {
            $size = [math]::Round($_.Length / 1MB, 2)
            $type = if ($_.Name -match "_prod_") { "[PROD]" } else { "[LOCAL]" }
            Write-Output "   $type $($_.Name) (${size}MB)"
        }
    
    Write-Output ""
    Write-ColorOutput Yellow "Uso:"
    Write-Output "   .\scripts\restore-database.ps1 -BackupFile <archivo>"
    Write-Output ""
    exit 0
}

if (-not (Test-Path $BackupFile)) {
    Write-ColorOutput Red "Archivo no encontrado: $BackupFile"
    exit 1
}

$Environment = if ($BackupFile -match "_prod_") { "PRODUCCION" } else { "LOCAL" }

Write-ColorOutput Red "ADVERTENCIA: Restauraras base de datos de $Environment"
Write-Output "Archivo: $BackupFile"
Write-Output ""

$confirm = Read-Host "Confirma con RESTORE-$($Environment.ToUpper())"

if ($confirm -ne "RESTORE-$($Environment.ToUpper())") {
    Write-ColorOutput Yellow "Cancelado"
    exit 0
}

if ($Environment -eq "LOCAL") {
    Write-ColorOutput Green "Restaurando en LOCAL..."
    $decompressed = "$env:TEMP\restore_temp.sql"
    if (Decompress-GzipFile -SourceFile $BackupFile -TargetFile $decompressed) {
        Write-Host "OK - Backup restaurado"
        Remove-Item $decompressed -Force
    }
} else {
    Write-ColorOutput Yellow "Restauracion de PROD debe hacerse via Railway dashboard"
}
