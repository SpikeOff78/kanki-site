@echo off
title KANKI - localhost:3000
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serveur.ps1"
pause
