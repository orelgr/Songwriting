@echo off
title Stop App
color 0C

echo Stopping all servers...

REM Kill Python
taskkill /FI "WindowTitle eq Backend*" /F > nul 2>&1

REM Kill Node
taskkill /FI "WindowTitle eq Frontend*" /F > nul 2>&1

echo.
echo [OK] All servers stopped
echo.
timeout /t 2

exit
