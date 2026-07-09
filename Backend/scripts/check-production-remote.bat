@echo off
REM Read-only local checks for esp.documantra.in (no SSH required).
REM For full DB inspection, use PuTTY on server: deploy\scripts\check-production-db-and-security.sh

echo ==============================================
echo  esp.documantra.in - Local connectivity check
echo ==============================================
echo.

echo [1] HTTPS homepage
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'https://esp.documantra.in/' -UseBasicParsing -TimeoutSec 20; Write-Host ('  Status: ' + $r.StatusCode) } catch { Write-Host ('  FAIL: ' + $_.Exception.Message) }"

echo.
echo [2] Auth security policy (public JSON)
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'https://esp.documantra.in/auth/api/auth/security-policy' -UseBasicParsing -TimeoutSec 20; Write-Host $r.Content.Substring(0,[Math]::Min(500,$r.Content.Length)) } catch { Write-Host ('  FAIL: ' + $_.Exception.Message) }"

echo.
echo [3] MongoDB port 27017 must NOT be public
powershell -NoProfile -Command "try { $tcp = New-Object System.Net.Sockets.TcpClient; $iar = $tcp.BeginConnect('esp.documantra.in',27017,$null,$null); $ok = $iar.AsyncWaitHandle.WaitOne(3000,$false); if ($ok -and $tcp.Connected) { Write-Host '  WARN: port 27017 is OPEN publicly - security risk!' } else { Write-Host '  OK: port 27017 not reachable (expected)' }; $tcp.Close() } catch { Write-Host '  OK: port 27017 not reachable (expected)' }"

echo.
echo [4] Backend port 2103 must NOT be public
powershell -NoProfile -Command "try { $tcp = New-Object System.Net.Sockets.TcpClient; $iar = $tcp.BeginConnect('esp.documantra.in',2103,$null,$null); $ok = $iar.AsyncWaitHandle.WaitOne(3000,$false); if ($ok -and $tcp.Connected) { Write-Host '  WARN: port 2103 is OPEN publicly - fix firewall!' } else { Write-Host '  OK: port 2103 not reachable (expected)' }; $tcp.Close() } catch { Write-Host '  OK: port 2103 not reachable (expected)' }"

echo.
echo ==============================================
echo  Full DB check: SSH to server and run:
echo    bash deploy/scripts/check-production-db-and-security.sh
echo  Sync DB to local:
echo    Backend\scripts\sync-production-db.bat
echo ==============================================
pause
