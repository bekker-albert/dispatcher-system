@echo off
setlocal

cd /d "%~dp0"

set "PROJECT_DIR=%cd%"
set "PREFERRED_PORT=3011"

for /f "tokens=1,2 delims=:" %%A in ('
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$projectDir = '%PROJECT_DIR%'; $escapedProjectDir = [Regex]::Escape($projectDir); $listener = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Sort-Object LocalPort | Where-Object { $process = Get-CimInstance Win32_Process -Filter ('ProcessId = ' + $_.OwningProcess) -ErrorAction SilentlyContinue; $commandLine = if ($process) { $process.CommandLine } else { '' }; $commandLine -and $commandLine -match $escapedProjectDir } | Select-Object -First 1; if ($listener) { Write-Output ('OPEN:' + $listener.LocalPort); exit 0 }; $port = %PREFERRED_PORT%; while (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { $port++ }; Write-Output ('START:' + $port)"
') do (
  set "PORT_ACTION=%%A"
  set "PORT=%%B"
)

if /I "%PORT_ACTION%"=="OPEN" (
  start "" "http://localhost:%PORT%"
  exit /b 0
)

if not defined PORT set "PORT=%PREFERRED_PORT%"

echo Starting dispatcher local server...
echo.
echo Site will open at http://localhost:%PORT%
echo Keep this window open while you are working.
echo.

start "" powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "$port = %PORT%; for ($i = 0; $i -lt 120; $i++) { if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { Start-Process ('http://localhost:' + $port); exit 0 }; Start-Sleep -Milliseconds 500 }"
npm.cmd run dev -- --hostname localhost --port %PORT% --turbopack

echo.
echo Server stopped. Press any key to close this window.
pause >nul
