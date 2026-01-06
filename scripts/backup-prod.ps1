param(
    [string]$BackupDir = ".\backups"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "  BACKUP DE PRODUCCION" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "Estás a punto de hacer backup de la BD de PRODUCCION" -ForegroundColor Yellow
Write-Host ""
Write-Host "Este comando:" -ForegroundColor Green
Write-Host "  1. Solo LEE datos (no modifica nada)"
Write-Host "  2. Crea archivo comprimido en backups/"
Write-Host "  3. NO restaura, solo guarda copia"
Write-Host ""

$confirm = Read-Host "Escribe PROD-BACKUP para confirmar"

if ($confirm -eq "PROD-BACKUP") {
    Write-Host ""
    Write-Host "Iniciando backup de produccion..." -ForegroundColor Green
    Write-Host ""
    & .\scripts\backup-database-universal.ps1 -Environment prod -BackupDir $BackupDir
} else {
    Write-Host ""
    Write-Host "Confirmacion incorrecta. Operacion cancelada." -ForegroundColor Yellow
    exit 1
}
