 Script rapido para hacer un backup antes de trabajar

Set-Location (Split-Path -Parent $PSScriptRoot)

Write-Host "Backup rapido antes de trabajar..." -ForegroundColor Cyan
& .\scripts\backup-database.ps1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "OK - Listo para trabajar de forma segura" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "WARNING - Backup fallo, pero puedes continuar" -ForegroundColor Yellow
}
