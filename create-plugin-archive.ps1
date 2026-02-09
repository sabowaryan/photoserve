# Script to create a .zip archive of the PikSend Lightroom Plugin
# This archive can be uploaded through the admin interface

$pluginFolder = "dist\PikSend.lrplugin"
$outputFile = "dist\PikSend-Plugin.zip"

Write-Host "Creating plugin archive..." -ForegroundColor Cyan

# Check if plugin folder exists
if (-not (Test-Path $pluginFolder)) {
    Write-Host "Error: Plugin folder not found at $pluginFolder" -ForegroundColor Red
    exit 1
}

# Remove existing archive if it exists
if (Test-Path $outputFile) {
    Write-Host "Removing existing archive..." -ForegroundColor Yellow
    Remove-Item $outputFile -Force
}

# Create the archive
Write-Host "Compressing plugin folder..." -ForegroundColor Cyan
Compress-Archive -Path $pluginFolder -DestinationPath $outputFile -CompressionLevel Optimal

# Get file size
$fileSize = (Get-Item $outputFile).Length
$fileSizeMB = [math]::Round($fileSize / 1MB, 2)

Write-Host ""
Write-Host "✓ Archive created successfully!" -ForegroundColor Green
Write-Host "  Location: $outputFile" -ForegroundColor White
Write-Host "  Size: $fileSizeMB MB" -ForegroundColor White
Write-Host ""
Write-Host "You can now upload this archive through the admin interface." -ForegroundColor Cyan
