@echo off
title SpaceStation Guardian
cd /d "%~dp0"

echo ========================================================
echo Starting SpaceStation Guardian Backend Core (Port 4000)...
echo ========================================================
start "SpaceStation Guardian Backend" /min cmd /c "cd /d \"%~dp0backend\" && npm start"

timeout /t 1 /nobreak >nul

echo ========================================================
echo Starting SpaceStation Guardian Frontend (Port 5173)...
echo Please keep this window open while using the website!
echo ========================================================
cd /d "%~dp0frontend"
npm run dev -- --open
pause
