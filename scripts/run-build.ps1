# Clean first
Write-Host "=== Cleaning ==="
$oldLocation = Get-Location
Set-Location "E:\Antigravity Projects\Refinzi\refinzi-desktop"
cmd.exe /c "scripts\clean-build.cmd"

Write-Host ""
Write-Host "=== Running Build ==="
Write-Host "Setting env vars..."

# Disable code signing
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
$env:CSC_LINK = ""
$env:CSC_KEY_PASSWORD = ""
$env:WIN_CSC_LINK = ""
$env:WIN_CSC_KEY_PASSWORD = ""
$env:ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES = "true"

Write-Host "CSC_IDENTITY_AUTO_DISCOVERY = $env:CSC_IDENTITY_AUTO_DISCOVERY"
Write-Host "Starting electron-builder..."

# Run npm dist
npm run dist

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================"
    Write-Host "Build completed successfully!"
    Write-Host "============================================"
    Get-ChildItem "dist\*.exe" | Select-Object Name, Length, LastWriteTime
} else {
    Write-Host ""
    Write-Host "Build failed with exit code: $LASTEXITCODE"
}