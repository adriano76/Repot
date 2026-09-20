@echo off
chcp 65001 >nul
title GitHub - Enviar Projeto

echo ===================================================
echo        CONFIGURACAO DO GITHUB
echo ===================================================
echo.

cd /d "%~dp0"

echo Pasta do projeto:
echo %CD%
echo.

if not exist ".git" (
    echo [INFO] Repositorio Git nao encontrado.
    echo.
    echo Inicializando repositorio...
    git init

    if errorlevel 1 (
        echo.
        echo ERRO: Nao foi possivel inicializar o Git.
        pause
        exit /b 1
    )
)

echo.
echo [CONFIGURACAO INICIAL]
echo.

set /p EMAIL="Digite o mesmo e-mail que voce usou para criar a conta no GitHub: "

git config user.email "%EMAIL%"
git config user.name "adriano76"

echo.
echo Identidade configurada com sucesso!

echo.
echo [1/4] A preparar ficheiros...
git add .

if errorlevel 1 (
    echo ERRO ao adicionar os ficheiros.
    pause
    exit /b 1
)

echo.
echo [2/4] A criar versao (commit)...
git commit -m "Atualizacao do projeto"

echo.
echo [3/4] A definir branch main...
git branch -M main

echo.
echo [4/4] A enviar ficheiros para o GitHub...

git remote get-url origin >nul 2>&1

if errorlevel 1 (
    git remote add origin https://github.com/adriano76/Repot.git
)

git push -u origin main

echo.
echo ===================================================
echo       Processo finalizado!
echo ===================================================
echo.
echo Repositorio:
echo https://github.com/adriano76/Repot
echo.

pause