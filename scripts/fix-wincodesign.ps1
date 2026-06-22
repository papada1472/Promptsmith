# Fix winCodeSign cache: manually extract with -snl flag to skip symbolic links
$cacheDir = "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign"
$archiveUrl = "https://github.com/electron-userland/electron-builder-binaries/releases/download/winCodeSign-2.6.0/winCodeSign-2.6.0.7z"
$archivePath = "$cacheDir\wincodesign.7z"

# Ensure cache dir exists
New-Item -ItemType Directory -Force -Path $cacheDir | Out-Null

# Download the archive
Write-Host "Downloading winCodeSign..."
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$wc = New-Object System.Net.WebClient
$wc.DownloadFile($archiveUrl, $archivePath)
Write-Host "Downloaded to $archivePath"

# Extract with -snl flag to skip symbolic links
$7zipPath = "E:\Antigravity Projects\Refinzi\refinzi-desktop\node_modules\7zip-bin\win\x64\7za.exe"
if (Test-Path $7zipPath) {
    Write-Host "Extracting winCodeSign with -snl (skip symlinks)..."
    $extractDir = "$cacheDir\extracted"
    New-Item -ItemType Directory -Force -Path $extractDir | Out-Null
    & $7zipPath x -snl -bd "$archivePath" "-o$extractDir" | Out-Null
    
    # Create the hash-named directory structure that electron-builder expects
    $hash = [System.BitConverter]::ToString((New-Object System.Security.Cryptography.SHA256Managed).ComputeHash([System.Text.Encoding]::UTF8.GetBytes("winCodeSign-2.6.0"))).Replace("-", "").ToLower()
    $targetDir = "$cacheDir\$hash"
    Write-Host "Target directory: $targetDir"
    
    # Copy extracted contents to the hash directory
    if (Test-Path $targetDir) {
        Remove-Item -Recurse -Force $targetDir
    }
    
    # Find the extracted folder (should contain darwin, linux, windows-10, etc.)
    $extractedItems = Get-ChildItem $extractDir
    if ($extractedItems.Count -eq 1 -and $extractedItems[0].PSIsContainer) {
        Write-Host "Moving contents from $($extractedItems[0].FullName) to $targetDir"
        Move-Item "$($extractedItems[0].FullName)\*" $targetDir -Force
    } else {
        Write-Host "Moving entire extract dir to $targetDir"
        New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
        Get-ChildItem $extractDir | Move-Item -Destination $targetDir -Force
    }
    
    # Cleanup
    Remove-Item -Recurse -Force $extractDir
    Remove-Item $archivePath -Force
    
    Write-Host "winCodeSign cache prepared at $targetDir"
} else {
    Write-Host "7zip not found at $7zipPath" -ForegroundColor Red
    Write-Host "Running npm install first..."
    Set-Location "E:\Antigravity Projects\Refinzi\refinzi-desktop"
    npm install
}