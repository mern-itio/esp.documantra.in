@echo off
cd /d "%~dp0.."
node scripts\test-login.js %*
if errorlevel 1 exit /b 1
pause
