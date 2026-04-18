@echo off
setlocal

cd /d "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) { Start-Process 'http://localhost:3000'; exit 0 } exit 1"
if "%ERRORLEVEL%"=="0" exit /b 0

echo Starting dispatcher local server...
echo.
echo Site will open at http://localhost:3000
echo Keep this window open while you are working.
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 5; Start-Process 'http://localhost:3000'"
npm.cmd run dev -- --hostname localhost --port 3000 --webpack

echo.
echo Server stopped. Press any key to close this window.
pause >nul
