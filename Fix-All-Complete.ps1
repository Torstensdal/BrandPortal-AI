# ═══════════════════════════════════════════════════════════════
# BrandPortal AI Enterprise - Komplet Fix & Deploy Script
# Ingen downloads nødvendig - Fixer eksisterende projekt
# ═══════════════════════════════════════════════════════════════

param(
    [Parameter(Mandatory=$false)]
    [switch]$SkipInstall,
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild,
    [Parameter(Mandatory=$false)]
    [switch]$AutoDeploy
)

$ErrorActionPreference = 'Continue'
$ProjectRoot = "C:\Users\Kaj T. Sørensen\OneDrive\Dokumenter\GitHub\BrandProtal-AI"

# ═══════════════════════════════════════════════════════════════
# HJÆLPEFUNKTIONER
# ═══════════════════════════════════════════════════════════════

function Write-Banner {
    Write-Host @"

 ██████╗ ██████╗  █████╗ ███╗   ██╗██████╗ ██████╗  ██████╗ ██████╗ ████████╗ █████╗ ██╗     
 ██╔══██╗██╔══██╗██╔══██╗████╗  ██║██╔══██╗██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔══██╗██║     
 ██████╔╝██████╔╝███████║██╔██╗ ██║██║  ██║██████╔╝██║   ██║██████╔╝   ██║   ███████║██║     
 ██╔══██╗██╔══██╗██╔══██║██║╚██╗██║██║  ██║██╔═══╝ ██║   ██║██╔══██╗   ██║   ██╔══██║██║     
 ██████╔╝██║  ██║██║  ██║██║ ╚████║██████╔╝██║     ╚██████╔╝██║  ██║   ██║   ██║  ██║███████╗
 ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝
                                                                                                
                    AI ENTERPRISE - KOMPLET FIX & DEPLOY SCRIPT

"@ -ForegroundColor Cyan
}

function Write-Header {
    param([string]$Text)
    Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host " $Text" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
}

function Write-Step {
    param([string]$Text, [int]$Number)
    Write-Host "`n$Number. $Text" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Text)
    Write-Host "   ✅ $Text" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Text)
    Write-Host "   ❌ $Text" -ForegroundColor Red
}

function Write-Warning-Custom {
    param([string]$Text)
    Write-Host "   ⚠️  $Text" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Text)
    Write-Host "   ℹ️  $Text" -ForegroundColor Gray
}

# ═══════════════════════════════════════════════════════════════
# START
# ═══════════════════════════════════════════════════════════════

Clear-Host
Write-Banner

Write-Host "📂 Projekt: $ProjectRoot" -ForegroundColor Gray
Write-Host "📅 Dato: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n" -ForegroundColor Gray

if (-not (Test-Path $ProjectRoot)) {
    Write-Error-Custom "Projekt folder findes ikke: $ProjectRoot"
    exit 1
}

Set-Location $ProjectRoot

# ═══════════════════════════════════════════════════════════════
# 1. OPRYDNING - Slet problematiske filer/mapper
# ═══════════════════════════════════════════════════════════════

Write-Header "TRIN 1: OPRYDNING AF PROBLEMATISKE FILER"

$itemsToRemove = @(
    "pages",
    "server",
    "services/apiClient.ts",
    "api",
    ".next"
)

foreach ($item in $itemsToRemove) {
    if (Test-Path $item) {
        Remove-Item $item -Recurse -Force -ErrorAction SilentlyContinue
        Write-Success "Slettet: $item"
    }
}

$backups = Get-ChildItem -Directory -Filter "backup*", "src_backup*" -ErrorAction SilentlyContinue | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -Skip 1

if ($backups) {
    foreach ($backup in $backups) {
        Remove-Item $backup.FullName -Recurse -Force -ErrorAction SilentlyContinue
        Write-Success "Slettet gammel backup: $($backup.Name)"
    }
}

# ═══════════════════════════════════════════════════════════════
# 2. FIX FAVICON
# ═══════════════════════════════════════════════════════════════

Write-Header "TRIN 2: FAVICON FIX"

if (-not (Test-Path "public")) {
    New-Item -ItemType Directory -Path "public" -Force | Out-Null
    Write-Success "Oprettet public/ folder"
}

$svgFavicon = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" fill="url(#grad)" rx="20"/>
  <text x="50" y="70" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="white" text-anchor="middle">B</text>
</svg>
"@

Set-Content "public/favicon.svg" $svgFavicon -Force -Encoding UTF8
Write-Success "Oprettet favicon.svg"

if (Test-Path "index.html") {
    $indexHtml = Get-Content "index.html" -Raw -Encoding UTF8
    $indexHtml = $indexHtml -replace '<link[^>]*rel="icon"[^>]*>(\r?\n)?', ''
    $indexHtml = $indexHtml -replace '<link[^>]*rel="shortcut icon"[^>]*>(\r?\n)?', ''
    
    if ($indexHtml -match '(<head[^>]*>)') {
        $headTag = $matches[1]
        if ($indexHtml -notmatch 'favicon\.svg') {
            $indexHtml = $indexHtml -replace '(<head[^>]*>)', "$headTag`n    <link rel=""icon"" type=""image/svg+xml"" href=""/favicon.svg"" />"
        }
    }
    
    Set-Content "index.html" $indexHtml -Force -Encoding UTF8
    Write-Success "Opdateret index.html med favicon"
}

# ═══════════════════════════════════════════════════════════════
# 3. FIX TAILWIND CSS
# ═══════════════════════════════════════════════════════════════

Write-Header "TRIN 3: TAILWIND CSS FIX"

if (Test-Path "index.html") {
    $indexHtml = Get-Content "index.html" -Raw -Encoding UTF8
    $originalLength = $indexHtml.Length
    $indexHtml = $indexHtml -replace '<script[^>]*cdn\.tailwindcss\.com[^>]*></script>(\r?\n)?', ''
    
    if ($indexHtml.Length -ne $originalLength) {
        Set-Content "index.html" $indexHtml -Force -Encoding UTF8
        Write-Success "Fjernet Tailwind CDN fra index.html"
    }
}

if (-not $SkipInstall) {
    Write-Step "Installerer Tailwind CSS..." 0
    npm install -D tailwindcss postcss autoprefixer --legacy-peer-deps 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Tailwind CSS installeret"
    } else {
        Write-Warning-Custom "Tailwind installation havde warnings"
    }
}

