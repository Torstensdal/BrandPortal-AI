# ═══════════════════════════════════════════════════════════════
# KOMPLET VALIDERINGS-SCRIPT - Tjekker ALT før du starter
# ═══════════════════════════════════════════════════════════════

param(
    [Parameter(Mandatory=$false)]
    [string]$ZipPath,
    [Parameter(Mandatory=$false)]
    [string]$ExtractPath = "validation_test"
)

$ErrorActionPreference = 'Continue'

Write-Host @"

 ██╗   ██╗ █████╗ ██╗     ██╗██████╗  █████╗ ████████╗██╗ ██████╗ ███╗   ██╗
 ██║   ██║██╔══██╗██║     ██║██╔══██╗██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║
 ██║   ██║███████║██║     ██║██║  ██║███████║   ██║   ██║██║   ██║██╔██╗ ██║
 ╚██╗ ██╔╝██╔══██║██║     ██║██║  ██║██╔══██║   ██║   ██║██║   ██║██║╚██╗██║
  ╚████╔╝ ██║  ██║███████╗██║██████╔╝██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║
   ╚═══╝  ╚═╝  ╚═╝╚══════╝╚═╝╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
                                                                              
                    TJEKKER ALT - INGEN OVERRASKELSER

"@ -ForegroundColor Cyan

if (-not $ZipPath) {
    Write-Host "🔍 Søger efter nyeste ZIP i Downloads...`n" -ForegroundColor Yellow
    
    $zips = Get-ChildItem "$env:USERPROFILE\Downloads" -Filter "*.zip" | 
        Where-Object { $_.Name -match "brandportal|brand" } |
        Sort-Object LastWriteTime -Descending
    
    if ($zips.Count -eq 0) {
        Write-Host "❌ Ingen BrandPortal ZIP fundet i Downloads!" -ForegroundColor Red
        exit 1
    }
    
    $ZipPath = $zips[0].FullName
}

if (-not (Test-Path $ZipPath)) {
    Write-Host "❌ ZIP fil findes ikke: $ZipPath" -ForegroundColor Red
    exit 1
}

$zipInfo = Get-Item $ZipPath
Write-Host "📦 ZIP: $($zipInfo.Name)" -ForegroundColor Cyan
Write-Host "   Størrelse: $([math]::Round($zipInfo.Length/1KB, 2)) KB" -ForegroundColor Gray
Write-Host ""

Write-Host "📂 Udpakker til test folder..." -ForegroundColor Yellow

if (Test-Path $ExtractPath) {
    Remove-Item $ExtractPath -Recurse -Force
}

Expand-Archive $ZipPath -DestinationPath $ExtractPath -Force
Write-Host "   ✅ Udpakket`n" -ForegroundColor Green

$projectRoot = Get-ChildItem $ExtractPath -Recurse -Filter "package.json" -File | 
    Select-Object -First 1 | 
    ForEach-Object { $_.DirectoryName }

if (-not $projectRoot) {
    Write-Host "❌ Ingen package.json fundet!" -ForegroundColor Red
    exit 1
}

Set-Location $projectRoot

Write-Host "📊 PROJEKT STATISTIK" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

$allFiles = Get-ChildItem -Recurse -File -Exclude "node_modules","dist" -ErrorAction SilentlyContinue
$tsxFiles = $allFiles | Where-Object { $_.Extension -eq ".tsx" }
$tsFiles = $allFiles | Where-Object { $_.Extension -eq ".ts" }

Write-Host "   Totalt filer: $($allFiles.Count)" -ForegroundColor White
Write-Host "   TypeScript filer (.tsx): $($tsxFiles.Count)" -ForegroundColor Gray
Write-Host "   TypeScript filer (.ts): $($tsFiles.Count)`n" -ForegroundColor Gray

Write-Host "🔍 TJEK 1: PLACEHOLDER DETECTION" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

$placeholderPatterns = @(
    "PADDING //",
    "PLACEHOLDER",
    "TODO:",
    "FIXME:",
    "XXX",
    "STUB",
    "NOT IMPLEMENTED"
)

$filesWithPlaceholders = @()

foreach ($file in ($tsxFiles + $tsFiles)) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    
    foreach ($pattern in $placeholderPatterns) {
        if ($content -match $pattern) {
            $filesWithPlaceholders += [PSCustomObject]@{
                File = $file.Name
                Pattern = $pattern
            }
            break
        }
    }
}

