@echo off
chcp 65001 >nul
title Projeto Bambu - Encerrar Servicos

echo =======================================================
echo           ENCERRANDO PROJETO BAMBU
echo =======================================================
echo.

cd /d "%~dp0"

:: 1. Fechar a janela dedicada do CMD
echo [1/2] Fechando janelas do terminal do Projeto Bambu...
taskkill /FI "WINDOWTITLE eq Projeto Bambu - Servidor e Cliente*" /T /F >nul 2>&1

:: 2. Encerrar qualquer processo remanescente nas portas 3002 e 5173
echo [2/2] Liberando portas 3002 (Backend) e 5173 (Frontend)...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3002,5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

:: Fallback adicional via netstat e taskkill para garantir
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3002 :5173"') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo =======================================================
echo           PROJETO BAMBU ENCERRADO COM SUCESSO!
echo =======================================================
echo Servicos parados e portas liberadas.
echo.
pause
