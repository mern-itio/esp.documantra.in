@echo off
REM Create/update local user+admin (same email) without live DB sync.
cd /d "%~dp0.."
node scripts\seed-user-admin.js %*
if errorlevel 1 (
  echo.
  echo Seed FAILED. Ensure MongoDB is running and Backend\.env has MONGO_URI.
  exit /b 1
)
echo.
echo Seed completed.
pause
