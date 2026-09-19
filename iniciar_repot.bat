@echo off
chcp 65001 > nul
title Servidor Local - Repot

echo ==================================================
echo             INICIANDO O SERVIDOR REPOT            
echo ==================================================
echo.

:: 1. Garantir que está no diretório correto
cd /d "%~dp0"

:: 2. Limpar cache de compilação antigo se existir (evita o erro 404 de rotas novas)
if exist ".next" (
    echo [*] Limpando cache do Next.js para indexar novas rotas...
    rd /s /q ".next"
    echo [+] Cache limpo com sucesso.
)

echo.
echo [*] Iniciando o servidor de desenvolvimento...
echo [*] Acesse no navegador: http://localhost:3000
echo.
echo --------------------------------------------------
echo Pressione CTRL + C a qualquer momento para parar.
echo --------------------------------------------------
echo.

npm run dev
pause