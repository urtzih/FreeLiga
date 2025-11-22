# FreeSquash League - Quick Setup Script
# Run this script from the project root

Write-Host "🏆 FreeSquash League - Setup Script" -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    Write-Host "   After installing, restart PowerShell and run this script again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
Write-Host ""

# Install root dependencies
npm install

# Install workspace dependencies
npm install --workspaces

Write-Host ""
Write-Host "✅ Dependencies installed!" -ForegroundColor Green
Write-Host ""

# Check if .env files exist
Write-Host "🔧 Checking environment files..." -ForegroundColor Yellow

$needsEnv = $false

if (-not (Test-Path "packages/database/.env")) {
    Write-Host "⚠️  packages/database/.env not found" -ForegroundColor Yellow
    $needsEnv = $true
}

if (-not (Test-Path "apps/api/.env")) {
    Write-Host "⚠️  apps/api/.env not found" -ForegroundColor Yellow
    $needsEnv = $true
}

if ($needsEnv) {
    Write-Host ""
    Write-Host "📝 You need to create .env files before continuing:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Create packages/database/.env with:" -ForegroundColor Cyan
    Write-Host '   DATABASE_URL="postgresql://postgres:password@localhost:5432/freesquash"' -ForegroundColor White
    Write-Host ""
    Write-Host "2. Create apps/api/.env with:" -ForegroundColor Cyan
    Write-Host '   PORT=3001' -ForegroundColor White
    Write-Host '   NODE_ENV=development' -ForegroundColor White
    Write-Host '   DATABASE_URL="postgresql://postgres:password@localhost:5432/freesquash"' -ForegroundColor White
    Write-Host '   JWT_SECRET="your-super-secret-jwt-key-change-in-production"' -ForegroundColor White
    Write-Host '   FRONTEND_URL="http://localhost:5173"' -ForegroundColor White
    Write-Host ""
    Write-Host "   (See .env.example files for templates)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Create your PostgreSQL database:" -ForegroundColor Cyan
    Write-Host "   psql -U postgres -c 'CREATE DATABASE freesquash;'" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run: npm run db:push" -ForegroundColor Cyan
    Write-Host ""
    exit 0
}

Write-Host "✅ Environment files found!" -ForegroundColor Green
Write-Host ""

# Ask if user wants to set up database
Write-Host "Do you want to set up the database now? (Y/N)" -ForegroundColor Cyan
$response = Read-Host

if ($response -eq "Y" -or $response -eq "y") {
    Write-Host ""
    Write-Host "🗄️  Setting up database..." -ForegroundColor Yellow
    
    # Generate Prisma client
    Write-Host "Generating Prisma client..." -ForegroundColor Yellow
    npm run db:generate
    
    # Push schema to database
    Write-Host ""
    Write-Host "Pushing schema to database..." -ForegroundColor Yellow
    npm run db:push
    
    Write-Host ""
    Write-Host "✅ Database setup complete!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start the development servers: npm run dev" -ForegroundColor White
Write-Host "2. Open http://localhost:5173 in your browser" -ForegroundColor White
Write-Host "3. Register a new account to get started" -ForegroundColor White
Write-Host ""
Write-Host "For more information, see README.md and walkthrough.md" -ForegroundColor Gray
Write-Host ""
