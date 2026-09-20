@echo off
color 0A
echo ===================================================
echo      ATUALIZANDO O PROJETO REPOT NO GITHUB
echo ===================================================
echo.

echo [1/3] Preparando os arquivos alterados...
git add .
echo.

echo [2/3] Criando a nova versao (commit)...
git commit -m "Atualizacao do site Repot"
echo.

echo [3/3] Enviando os arquivos para a nuvem...
git push -u origin main
echo.

echo ===================================================
echo   Processo finalizado! O Vercel ja vai atualizar.
echo ===================================================
pause