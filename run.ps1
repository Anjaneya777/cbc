Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  AI-Based Contract Risk Indicator - Startup Script" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Ensure Python and Node are in session PATH
$nodeDir = "C:\Users\hp\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.20.0-win-x64"
$pyDir = "C:\Users\hp\AppData\Local\Programs\Python\Python311"
$pyScripts = "$pyDir\Scripts"
$env:Path = "$nodeDir;$pyDir;$pyScripts;$env:Path"

Write-Host "Starting FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\backend'; python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

Write-Host "Starting Vite React Frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\frontend'; npm run dev"

Write-Host ""
Write-Host "Both servers launched successfully!" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend API: http://localhost:8000/docs"
Write-Host "========================================================" -ForegroundColor Cyan
