# BrandPortal-AI Master Sync Script (Enterprise Edition)
$targetFolder = "C:\Users\Kaj T. Sørensen\OneDrive\Dokumenter\GitHub\BrandProtal-AI"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "   BRANDPORTAL-AI SAFE SYNC ENGINE" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

if (Test-Path $targetFolder) {
    try {
        $backupFolder = "$($targetFolder)_BACKUP_$timestamp"
        Write-Host "[1/3] Forsøger at tage backup..." -ForegroundColor Yellow
        Rename-Item -Path $targetFolder -NewName $backupFolder -ErrorAction Stop
        Write-Host "      + Backup oprettet: $backupFolder" -ForegroundColor Gray
    } catch {
        Write-Host "      ! Mappen er i brug (måske af VS Code eller Git). Overskriver direkte..." -ForegroundColor Magenta
    }
}

Write-Host "[2/3] Synkroniserer filer..." -ForegroundColor Yellow
# -Force fjerner 'Already exists' fejlen
New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null

# Kopier alt undtagen selve scriptet
Copy-Item -Path ".*" -Destination $targetFolder -Recurse -Force -Exclude "SYNC_TO_GITHUB.ps1"

Write-Host "[3/3] SUCCES: GitHub mappe er nu opdateret." -ForegroundColor Green
Write-Host "----------------------------------------------"
Write-Host "Klar til deployment! Kør 'git add .', 'git commit' og 'git push'." -ForegroundColor White
pause