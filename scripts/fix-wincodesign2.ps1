# Clean the winCodeSign cache completely
$cacheDir = "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign"
if (Test-Path $cacheDir) {
    Remove-Item -Recurse -Force $cacheDir -ErrorAction SilentlyContinue
    Write-Host "Cleaned winCodeSign cache"
}

# Create the expected directory
New-Item -ItemType Directory -Force -Path $cacheDir | Out-Null

# Download the archive
$archiveUrl = "https://github.com/electron-userland/electron-builder-binaries/releases/download/winCodeSign-2.6.0/winCodeSign-2.6.0.7z"
$archivePath = "$env:TEMP\wincodesign.7z"
Write-Host "Downloading winCodeSign..."
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$wc = New-Object System.Net.WebClient
$wc.DownloadFile($archiveUrl, $archivePath)
Write-Host "Downloaded to $archivePath"

# Get 7zip path
$7zipPath = "E:\Antigravity Projects\Refinzi\refinzi-desktop\node_modules\7zip-bin\win\x64\7za.exe"

# Create temp extraction dir
$tempDir = "$env:TEMP\wincodesign_extract"
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

# Extract to temporary location (ignore symlink errors by suppressing output)
Write-Host "Extracting archive..."
$extractOutput = & $7zipPath x "$archivePath" "-o$tempDir" -y 2>&1
Write-Host "Extraction completed (symlink errors are expected on Windows)"

# Find the extracted root folder (typically named winCodeSign-2.6.0)
$extractedRoot = Get-ChildItem $tempDir | Where-Object { $_.PSIsContainer } | Select-Object -First 1
if ($extractedRoot) {
    $extractSource = $extractedRoot.FullName
} else {
    $extractSource = $tempDir
}

Write-Host "Extracted to: $extractSource"

# Remove darwin and linux directories (not needed for Windows builds)
if (Test-Path "$extractSource\darwin") {
    Remove-Item -Recurse -Force "$extractSource\darwin"
    Write-Host "Removed darwin directory (not needed on Windows)"
}
if (Test-Path "$extractSource\linux") {
    Remove-Item -Recurse -Force "$extractSource\linux"
    Write-Host "Removed linux directory (not needed on Windows)"
}
if (Test-Path "$extractSource\openssl-ia32") {
    Remove-Item -Recurse -Force "$extractSource\openssl-ia32"
    Write-Host "Removed openssl-ia32 directory (not needed)"
}

Write-Host "Contents in extracted folder:"
Get-ChildItem $extractSource | Select-Object Name

# Move to the hash-named directory
$hash = [System.BitConverter]::ToString((New-Object System.Security.Cryptography.SHA256Managed).ComputeHash([System.Text.Encoding]::UTF8.GetBytes("winCodeSign-2.6.0"))).Replace("-", "").ToLower()
$targetDir = "$cacheDir\$hash"
Write-Host "Target directory: $targetDir"

if (Test-Path $targetDir) {
    Remove-Item -Recurse -Force $targetDir
}
Move-Item $extractSource $targetDir
Write-Host "winCodeSign ready at $targetDir"

# Cleanup
Remove-Item $archivePath -Force
Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Done! Now run: npm run dist"