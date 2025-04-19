# PowerShell script to commit and push changes
# Check status
Write-Host "Checking git status..." -ForegroundColor Cyan
git status

# Create commit
Write-Host "Committing changes..." -ForegroundColor Cyan
git add .
git commit -m "Fix breadcrumb app with improved features and error handling"

# Instructions for pushing
Write-Host "`nTo push your changes, replace USERNAME and TOKEN in this command:" -ForegroundColor Yellow
Write-Host "git push https://USERNAME:TOKEN@github.com/rungerunge/breadcrumb-app.git main" -ForegroundColor Green
Write-Host "`nOr simply run:" -ForegroundColor Yellow
Write-Host "git push origin main" -ForegroundColor Green
Write-Host "and enter your credentials when prompted.`n" -ForegroundColor Yellow 