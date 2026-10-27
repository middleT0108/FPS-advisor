@echo off
chcp 65001 >nul
title FPS Advisor - Web Server (Port 3005)
echo ========================================================
echo   FPS ADVISOR - KHOI DONG MAY CHU WEB LOCAL (PORT 3005)
echo ========================================================
echo.
cd /d "%~dp0web"
echo Dang khoi dong Next.js Server tai http://localhost:3005 ...
npm run dev -- -p 3005
pause
