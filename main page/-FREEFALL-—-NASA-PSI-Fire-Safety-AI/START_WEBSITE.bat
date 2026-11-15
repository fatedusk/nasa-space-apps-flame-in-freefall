@echo off
setlocal EnableExtensions EnableDelayedExpansion

:: -----------------------------------------------------------------------------
:: Ensure the working directory is always the folder where this batch file lives
:: -----------------------------------------------------------------------------
cd /d "%~dp0"

title IGNIS // FREEFALL - NASA Fire Safety Platform
color 0B

:: -----------------------------------------------------------------------------
:: Initialize startup log file
:: -----------------------------------------------------------------------------
set "LOG_FILE=%~dp0launcher.log"
echo =============================================================================== > "%LOG_FILE%"
echo   IGNIS // FREEFALL Launcher Log - %DATE% %TIME% >> "%LOG_FILE%"
echo =============================================================================== >> "%LOG_FILE%"
echo Working Directory: %CD% >> "%LOG_FILE%"

echo ===============================================================================
echo         IGNIS // FREEFALL - NASA Physical Sciences Informatics [PSI]
echo           NASA Space Apps Challenge: Microgravity Combustion Platform
echo ===============================================================================
echo.

:: -----------------------------------------------------------------------------
:: Step 1: Check Node.js
:: -----------------------------------------------------------------------------
echo [1/5] Checking Node.js runtime...
echo [1/5] Checking Node.js runtime... >> "%LOG_FILE%"

where node >nul 2>&1
if errorlevel 1 goto :ERR_NO_NODE

for /f "tokens=*" %%v in ('node -v 2^>^&1') do set "NODE_VER=%%v"
echo [OK] Node.js is installed: %NODE_VER%
echo [OK] Node.js is installed: %NODE_VER% >> "%LOG_FILE%"

:: -----------------------------------------------------------------------------
:: Step 2: Check npm
:: -----------------------------------------------------------------------------
echo [2/5] Checking npm package manager...
echo [2/5] Checking npm package manager... >> "%LOG_FILE%"

where npm >nul 2>&1
if errorlevel 1 goto :ERR_NO_NPM

for /f "tokens=*" %%v in ('call npm -v 2^>^&1') do set "NPM_VER=%%v"
echo [OK] npm is installed: v%NPM_VER%
echo [OK] npm is installed: v%NPM_VER% >> "%LOG_FILE%"

:: -----------------------------------------------------------------------------
:: Step 3: Check / Install Dependencies
:: -----------------------------------------------------------------------------
echo [3/5] Verifying project dependencies...
echo [3/5] Verifying project dependencies... >> "%LOG_FILE%"

if exist "node_modules\" goto :DEPS_OK

echo [INFO] First-time setup detected: Installing npm dependencies...
echo [INFO] Installing npm dependencies... >> "%LOG_FILE%"
echo This may take 1-2 minutes depending on your internet connection.
echo Please wait...

call npm install --legacy-peer-deps >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :ERR_NPM_INSTALL

:DEPS_OK
echo [OK] Dependencies are installed.
echo [OK] Dependencies are installed. >> "%LOG_FILE%"

:: -----------------------------------------------------------------------------
:: Step 4: Verify Production Build (server.js & dist\index.html)
:: -----------------------------------------------------------------------------
echo [4/5] Verifying production build artifacts...
echo [4/5] Verifying production build artifacts... >> "%LOG_FILE%"

if not exist "server.js" goto :DO_BUILD
if not exist "dist\index.html" goto :DO_BUILD
goto :BUILD_OK

:DO_BUILD
echo [INFO] Building production client and server bundles...
echo [INFO] Running npm run build... >> "%LOG_FILE%"
call npm run build >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :ERR_BUILD

:BUILD_OK
echo [OK] Production build is ready.
echo [OK] Production build is ready. >> "%LOG_FILE%"

:: -----------------------------------------------------------------------------
:: Step 5: Start Server & Launch Browser
:: -----------------------------------------------------------------------------
set "PORT=3000"
set "TARGET_URL=http://localhost:%PORT%"

echo [5/5] Checking server status on port %PORT%...
echo [5/5] Checking server status on port %PORT%... >> "%LOG_FILE%"

:: Check if port 3000 is already active
powershell -NoProfile -ExecutionPolicy Bypass -Command "$c = New-Object Net.Sockets.TcpClient; try { $c.Connect('127.0.0.1', %PORT%); exit 0 } catch { exit 1 } finally { $c.Dispose() }" >nul 2>&1
if not errorlevel 1 goto :ALREADY_RUNNING

echo Starting IGNIS // FREEFALL server on port %PORT%...
echo Starting server on port %PORT%... >> "%LOG_FILE%"

