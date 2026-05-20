# Watch Lemuria files and auto-deploy on change
# Ejecutar: .\watch-lemuria.ps1

$watchPath = "C:\Users\tike\Documents\Lemuria_Netlify"
$filter = "*.html"

Write-Host "👀 Watching Lemuria files for changes..." -ForegroundColor Cyan
Write-Host "   Path: $watchPath" -ForegroundColor Gray
Write-Host "   Filter: $filter" -ForegroundColor Gray
Write-Host "   Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $watchPath
$watcher.Filter = $filter
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

$debounce = $null

$action = {
    $path = $Event.SourceEventArgs.FullPath
    $changeType = $Event.SourceEventArgs.ChangeType

    if ($debounce -and $debounce.IsRunning) { return }

    $debounce = [System.Diagnostics.Stopwatch]::StartNew()

    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Change detected: $changeType - $path" -ForegroundColor Yellow

    Start-Sleep -Seconds 2

    Set-Location "C:\Users\tike\Documents\Lemuria_Netlify"
    git add .
    $hasChanges = (git status --porcelain)

    if ($hasChanges) {
        $msg = "Auto-deploy: $changeType $(Split-Path $path -Leaf)"
        git commit -m $msg
        git push origin main
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ✅ Deployed: $msg" -ForegroundColor Green
    }

    $debounce.Stop()
}

Register-ObjectEvent $watcher "Changed" -Action $action | Out-Null
Register-ObjectEvent $watcher "Created" -Action $action | Out-Null
Register-ObjectEvent $watcher "Deleted" -Action $action | Out-Null
Register-ObjectEvent $watcher "Renamed" -Action $action | Out-Null

while ($true) {
    Start-Sleep -Seconds 1
}
