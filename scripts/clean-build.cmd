@echo off
echo Killing any lingering electron/Refinzi processes...
taskkill /f /im electron.exe 2>nul
taskkill /f /im node.exe 2>nul
taskkill /f /im Refinzi.exe 2>nul
timeout /t 2 /nobreak >nul

echo Cleaning dist directory...
if exist dist (
    attrib -R dist\win-unpacked\*.* /s >nul 2>&1
    rmdir /s /q dist
    echo dist removed.
) else (
    echo no dist directory.
)

echo Deleting old installer artifact...
if exist "Refinzi-Setup-*.exe" del /q "Refinzi-Setup-*.exe" 2>nul

echo Done cleaning.