@echo off
title Refinzi Build

echo ============================================
echo Refinzi Build Script
echo ============================================
echo.

echo Step 1: Clean up...
call scripts\clean-build.cmd

echo.
echo Step 2: Setting environment variables...
set CSC_IDENTITY_AUTO_DISCOVERY=false
set CSC_LINK=
set CSC_KEY_PASSWORD=
set ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true
set WIN_CSC_LINK=
set WIN_CSC_KEY_PASSWORD=

echo Step 3: Running electron-builder...
echo.
call npm run dist

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo Build completed successfully!
    echo ============================================
    dir dist\*.exe /b
) else (
    echo.
    echo Build failed with error code: %ERRORLEVEL%
)
pause