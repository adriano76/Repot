@echo off
color 0A
echo ===================================================
echo    INSTALANDO SUPABASE E ENVIANDO PARA O GITHUB
echo ===================================================
echo.

echo [1/4] Instalando a biblioteca do Supabase...
call npm install @supabase/supabase-js
echo.

echo [2/4] Preparando os arquivos alterados...
git add .
echo.

echo [3/4] Criando a versao (commit)...
git commit -m "Adicionando biblioteca do Supabase"
echo.

echo [4/4] Enviando (forcando) para o GitHub...
git push -u origin main -f
echo.

echo ===================================================
echo   Processo finalizado! A Vercel ja vai atualizar.
echo ===================================================
pause