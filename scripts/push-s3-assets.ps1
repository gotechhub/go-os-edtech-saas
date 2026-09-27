[CmdletBinding()]
param(
  [string]$Manifest = "assets/system-assets.manifest.json",
  [string]$Bucket = $env:S3_SYSTEM_BUCKET,
  [string]$Region = $env:AWS_REGION,
  [string]$Profile,
  [switch]$Apply
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
if (-not (Test-Path -LiteralPath $Manifest)) { throw "Manifest bulunamadı: $Manifest" }
if (-not $Bucket) { throw "S3_SYSTEM_BUCKET veya -Bucket zorunludur." }
if (-not $Region) { throw "AWS_REGION veya -Region zorunludur." }
if ($Apply -and -not (Get-Command aws -ErrorAction SilentlyContinue)) { throw "AWS CLI bulunamadı." }

$plan = Get-Content -LiteralPath $Manifest -Raw | ConvertFrom-Json
$awsBase = @("--region", $Region)
if ($Profile) { $awsBase += @("--profile", $Profile) }

Write-Host ("Mod: " + $(if ($Apply) { "UYGULA" } else { "DRY-RUN" }))
Write-Host "Bucket: $Bucket"

foreach ($prefix in $plan.prefixMarkers) {
  if ($prefix -notmatch '^[a-z0-9][a-z0-9/_-]*/$') { throw "Geçersiz prefix: $prefix" }
  Write-Host "PREFIX $prefix"
  if ($Apply) {
    $emptyFile = [IO.Path]::GetTempFileName()
    try { & aws s3api put-object --bucket $Bucket --key $prefix --body $emptyFile @awsBase | Out-Null }
    finally { Remove-Item -LiteralPath $emptyFile -Force }
  }
}

foreach ($entry in $plan.objects) {
  $source = [IO.Path]::GetFullPath((Join-Path (Split-Path -Parent $Manifest) $entry.source))
  $root = [IO.Path]::GetFullPath((Split-Path -Parent $Manifest))
  if (-not $source.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) { throw "Manifest dışı kaynak reddedildi: $source" }
  if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "Kaynak bulunamadı: $source" }
  if ($entry.key -notmatch '^system/[a-z0-9/_\.-]+$' -or $entry.key -match '(^|/)\.\.(/|$)') { throw "Geçersiz object key: $($entry.key)" }
  $hash = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant()
  Write-Host "OBJECT $($entry.key) SHA256=$hash"
  if ($Apply) { & aws s3api put-object --bucket $Bucket --key $entry.key --body $source --content-type $entry.contentType --metadata "sha256-hex=$hash" @awsBase | Out-Null }
}

Write-Host "Tamamlandı. Silme işlemi yapılmadı."
