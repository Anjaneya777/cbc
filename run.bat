@echo off
echo ========================================================
echo  AI-Based Contract Risk Indicator - Startup Script
echo ========================================================

set "PATH=C:\Users\hp\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.20.0-win-x64;C:\Users\hp\AppData\Local\Programs\Python\Python311;C:\Users\hp\AppData\Local\Programs\Python\Python311\Scripts;%PATH%"

echo Starting FastAPI Backend on http://localhost:8000 ...
start "Backend - Contract Risk Indicator" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo Starting Vite Frontend on http://localhost:5173 ...
start "Frontend - Contract Risk Indicator" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are launching:
echo  Backend:  http://localhost:8000/docs
echo  Frontend: http://localhost:5173
echo ========================================================
pause
