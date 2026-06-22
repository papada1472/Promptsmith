@echo off
cd /d "E:\Antigravity Projects\Refinzi\refinzi-desktop\dist\win-unpacked"
echo Starting Refinzi.exe from: %CD%
start /B Refinzi.exe
timeout /t 5 >nul
tasklist | findstr /i Refinzi
echo ---
echo Done checking.