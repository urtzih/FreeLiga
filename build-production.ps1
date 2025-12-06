# Build script para producción - FreeSquash League
# Ejecutar con: .\build-production.ps1

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "🏗️  FreeSquash League - Build Producción" -ForegroundColor Cyan  
Write-Host "=====================================" -ForegroundColor Cyan

# 1. Limpiar builds anteriores
Write-Host "`n🧹 Limpiando builds anteriores..." -ForegroundColor Yellow
if (Test-Path "apps/api/dist") {
    Remove-Item -Recurse -Force "apps/api/dist"
}
if (Test-Path "apps/web/dist") {
    Remove-Item -Recurse -Force "apps/web/dist"
}

# 2. Instalar dependencias
Write-Host "`n📦 Instalando dependencias..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
    exit 1
}

# 3. Generar Prisma Client
Write-Host "`n🔧 Generando Prisma Client..." -ForegroundColor Yellow
npm run db:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error generando Prisma Client" -ForegroundColor Red
    exit 1
}

# 4. Build backend
Write-Host "`n⚙️  Construyendo backend (TypeScript → JavaScript)..." -ForegroundColor Yellow
Set-Location apps/api
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error construyendo backend" -ForegroundColor Red
    Set-Location ../..
    exit 1
}
Set-Location ../..

# 5. Build frontend
Write-Host "`n🎨 Construyendo frontend (React → HTML/CSS/JS)..." -ForegroundColor Yellow
Set-Location apps/web
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error construyendo frontend" -ForegroundColor Red
    Set-Location ../..
    exit 1
}
Set-Location ../..

# 6. Crear paquete de distribución
Write-Host "`n📦 Creando paquete de distribución..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$distFolder = "dist-production-$timestamp"

New-Item -ItemType Directory -Force -Path $distFolder | Out-Null

# Copiar backend
Write-Host "   - Copiando backend..."
Copy-Item -Recurse "apps/api/dist" "$distFolder/api"
Copy-Item "apps/api/package.json" "$distFolder/api/"
Copy-Item "apps/api/package-lock.json" "$distFolder/api/" -ErrorAction SilentlyContinue

# Copiar frontend
Write-Host "   - Copiando frontend..."
Copy-Item -Recurse "apps/web/dist" "$distFolder/www"

# Copiar Prisma
Write-Host "   - Copiando Prisma..."
Copy-Item -Recurse "packages/database" "$distFolder/database"

# Copiar archivos de configuración
Write-Host "   - Copiando configuración..."
Copy-Item ".env.production.example" "$distFolder/.env.example"
Copy-Item "PRODUCTION_CONFIG.md" "$distFolder/" -ErrorAction SilentlyContinue

# Crear README para el paquete
@"
# FreeSquash League - Paquete de Producción

## Contenido
- api/: Backend Node.js compilado
- www/: Frontend React compilado (archivos estáticos)
- database/: Esquema y migraciones de Prisma
- .env.example: Plantilla de variables de entorno

## Instalación en el Servidor

1. Copiar archivos al servidor
2. Configurar .env con las credenciales correctas
3. Instalar dependencias: cd api && npm install --production
4. Generar Prisma Client: cd database && npx prisma generate
5. Ejecutar migraciones: npx prisma db push
6. Iniciar servidor: node api/server.js

Consulta deployment_guide.md para más detalles.
"@ | Out-File -FilePath "$distFolder/README.txt" -Encoding UTF8

Write-Host "`n✅ Build completado exitosamente!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "📁 Archivos generados:" -ForegroundColor White
Write-Host "   Backend:  $distFolder/api/" -ForegroundColor Gray
Write-Host "   Frontend: $distFolder/www/" -ForegroundColor Gray
Write-Host "   Database: $distFolder/database/" -ForegroundColor Gray
Write-Host "`n📦 Paquete completo en: $distFolder/" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan

Write-Host "`n💡 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Revisar .env.example y configurar variables de producción" -ForegroundColor White
Write-Host "   2. Subir el contenido de '$distFolder' al servidor" -ForegroundColor White
Write-Host "   3. Seguir las instrucciones en deployment_guide.md" -ForegroundColor White
Write-Host ""