:: Start Node server as a background process attached to this console
echo [%DATE% %TIME%] Starting Node server... > "%~dp0server.log"
start "IGNIS // FREEFALL Server" /b node server.js >> "%~dp0server.log" 2>&1

echo Waiting for server to initialize...
set /a ATTEMPTS=0

:POLL_SERVER
powershell -NoProfile -ExecutionPolicy Bypass -Command "$c = New-Object Net.Sockets.TcpClient; try { $c.Connect('127.0.0.1', %PORT%); exit 0 } catch { exit 1 } finally { $c.Dispose() }" >nul 2>&1
if not errorlevel 1 goto :LAUNCH_BROWSER

powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 1" >nul 2>&1
set /a ATTEMPTS+=1
if %ATTEMPTS% geq 25 goto :TIMEOUT_FALLBACK
goto :POLL_SERVER

:TIMEOUT_FALLBACK
echo [WARNING] Server startup took longer than expected. Attempting to open browser...
echo [WARNING] Startup timeout reached. >> "%LOG_FILE%"

:LAUNCH_BROWSER
echo.
echo ===============================================================================
echo   [SUCCESS] IGNIS // FREEFALL is now ONLINE at %TARGET_URL%
echo.
echo   - 01 Welcome Screen:                  %TARGET_URL%/#/welcome
echo   - 02 3D Flame Simulator and ML Hub:   %TARGET_URL%/#/simulator
echo   - 03 NASA PSI and NTRS Vault:         %TARGET_URL%/#/vault
echo   - 04 Hardware Explorer and Spinoffs:  %TARGET_URL%/#/hardware
echo   - 05 IGNIS Data Network:              %TARGET_URL%/#/network
echo   - 06 Combustion Science Brief:        %TARGET_URL%/#/science
echo   - 07 PSI Sentence Search:             %TARGET_URL%/#/sentence-search
echo.
echo   Aether-SI Companion Shortcut: Ctrl + K [in browser]
echo ===============================================================================
echo.
echo [INFO] Opening default web browser to %TARGET_URL%...
echo Opening browser to %TARGET_URL% >> "%LOG_FILE%"
start "" "%TARGET_URL%"

echo Server is actively running in this console window.
echo To stop the server, press Ctrl + C or close this window.
echo.

:: Keep script alive and responsive
:KEEP_ALIVE
echo [STATUS] Server is running. Press Ctrl + C or close this window to exit.
:RUN_LOOP
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 2" >nul 2>&1
goto :RUN_LOOP
goto :EOF

:ALREADY_RUNNING
echo.
echo ===============================================================================
echo   [INFO] Server is already active and listening on port %PORT%!
echo ===============================================================================
echo Opening default web browser to %TARGET_URL%...
start "" "%TARGET_URL%"
echo.
echo Press any key to exit this launcher window...
pause >nul
goto :EOF

:: -----------------------------------------------------------------------------
:: Error Handlers
:: -----------------------------------------------------------------------------
:ERR_NO_NODE
echo.
echo ===============================================================================
echo   [ERROR] Node.js was not found on your system!
echo ===============================================================================
echo Node.js version 18 or higher is required to run this application.
echo Please download and install Node.js from: https://nodejs.org/
echo After installing Node.js, double-click START_WEBSITE.bat again.
echo.
echo Details written to: %LOG_FILE%
echo [ERROR] Node.js not found in PATH >> "%LOG_FILE%"
echo.
echo Press any key to exit...
pause >nul
exit /b 1

:ERR_NO_NPM
echo.
echo ===============================================================================
echo   [ERROR] npm package manager was not found!
echo ===============================================================================
echo Please ensure Node.js was installed completely with npm included.
echo You can reinstall Node.js from: https://nodejs.org/
echo.
echo Details written to: %LOG_FILE%
echo [ERROR] npm not found in PATH >> "%LOG_FILE%"
echo.
echo Press any key to exit...
pause >nul
exit /b 1

:ERR_NPM_INSTALL
echo.
echo ===============================================================================
echo   [ERROR] Failed to install project dependencies via npm.
echo ===============================================================================
echo Please check your internet connection and inspect:
echo   %LOG_FILE%
echo.
echo You can also try opening Command Prompt in this folder and running:
echo   npm install --legacy-peer-deps
echo.
echo Press any key to exit...
pause >nul
exit /b 1

:ERR_BUILD
echo.
echo ===============================================================================
echo   [ERROR] Production build failed!
echo ===============================================================================
echo Please inspect the error logs in:
echo   %LOG_FILE%
echo.
echo You can also try running the build manually:
echo   npm run build
echo.
echo Press any key to exit...
pause >nul
exit /b 1
