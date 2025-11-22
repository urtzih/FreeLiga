# Script de Prueba Rápida - FreeSquash League
# Este script pobla la base de datos con datos de ejemplo para pruebas

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  FreeSquash League - Script de Pruebas" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Variables de configuración
$API_URL = "http://localhost:3000"
$TOKEN = ""

# Función para hacer peticiones HTTP
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null
    )
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($TOKEN) {
        $headers["Authorization"] = "Bearer $TOKEN"
    }
    
    try {
        if ($Body) {
            $jsonBody = $Body | ConvertTo-Json -Depth 10
            $response = Invoke-RestMethod -Uri "$API_URL$Endpoint" -Method $Method -Headers $headers -Body $jsonBody
        }
        else {
            $response = Invoke-RestMethod -Uri "$API_URL$Endpoint" -Method $Method -Headers $headers
        }
        return $response
    }
    catch {
        Write-Host "❌ Error en $Method $Endpoint" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        return $null
    }
}

Write-Host "🔍 Verificando que el servidor esté funcionando..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "$API_URL/health" -TimeoutSec 5
    if ($health.StatusCode -eq 200) {
        Write-Host "✅ Servidor API funcionando correctamente" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ El servidor API no está disponible en $API_URL" -ForegroundColor Red
    Write-Host "   Por favor, inicia el servidor con: cd apps/api && npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📝 Paso 1: Creando usuario administrador..." -ForegroundColor Cyan

$adminData = @{
    email    = "admin@freesquash.com"
    password = "admin123"
    name     = "Administrador Principal"
    role     = "ADMIN"
}

$adminResponse = Invoke-ApiRequest -Method POST -Endpoint "/auth/register" -Body $adminData

if ($adminResponse) {
    $TOKEN = $adminResponse.token
    $ADMIN_PLAYER_ID = $adminResponse.user.player.id
    Write-Host "✅ Admin creado: $($adminResponse.user.email)" -ForegroundColor Green
    Write-Host "   Token guardado para peticiones siguientes" -ForegroundColor Gray
}
else {
    Write-Host "⚠️  Admin ya existe o hubo un error. Intentando login..." -ForegroundColor Yellow
    $loginData = @{
        email    = "admin@freesquash.com"
        password = "admin123"
    }
    $loginResponse = Invoke-ApiRequest -Method POST -Endpoint "/auth/login" -Body $loginData
    if ($loginResponse) {
        $TOKEN = $loginResponse.token
        $ADMIN_PLAYER_ID = $loginResponse.user.player.id
        Write-Host "✅ Login exitoso como admin" -ForegroundColor Green
    }
    else {
        Write-Host "❌ No se pudo autenticar. Verifica las credenciales." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "👥 Paso 2: Creando 8 jugadores de prueba..." -ForegroundColor Cyan

$players = @(
    @{ name = "Carlos García"; nickname = "Carlitos"; email = "carlos@email.com"; phone = "656123456" },
    @{ name = "María López"; nickname = "Mari"; email = "maria@email.com"; phone = "656234567" },
    @{ name = "Pedro Martínez"; nickname = "Pedrito"; email = "pedro@email.com"; phone = "656345678" },
    @{ name = "Ana Sánchez"; nickname = "Anita"; email = "ana@email.com"; phone = "656456789" },
    @{ name = "Juan Fernández"; nickname = "Juanillo"; email = "juan@email.com"; phone = "656567890" },
    @{ name = "Laura Gómez"; nickname = "Lau"; email = "laura@email.com"; phone = "656678901" },
    @{ name = "David Ruiz"; nickname = "Davi"; email = "david@email.com"; phone = "656789012" },
    @{ name = "Sara Díaz"; nickname = "Sarita"; email = "sara@email.com"; phone = "656890123" }
)

$playerIds = @()

foreach ($player in $players) {
    $playerData = @{
        email    = $player.email
        password = "pass123"
        name     = $player.name
        nickname = $player.nickname
        phone    = $player.phone
        role     = "PLAYER"
    }
    
    $response = Invoke-ApiRequest -Method POST -Endpoint "/auth/register" -Body $playerData
    
    if ($response) {
        $playerIds += $response.user.player.id
        Write-Host "  ✅ Creado: $($player.name) ($($player.nickname))" -ForegroundColor Green
    }
    else {
        Write-Host "  ⚠️  Ya existe: $($player.name)" -ForegroundColor Yellow
    }
    
    Start-Sleep -Milliseconds 200
}

Write-Host ""
Write-Host "📅 Paso 3: Creando temporada..." -ForegroundColor Cyan

$seasonData = @{
    name      = "Otoño 2024"
    startDate = "2024-09-01T00:00:00.000Z"
    endDate   = "2024-12-31T23:59:59.999Z"
}

$seasonResponse = Invoke-ApiRequest -Method POST -Endpoint "/seasons" -Body $seasonData

if ($seasonResponse) {
    $SEASON_ID = $seasonResponse.id
    Write-Host "✅ Temporada creada: $($seasonResponse.name)" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Temporada ya existe. Obteniendo lista..." -ForegroundColor Yellow
    $seasons = Invoke-ApiRequest -Method GET -Endpoint "/seasons"
    if ($seasons -and $seasons.Count -gt 0) {
        $SEASON_ID = $seasons[0].id
        Write-Host "✅ Usando temporada existente: $($seasons[0].name)" -ForegroundColor Green
    }
    else {
        Write-Host "❌ No se pudo crear ni obtener temporada" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🏆 Paso 4: Creando grupo..." -ForegroundColor Cyan

$groupData = @{
    name     = "Grupo A - Pruebas"
    seasonId = $SEASON_ID
}

$groupResponse = Invoke-ApiRequest -Method POST -Endpoint "/groups" -Body $groupData

if ($groupResponse) {
    $GROUP_ID = $groupResponse.id
    Write-Host "✅ Grupo creado: $($groupResponse.name)" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Grupo ya existe. Obteniendo lista..." -ForegroundColor Yellow
    $groups = Invoke-ApiRequest -Method GET -Endpoint "/groups"
    if ($groups -and $groups.Count -gt 0) {
        $GROUP_ID = $groups[0].id
        Write-Host "✅ Usando grupo existente: $($groups[0].name)" -ForegroundColor Green
    }
    else {
        Write-Host "❌ No se pudo crear ni obtener grupo" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "➕ Paso 5: Asignando jugadores al grupo..." -ForegroundColor Cyan

# Asignar Admin al grupo
$assignData = @{ playerId = $ADMIN_PLAYER_ID }
$null = Invoke-ApiRequest -Method POST -Endpoint "/groups/$GROUP_ID/players" -Body $assignData
Write-Host "  ✅ Admin asignado al grupo" -ForegroundColor Green

# Asignar resto de jugadores (si tenemos sus IDs)
if ($playerIds.Count -gt 0) {
    foreach ($playerId in $playerIds) {
        $assignData = @{ playerId = $playerId }
        $null = Invoke-ApiRequest -Method POST -Endpoint "/groups/$GROUP_ID/players" -Body $assignData
        Start-Sleep -Milliseconds 100
    }
    Write-Host "  ✅ $($playerIds.Count) jugadores asignados al grupo" -ForegroundColor Green
}
else {
    Write-Host "  ⚠️  Necesitas asignar jugadores manualmente (ver GUIA_PRUEBAS.md)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "⚽ Paso 6: Generando partidos de ejemplo..." -ForegroundColor Cyan
Write-Host "   (Nota: Esto requiere que los jugadores estén asignados al grupo)" -ForegroundColor Gray

# Obtener jugadores del grupo
$groupDetails = Invoke-ApiRequest -Method GET -Endpoint "/groups/$GROUP_ID"

if ($groupDetails -and $groupDetails.groupPlayers.Count -ge 2) {
    $groupPlayerIds = $groupDetails.groupPlayers | ForEach-Object { $_.player.id }
    
    # Generar 15 partidos de ejemplo
    $matchCount = 0
    $maxMatches = 15
    
    for ($i = 0; $i -lt $groupPlayerIds.Count -and $matchCount -lt $maxMatches; $i++) {
        for ($j = $i + 1; $j -lt $groupPlayerIds.Count -and $matchCount -lt $maxMatches; $j++) {
            # Generar resultado aleatorio
            $results = @(
                @{p1 = 3; p2 = 0 }, @{p1 = 3; p2 = 1 }, @{p1 = 3; p2 = 2 },
                @{p1 = 0; p2 = 3 }, @{p1 = 1; p2 = 3 }, @{p1 = 2; p2 = 3 }
            )
            $result = $results | Get-Random
            
            $matchData = @{
                date        = (Get-Date).AddDays( - ($matchCount)).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                player1Id   = $groupPlayerIds[$i]
                player2Id   = $groupPlayerIds[$j]
                gamesP1     = $result.p1
                gamesP2     = $result.p2
                matchStatus = "PLAYED"
            }
            
            $matchResponse = Invoke-ApiRequest -Method POST -Endpoint "/matches" -Body $matchData
            
            if ($matchResponse) {
                $matchCount++
                Write-Host "  ✅ Partido $matchCount/$maxMatches registrado: $($result.p1)-$($result.p2)" -ForegroundColor Green
            }
            
            Start-Sleep -Milliseconds 150
        }
    }
    
    Write-Host "✅ Total de partidos creados: $matchCount" -ForegroundColor Green
}
else {
    Write-Host "⚠️  No hay suficientes jugadores en el grupo para generar partidos" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  ✅ Script completado exitosamente" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Resumen de datos creados:" -ForegroundColor Cyan
Write-Host "   • 1 Administrador: admin@freesquash.com (password: admin123)" -ForegroundColor White
Write-Host "   • 8 Jugadores: passwords: 'pass123'" -ForegroundColor White
Write-Host "   • 1 Temporada: Otoño 2024" -ForegroundColor White
Write-Host "   • 1 Grupo: Grupo A - Pruebas" -ForegroundColor White
Write-Host "   • ~15 Partidos generados aleatoriamente" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Accede a la aplicación:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "   Login Admin: admin@freesquash.com / admin123" -ForegroundColor Yellow
Write-Host "   Login Jugador: carlos@email.com / pass123" -ForegroundColor Yellow
Write-Host ""
Write-Host "📖 Consulta GUIA_PRUEBAS.md para más información" -ForegroundColor Gray
Write-Host ""
