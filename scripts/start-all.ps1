$ErrorActionPreference = "Stop"

# Resolve repository root from scripts/ folder.
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Host "[start-all] Repo root: $repoRoot"

# Stop stale Next.js processes that keep .next/dev/lock alive.
$nextProcs = Get-CimInstance Win32_Process -Filter "name = 'node.exe'" |
  Where-Object {
    $_.CommandLine -match "web-prototype\\node_modules\\next\\dist\\bin\\next" -or
    $_.CommandLine -match "web-prototype\\node_modules\\next\\dist\\server\\lib\\start-server.js"
  }

if ($nextProcs) {
  $nextProcs | ForEach-Object {
    try {
      Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    } catch {
      # Best-effort cleanup.
    }
  }
  Start-Sleep -Seconds 1
}

$lockPath = Join-Path $repoRoot ".next\dev\lock"
if (Test-Path $lockPath) {
  Remove-Item -Force $lockPath
}

$webCmd = "Set-Location '$repoRoot'; npm run dev:web"
$mobileCmd = "Set-Location '$repoRoot\\mobile'; npx expo start -c"

Write-Host "[start-all] Starting web server in a new terminal..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", $webCmd | Out-Null

Start-Sleep -Seconds 2

Write-Host "[start-all] Starting Expo (mobile/) in a new terminal..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", $mobileCmd | Out-Null

Write-Host ""
Write-Host "Started services:" -ForegroundColor Green
Write-Host "- Web API/UI: http://localhost:3000"
Write-Host "- Expo Metro: check the second terminal QR code"
Write-Host ""
Write-Host "If LAN does not work on phone, run this in mobile terminal:" -ForegroundColor Yellow
Write-Host "npx expo start --tunnel -c"