if ($filesWithPlaceholders.Count -gt 0) {
    Write-Host "   ❌ FANDT $($filesWithPlaceholders.Count) FILER MED PLACEHOLDERS!" -ForegroundColor Red
    $filesWithPlaceholders | Select-Object -First 10 | ForEach-Object {
        Write-Host "   • $($_.File) - '$($_.Pattern)'" -ForegroundColor Red
    }
    if ($filesWithPlaceholders.Count -gt 10) {
        Write-Host "   ... og $($filesWithPlaceholders.Count - 10) flere" -ForegroundColor Gray
    }
    Write-Host ""
} else {
    Write-Host "   ✅ Ingen placeholders fundet`n" -ForegroundColor Green
}

Write-Host "🔍 TJEK 2: TOMME KOMPONENTER" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

$suspiciousFiles = @()

foreach ($file in $tsxFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { 
        $suspiciousFiles += [PSCustomObject]@{
            File = $file.Name
            Reason = "TOM FIL"
        }
        continue 
    }
    
    $codeLines = ($content -split "`n" | Where-Object { 
        $_ -match '\S' -and $_ -notmatch '^\s*//' 
    }).Count
    
    if ($codeLines -lt 10) {
        $suspiciousFiles += [PSCustomObject]@{
            File = $file.Name
            Reason = "KUN $codeLines LINJER"
        }
    }
}

if ($suspiciousFiles.Count -gt 0) {
    Write-Host "   ⚠️  FANDT $($suspiciousFiles.Count) MISTÆNKELIGE FILER!" -ForegroundColor Yellow
    $suspiciousFiles | Select-Object -First 10 | ForEach-Object {
        Write-Host "   • $($_.File) - $($_.Reason)" -ForegroundColor Yellow
    }
    if ($suspiciousFiles.Count -gt 10) {
        Write-Host "   ... og $($suspiciousFiles.Count - 10) flere" -ForegroundColor Gray
    }
    Write-Host ""
} else {
    Write-Host "   ✅ Alle komponenter ser ok ud`n" -ForegroundColor Green
}

Write-Host "🔍 TJEK 3: KRITISKE KOMPONENTER (Viser indhold)" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

$criticalComponents = @(
    "src\App.tsx",
    "src\components\SideNav.tsx",
    "src\components\HeaderNav.tsx"
)

foreach ($comp in $criticalComponents) {
    $fullPath = Join-Path $projectRoot $comp
    
    if (Test-Path $fullPath) {
        Write-Host "📄 $comp" -ForegroundColor Cyan
        Write-Host "   ─────────────────────────────────────" -ForegroundColor DarkGray
        
        $content = Get-Content $fullPath | Select-Object -First 12
        $content | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
        
        Write-Host "   ─────────────────────────────────────`n" -ForegroundColor DarkGray
    } else {
        Write-Host "❌ $comp - MANGLER!`n" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " SAMLET RESULTAT" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$totalIssues = $filesWithPlaceholders.Count + $suspiciousFiles.Count

if ($totalIssues -eq 0) {
    Write-Host "✅ PROJEKTET SER GODT UD!" -ForegroundColor Green
    Write-Host "🚀 DU KAN TRYGT FORTSÆTTE!`n" -ForegroundColor Green
} else {
    Write-Host "❌ PROJEKTET HAR $totalIssues PROBLEMER!" -ForegroundColor Red
    Write-Host ""
    if ($filesWithPlaceholders.Count -gt 0) {
        Write-Host "   • $($filesWithPlaceholders.Count) filer med placeholders" -ForegroundColor Red
    }
    if ($suspiciousFiles.Count -gt 0) {
        Write-Host "   • $($suspiciousFiles.Count) tomme/minimale komponenter" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "⚠️  GÅ IKKE VIDERE - GÅ TILBAGE TIL GEMINI!" -ForegroundColor Yellow
}

Write-Host ""

$cleanup = Read-Host "Slet test folder? (Y/N)"
if ($cleanup -eq "Y" -or $cleanup -eq "y") {
    Set-Location ..
    Remove-Item $ExtractPath -Recurse -Force
    Write-Host "✅ Test folder slettet" -ForegroundColor Green
}
