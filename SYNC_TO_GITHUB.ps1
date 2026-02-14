# BrandPortal-AI Master Sync Script (Enterprise Edition)
$targetFolder = "C:\Users\Kaj T. Sørensen\OneDrive\Dokumenter\GitHub\BrandProtal-AI"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
Write-Host "Syncing to $targetFolder..."
if (!(Test-Path $targetFolder)) { New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null }
Copy-Item -Path ".*" -Destination $targetFolder -Recurse -Force -Exclude ".git"
Write-Host "SUCCESS: GitHub folder updated." -ForegroundColor Green
pause