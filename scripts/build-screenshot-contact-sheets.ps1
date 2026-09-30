param(
  [string]$Source = "v1/upsidelms-saas-screenshot",
  [string]$Output = "$env:TEMP/respongo-invince-sheets"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

function Get-NaturalKey([string]$Name) {
  return [regex]::Replace($Name, '\d+', { param($match) $match.Value.PadLeft(8, '0') })
}

function Save-DesktopSheets([IO.FileInfo[]]$Files, [string]$Role, [string]$Target) {
  $columns = 4
  $rows = 4
  $tileWidth = 500
  $imageHeight = 190
  $labelHeight = 28
  $perSheet = $columns * $rows
  for ($offset = 0; $offset -lt $Files.Count; $offset += $perSheet) {
    $sheet = New-Object Drawing.Bitmap ($columns * $tileWidth), ($rows * ($imageHeight + $labelHeight))
    $canvas = [Drawing.Graphics]::FromImage($sheet)
    $canvas.Clear([Drawing.Color]::White)
    $canvas.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $font = New-Object Drawing.Font "Segoe UI", 11
    $brush = [Drawing.Brushes]::Black
    for ($index = 0; $index -lt $perSheet -and ($offset + $index) -lt $Files.Count; $index++) {
      $file = $Files[$offset + $index]
      $sourceImage = [Drawing.Image]::FromFile($file.FullName)
      try {
        $sourceWidth = [Math]::Min($sourceImage.Width, 1150)
        $sourceHeight = [Math]::Min($sourceImage.Height, 430)
        $column = $index % $columns
        $row = [Math]::Floor($index / $columns)
        $destination = New-Object Drawing.Rectangle ($column * $tileWidth), ($row * ($imageHeight + $labelHeight)), $tileWidth, $imageHeight
        $sourceRect = New-Object Drawing.Rectangle 0, 0, $sourceWidth, $sourceHeight
        $canvas.DrawImage($sourceImage, $destination, $sourceRect, [Drawing.GraphicsUnit]::Pixel)
        $canvas.DrawString($file.Name, $font, $brush, ($column * $tileWidth + 6), ($row * ($imageHeight + $labelHeight) + $imageHeight + 3))
      } finally { $sourceImage.Dispose() }
    }
    $page = [int]([Math]::Floor($offset / $perSheet) + 1)
    $path = Join-Path $Target ("{0}-{1:D2}.jpg" -f $Role, $page)
    $sheet.Save($path, [Drawing.Imaging.ImageFormat]::Jpeg)
    $font.Dispose(); $canvas.Dispose(); $sheet.Dispose()
  }
}

function Save-MobileSheets([IO.FileInfo[]]$Files, [string]$Role, [string]$Target) {
  $columns = 4
  $rows = 2
  $tileWidth = 340
  $imageHeight = 690
  $labelHeight = 28
  $perSheet = $columns * $rows
  for ($offset = 0; $offset -lt $Files.Count; $offset += $perSheet) {
    $sheet = New-Object Drawing.Bitmap ($columns * $tileWidth), ($rows * ($imageHeight + $labelHeight))
    $canvas = [Drawing.Graphics]::FromImage($sheet)
    $canvas.Clear([Drawing.Color]::White)
    $canvas.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $font = New-Object Drawing.Font "Segoe UI", 11
    for ($index = 0; $index -lt $perSheet -and ($offset + $index) -lt $Files.Count; $index++) {
      $file = $Files[$offset + $index]
      $sourceImage = [Drawing.Image]::FromFile($file.FullName)
      try {
        $column = $index % $columns
        $row = [Math]::Floor($index / $columns)
        $destination = New-Object Drawing.Rectangle ($column * $tileWidth), ($row * ($imageHeight + $labelHeight)), $tileWidth, $imageHeight
        $sourceRect = New-Object Drawing.Rectangle 0, 0, $sourceImage.Width, $sourceImage.Height
        $canvas.DrawImage($sourceImage, $destination, $sourceRect, [Drawing.GraphicsUnit]::Pixel)
        $canvas.DrawString($file.Name, $font, [Drawing.Brushes]::Black, ($column * $tileWidth + 6), ($row * ($imageHeight + $labelHeight) + $imageHeight + 3))
      } finally { $sourceImage.Dispose() }
    }
    $page = [int]([Math]::Floor($offset / $perSheet) + 1)
    $path = Join-Path $Target ("{0}-{1:D2}.jpg" -f $Role, $page)
    $sheet.Save($path, [Drawing.Imaging.ImageFormat]::Jpeg)
    $font.Dispose(); $canvas.Dispose(); $sheet.Dispose()
  }
}

$resolvedSource = (Resolve-Path $Source).Path
New-Item -ItemType Directory -Force -Path $Output | Out-Null
foreach ($directory in Get-ChildItem $resolvedSource -Directory | Sort-Object Name) {
  $files = @(Get-ChildItem $directory.FullName -File -Filter *.png | Sort-Object { Get-NaturalKey $_.Name })
  if ($directory.Name -eq "mobile-app") { Save-MobileSheets $files $directory.Name $Output }
  else { Save-DesktopSheets $files $directory.Name $Output }
}

Get-ChildItem $Output -File | Sort-Object Name | Select-Object Name,Length,FullName