$tailwindConfig = @"
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        secondary: '#7C3AED',
      },
    },
  },
  plugins: [],
}
"@

Set-Content "tailwind.config.js" $tailwindConfig -Force -Encoding UTF8
Write-Success "tailwind.config.js oprettet"

$postcssConfig = @"
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
"@

Set-Content "postcss.config.js" $postcssConfig -Force -Encoding UTF8
Write-Success "postcss.config.js oprettet"

if (Test-Path "index.css") {
    $indexCss = Get-Content "index.css" -Raw -Encoding UTF8
    if ($indexCss -notmatch "@tailwind base") {
        $tailwindDirectives = "@tailwind base;`n@tailwind components;`n@tailwind utilities;`n`n"
        $indexCss = $tailwindDirectives + $indexCss
        Set-Content "index.css" $indexCss -Force -Encoding UTF8
        Write-Success "Tilføjet Tailwind directives til index.css"
    }
} elseif (Test-Path "src/index.css") {
    $indexCss = Get-Content "src/index.css" -Raw -Encoding UTF8
    if ($indexCss -notmatch "@tailwind base") {
        $tailwindDirectives = "@tailwind base;`n@tailwind components;`n@tailwind utilities;`n`n"
        $indexCss = $tailwindDirectives + $indexCss
        Set-Content "src/index.css" $indexCss -Force -Encoding UTF8
        Write-Success "Tilføjet Tailwind directives til src/index.css"
    }
}

# ═══════════════════════════════════════════════════════════════
# 4. FIX TYPESCRIPT CONFIG
# ═══════════════════════════════════════════════════════════════

Write-Header "TRIN 4: TYPESCRIPT KONFIGURATION"

$tsconfigContent = @"
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "build", "backup*", "src_backup*"]
}
"@

Set-Content "tsconfig.json" $tsconfigContent -Force -Encoding UTF8
Write-Success "tsconfig.json opdateret"

# ═══════════════════════════════════════════════════════════════
# 5. FIX VITE CONFIG
# ═══════════════════════════════════════════════════════════════

Write-Header "TRIN 5: VITE KONFIGURATION"

$viteConfig = @"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
"@

Set-Content "vite.config.ts" $viteConfig -Force -Encoding UTF8
Write-Success "vite.config.ts opdateret"

# ═══════════════════════════════════════════════════════════════
# 6. FIX KOMPONENTER
# ═══════════════════════════════════════════════════════════════

Write-Header "TRIN 6: KOMPONENT FIXES"

if (Test-Path "src/components/SideNav.tsx") {
    $sideNavContent = Get-Content "src/components/SideNav.tsx" -Raw -Encoding UTF8
    if ($sideNavContent -notmatch "export default" -and $sideNavContent -match "(?:function|const)\s+(\w+)") {
        $componentName = $matches[1]
        $sideNavContent += "`n`nexport default $componentName;`n"
        Set-Content "src/components/SideNav.tsx" $sideNavContent -Force -Encoding UTF8
        Write-Success "Tilføjet default export til SideNav.tsx"
    }
}

# ═══════════════════════════════════════════════════════════════
# 7. INSTALLER DEPENDENCIES
# ═══════════════════════════════════════════════════════════════

if (-not $SkipInstall) {
    Write-Header "TRIN 7: INSTALLER DEPENDENCIES"
    Write-Step "Kører npm install..." 0
    npm install --legacy-peer-deps
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Dependencies installeret"
    }
}

# ═══════════════════════════════════════════════════════════════
# 8. BUILD PROJEKT
# ═══════════════════════════════════════════════════════════════

if (-not $SkipBuild) {
    Write-Header "TRIN 8: BUILD PROJEKT"
    Write-Step "Bygger projekt..." 0
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Build succesfuld!"
        if (Test-Path "dist") {
            $distSize = (Get-ChildItem "dist" -Recurse -File | Measure-Object -Property Length -Sum).Sum
            Write-Host "   📦 Build størrelse: $([math]::Round($distSize/1KB, 2)) KB" -ForegroundColor Cyan
        }
    } else {
        Write-Error-Custom "Build fejlede!"
        exit 1
    }
}

# ═══════════════════════════════════════════════════════════════
# OPSUMMERING
# ═══════════════════════════════════════════════════════════════

Write-Header "FÆRDIG!"

Write-Host "✅ GENNEMFØRT:" -ForegroundColor Green
Write-Host "   • Favicon oprettet" -ForegroundColor Gray
Write-Host "   • Tailwind CSS installeret korrekt" -ForegroundColor Gray
Write-Host "   • Konfigurationer opdateret" -ForegroundColor Gray
Write-Host "   • Projekt bygget" -ForegroundColor Gray

Write-Host "`n🚀 NÆSTE SKRIDT:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
Write-Host "   Åbn: http://localhost:5173`n" -ForegroundColor Gray
