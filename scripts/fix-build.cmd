@echo off
title Refinzi Build Helper
cd /d "E:\Antigravity Projects\Refinzi\refinzi-desktop"

echo ============================================
echo Refinzi Pre-Release Build
echo ============================================

:: Step 1: Kill all processes
echo [1/5] Killing lingering processes...
taskkill /f /im electron.exe 2>nul
taskkill /f /im Refinzi.exe 2>nul
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

:: Step 2: Clean dist
echo [2/5] Cleaning dist...
if exist dist (
    attrib -R dist\win-unpacked\*.* /s >nul 2>&1
    rmdir /s /q dist
)
echo dist cleaned.

:: Step 3: Clean winCodeSign cache ONE MORE TIME (sometimes recreated)
echo [3/5] Cleaning winCodeSign cache...
if exist "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign" (
    rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign"
)
echo Cache cleaned.

:: Step 4: Set environment to disable signing
echo [4/5] Setting environment variables (disable signing)...
set CSC_IDENTITY_AUTO_DISCOVERY=false
set CSC_LINK=
set CSC_KEY_PASSWORD=
set WIN_CSC_LINK=
set WIN_CSC_KEY_PASSWORD=
set ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true

:: Step 5: Run build
echo [5/5] Running electron-builder...
echo.
npm run dist

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo BUILD SUCCESSFUL
    echo ============================================
    echo Generated files:
    if exist dist\*.exe (
        for %%f in (dist\*.exe) do echo   %%f
    )
    if exist dist\*.zip (
        for %%f in (dist\*.zip) do echo   %%f
    )
) else (
    echo.
    echo ============================================
    echo BUILD FAILED with error level %ERRORLEVEL%
    echo ============================================
    echo.
    echo Common fixes:
    echo 1. Run this script as Administrator
    echo 2. Close any running Refinzi instances from tray
    echo 3. Check if another build is in progress
    pause
)