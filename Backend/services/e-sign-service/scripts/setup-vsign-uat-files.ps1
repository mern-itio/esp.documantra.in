# Copy VSign UAT kit files into isolated paths (never touches live signCertificate.pfx).
param(
  [Parameter(Mandatory = $true)]
  [string]$UatKitDir,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
$serviceRoot = Split-Path $PSScriptRoot -Parent
$destDir = Join-Path $serviceRoot 'uploads\vSign'
New-Item -ItemType Directory -Force -Path $destDir | Out-Null

function Find-KitFile {
  param([string]$Root, [string[]]$Names)
  foreach ($name in $Names) {
    $direct = Join-Path $Root $name
    if (Test-Path -LiteralPath $direct) { return $direct }
  }
  foreach ($name in $Names) {
    $found = Get-ChildItem -LiteralPath $Root -Recurse -File -Filter $name -ErrorAction SilentlyContinue |
      Where-Object { $_.FullName -notmatch '\\jre\\' } |
      Select-Object -First 1
    if ($found) { return $found.FullName }
  }
  return $null
}

$signSrc = Find-KitFile $UatKitDir @(
  'signCertificate.pfx',
  'dmsignaturekey.pfx',
  'Class II Organization 2 Year Document Signer Signature-2024.pfx'
)
$publicSrc = Find-KitFile $UatKitDir @('ITIO_PUBLIC KEY.cer', 'ITIO_PUBLIC_KEY.cer')
$encSrc = Find-KitFile $UatKitDir @('dm_encryption_key.pfx')

Write-Host 'UAT file install (live files NOT modified)' -ForegroundColor Cyan
Write-Host "Source: $UatKitDir"
Write-Host "Target: $destDir"
Write-Host ''

if (-not (Test-Path -LiteralPath $UatKitDir)) {
  Write-Host "Folder not found: $UatKitDir" -ForegroundColor Red
  exit 1
}

$installed = $false

if ($signSrc) {
  $destPath = Join-Path $destDir 'signCertificate.uat.pfx'
  if ((Test-Path $destPath) -and -not $Force) {
    Write-Host '[OK]   UAT signing PFX already present (signCertificate.uat.pfx)' -ForegroundColor DarkGray
  } else {
    Copy-Item -LiteralPath $signSrc -Destination $destPath -Force
    Write-Host '[OK]   UAT signing PFX -> signCertificate.uat.pfx' -ForegroundColor Green
    Write-Host "       from: $signSrc" -ForegroundColor DarkGray
    $installed = $true
  }
} else {
  Write-Host '[MISS] signCertificate.pfx not found under kit folder' -ForegroundColor Red
}

if ($publicSrc) {
  $destPath = Join-Path $destDir 'ITIO_PUBLIC_KEY.uat.cer'
  if ((Test-Path $destPath) -and -not $Force) {
    Write-Host '[OK]   UAT public cert already present (ITIO_PUBLIC_KEY.uat.cer)' -ForegroundColor DarkGray
  } else {
    Copy-Item -LiteralPath $publicSrc -Destination $destPath -Force
    Write-Host '[OK]   UAT public cert -> ITIO_PUBLIC_KEY.uat.cer' -ForegroundColor Green
    $installed = $true
  }
}

if ($encSrc) {
  $destPath = Join-Path $destDir 'dm_encryption_key.uat.pfx'
  if ((Test-Path $destPath) -and -not $Force) {
    Write-Host '[OK]   UAT encryption PFX already present (dm_encryption_key.uat.pfx)' -ForegroundColor DarkGray
  } else {
    Copy-Item -LiteralPath $encSrc -Destination $destPath -Force
    Write-Host '[OK]   UAT encryption PFX -> dm_encryption_key.uat.pfx' -ForegroundColor Green
    $installed = $true
  }
}

Write-Host ''

if (-not $signSrc) {
  Write-Host 'This kit folder only has utility/docs. Signing PFX is a separate VSign attachment.' -ForegroundColor Yellow
  Write-Host 'Look in onboarding email / Google Drive for signCertificate.pfx. Kit password: abc1234' -ForegroundColor Yellow
  Write-Host 'Do NOT use Desktop\TEST DOCUMENT SIGNER.pfx - use the email zip attachment instead.' -ForegroundColor Yellow
  exit 1
}

if ($installed) {
  Write-Host 'Next:' -ForegroundColor Cyan
  Write-Host '  .\scripts\switch-vsign-env.ps1 uat' -ForegroundColor Cyan
  Write-Host '  node scripts\verify-vsign-uat-pfx.js' -ForegroundColor Cyan
}
