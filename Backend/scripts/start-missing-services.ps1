# Start backend services that are not already listening.
$root = "E:\esp-public-flow-backup\Backend\services"
$services = @{
  2102 = "$root\document-service"
  2104 = "$root\pdf-service"
  2105 = "$root\api-service"
  2106 = "$root\template-service"
  2107 = "$root\support-service"
  2108 = "$root\ai-assistant-service"
  2110 = "$root\subscription-service"
  2111 = "$root\organization-service"
  2113 = "$root\api-gateway"
  2114 = "$root\identity-service"
}

foreach ($port in $services.Keys) {
  $listen = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if ($listen) {
    Write-Host "Port $port already up - skip"
    continue
  }
  $cwd = $services[$port]
  Write-Host "Starting port $port from $cwd"
  Start-Process -FilePath "node" -ArgumentList "index.js" -WorkingDirectory $cwd -WindowStyle Minimized
  Start-Sleep -Seconds 2
}

Write-Host "Done starting missing backend services."
