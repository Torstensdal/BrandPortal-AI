# BRANDPORTAL-AI RESTORATION
$ErrorActionPreference = "Stop"

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🔄 BRANDPORTAL-AI RESTORATION                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Find ZIP
Write-Host "📦 Søger ZIP..." -ForegroundColor Yellow
$zipPaths = @(
    "$env:USERPROFILE\OneDrive\Dokumenter\BrandPortal_Authority_Mirror_FIXED_V13 (5).zip",
    "$env:USERPROFILE\Downloads\BrandPortal_Authority_Mirror_FIXED_V13 (5).zip"
)
$zipPath = $zipPaths | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $zipPath) {
    $zipPath = Read-Host "Indtast ZIP sti"
}
Write-Host "  ✅ Fundet: $zipPath" -ForegroundColor Green

# Udpak
Write-Host "`n📂 Udpakker..." -ForegroundColor Yellow
$temp = "temp_$(Get-Date -Format 'HHmmss')"
Expand-Archive $zipPath $temp -Force
Write-Host "  ✅ Udpakket" -ForegroundColor Green

# Find App.tsx
Write-Host "`n🔍 Søger App.tsx..." -ForegroundColor Yellow
$appFile = Get-ChildItem $temp -Filter "App.tsx" -Recurse | Select-Object -First 1
if (-not $appFile) {
    Write-Host "  ❌ App.tsx ikke fundet!" -ForegroundColor Red
    Remove-Item $temp -Recurse -Force
    Read-Host "Tryk Enter"
    exit 1
}

$sourceRoot = $appFile.Directory.FullName
Write-Host "  ✅ Fundet i: $($appFile.Directory.Name)" -ForegroundColor Green

# Backup
Write-Host "`n💾 Backup..." -ForegroundColor Yellow
$backup = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
if (Test-Path "src") {
    Copy-Item "src" $backup -Recurse -Force
    Write-Host "  ✅ Backup: $backup" -ForegroundColor Green
}

# Kopier ALT
Write-Host "`n📋 Kopierer filer..." -ForegroundColor Yellow
if (Test-Path "src") { Remove-Item "src" -Recurse -Force }
Copy-Item $sourceRoot "src" -Recurse -Force
Write-Host "  ✅ src/ kopieret" -ForegroundColor Green

# Cleanup
Remove-Item $temp -Recurse -Force

# Fixes
Write-Host "`n🔧 Tilføjer fixes..." -ForegroundColor Yellow

# _redirects
if (-not (Test-Path "public")) { mkdir public | Out-Null }
"/*    /index.html   200" | Out-File "public/_redirects" -Encoding utf8
Write-Host "  ✅ _redirects" -ForegroundColor Green

# index.html
if (-not (Test-Path "index.html")) {
@"
<!DOCTYPE html>
<html lang="da">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BrandPortal-AI</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
"@ | Out-File "index.html" -Encoding utf8
    Write-Host "  ✅ index.html" -ForegroundColor Green
}

# main.tsx med debug
@"
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

console.log('🚀 [DEBUG] React starting...')
const root = document.getElementById('root')

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
  console.log('✅ [DEBUG] React mounted!')
}
"@ | Out-File "src/main.tsx" -Encoding utf8
Write-Host "  ✅ main.tsx med debug" -ForegroundColor Green

# index.css
if (-not (Test-Path "src/index.css")) {
    "@tailwind base;`n@tailwind components;`n@tailwind utilities;" | Out-File "src/index.css" -Encoding utf8
    Write-Host "  ✅ index.css" -ForegroundColor Green
}

Write-Host "`n✅ RESTORATION KOMPLET!" -ForegroundColor Green
Write-Host "`n📋 Test nu:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""

$test = Read-Host "Start npm run dev nu? (Y/N)"
if ($test -eq "Y" -or $test -eq "y") {
    Start-Job -ScriptBlock { Start-Sleep 3; Start-Process "http://localhost:5173" } | Out-Null
    npm run dev
}
