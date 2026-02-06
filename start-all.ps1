# Iniciar Tiendita + Mothership
# Este script inicia todos los servicios necesarios en paralelo

Write-Host "🚀 Iniciando Tiendita - Sistema Completo" -ForegroundColor Green
Write-Host ""

# Función para iniciar un servicio en una nueva ventana de PowerShell
function Start-Service {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Command
    )
    
    Write-Host "▶️  Iniciando $Name..." -ForegroundColor Cyan
    
    Start-Process pwsh -ArgumentList @(
        "-NoExit",
        "-Command",
        "Write-Host '═══════════════════════════════════════' -ForegroundColor Yellow; Write-Host '  $Name' -ForegroundColor Yellow; Write-Host '═══════════════════════════════════════' -ForegroundColor Yellow; cd '$Path'; $Command"
    )
}

# Iniciar servicios
Start-Service -Name "🔧 Backend Server" -Path "$PSScriptRoot\server" -Command "pnpm run dev"
Start-Sleep -Seconds 2

Start-Service -Name "🎨 Cliente Store" -Path "$PSScriptRoot\client" -Command "pnpm run dev"
Start-Sleep -Seconds 2

Start-Service -Name "🚢 Mothership Panel" -Path "$PSScriptRoot\mothership" -Command "pnpm run dev"

Write-Host ""
Write-Host "✅ Todos los servicios están iniciando..." -ForegroundColor Green
Write-Host ""
Write-Host "📋 URLs:" -ForegroundColor Yellow
Write-Host "   • Backend API:    http://localhost:3001/api" -ForegroundColor White
Write-Host "   • Cliente Store:  http://localhost:3005" -ForegroundColor White
Write-Host "   • Mothership:     http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: Cada servicio se abrió en su propia ventana" -ForegroundColor Gray
Write-Host "   Cerrá las ventanas para detener los servicios" -ForegroundColor Gray
Write-Host ""
