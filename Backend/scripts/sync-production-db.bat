@echo off
cd /d "%~dp0"
set "PS_EXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%PS_EXE%" set "PS_EXE=powershell"
"%PS_EXE%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync-production-db.ps1" %*
if errorlevel 1 (
  echo.
  echo Sync FAILED. Run in PowerShell if you need more detail:
  echo   "%PS_EXE%" -ExecutionPolicy Bypass -File "%~dp0sync-production-db.ps1"
  exit /b 1
)
echo.
echo Sync completed.
pause
