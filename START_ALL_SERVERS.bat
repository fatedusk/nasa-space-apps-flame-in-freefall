@echo off
title IGNIS Aerospace Fire Safety - Server Launcher
echo ========================================================
echo Starting IGNIS Hackathon Servers...
echo ========================================================

:: 1. Start Main Page Server (Port 3000)
start "IGNIS Main Server (Port 3000)" cmd /k "cd /d "%~dp0main page\-FREEFALL-—-NASA-PSI-Fire-Safety-AI" && node server.js"

:: 2. Start Space Station Guardian Backend (Port 4000)
start "Station Guardian Backend (Port 4000)" cmd /k "cd /d "%~dp0SpaceStation_Guardian (2)\SpaceStation_Guardian\space-station-guardian\backend" && node index.js"

:: 3. Start Space Station Guardian Frontend (Port 5173)
start "Station Guardian Frontend (Port 5173)" cmd /k "cd /d "%~dp0SpaceStation_Guardian (2)\SpaceStation_Guardian\space-station-guardian\frontend" && npm run dev -- --host 0.0.0.0 --port 5173"

:: Wait 3 seconds for servers to initialize
timeout /t 3 /nobreak >nul

:: Open Initial Landing Page in Default Browser
start http://localhost:3000/ignis%%20final%%20description%%20page.html

echo.
echo All servers launched successfully!
echo You can keep this window minimized during your demo.
pause
