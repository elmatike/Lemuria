# Deploy Lemuria a GitHub
# Uso: .\deploy-lemuria.ps1 "mensaje del commit"

param(
    [string]$Message = "Auto-deploy: cambios en la web"
)

$ErrorActionPreference = "Stop"
Set-Location "C:\Users\tike\Documents\Lemuria_Netlify"

Write-Host "🚀 Deploying Lemuria..." -ForegroundColor Cyan

git add .
$hasChanges = (git status --porcelain)

if ($hasChanges) {
    git commit -m $Message
    git push origin main
    Write-Host "✅ Deployed: $Message" -ForegroundColor Green
} else {
    Write-Host "⏭️  No changes to deploy" -ForegroundColor Yellow
}
