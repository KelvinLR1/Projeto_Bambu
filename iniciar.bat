@echo off
chcp 65001 >nul
title Projeto Bambu - Inicializador

echo =======================================================
echo           INICIANDO PROJETO BAMBU
echo =======================================================
echo.

cd /d "%~dp0"

:: 1. Verificar instalacao do Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERRO] O Node.js nao foi encontrado no sistema!
    echo Por favor, instale o Node.js v18+ em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Verificar dependencias instaladas
if not exist "node_modules" (
    echo [AVISO] Dependencias da raiz nao encontradas. Instalando...
    call npm install
)

if not exist "server\node_modules" (
    echo [AVISO] Dependencias do servidor nao encontradas. Instalando...
    cd server && call npm install && cd ..
)

if not exist "client\node_modules" (
    echo [AVISO] Dependencias do cliente nao encontradas. Instalando...
    cd client && call npm install && cd ..
)

:: 3. Liberar portas antigas se estiverem ocupadas
echo [1/3] Verificando e liberando portas do sistema...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3002,5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

:: 4. Iniciar Frontend e Backend em janela dedicada
echo [2/3] Iniciando Backend (porta 3002) e Frontend (porta 5173)...
start "Projeto Bambu - Servidor e Cliente" cmd /k "title Projeto Bambu - Servidor e Cliente && npm run dev"

:: 5. Aguardar inicializacao e abrir navegador
echo [3/3] Aguardando inicializacao dos servicos...
timeout /t 3 /nobreak >nul

echo.
echo Abrindo Projeto Bambu no navegador...
start http://localhost:5173

echo.
echo =======================================================
echo           PROJETO BAMBU INICIADO COM SUCESSO!
echo =======================================================
echo - Frontend:  http://localhost:5173
echo - API REST:  http://localhost:3002
echo - Health:    http://localhost:3002/api/health
echo.
echo DICA: Para encerrar o sistema a qualquer momento,
echo execute o script 'parar.bat'.
echo =======================================================
echo.
timeout /t 5 >nul
