@echo off
title Song Writing App
color 0A

echo ========================================
echo    Starting Song Writing App
echo ========================================
echo.

REM Start Backend
echo [1/3] Starting Backend Server...
start "Backend - DO NOT CLOSE" cmd /k "cd /d %~dp0server && py app.py"
timeout /t 3 /nobreak > nul

REM Start Frontend
echo [2/3] Starting Frontend Server...
start "Frontend - DO NOT CLOSE" cmd /k "cd /d %~dp0client && npm run dev"
timeout /t 5 /nobreak > nul

REM Open Browser
echo [3/3] Opening Browser...
start http://localhost:5173

echo.
echo ========================================
echo    App is RUNNING!
echo ========================================
echo.
echo Two windows opened:
echo   1. Backend (Python)
echo   2. Frontend (React)
echo.
echo DO NOT CLOSE those windows!
echo.
echo To STOP the app: Close both windows
echo ========================================
echo.
echo You can close THIS window now.
echo.
timeout /t 10

exit
