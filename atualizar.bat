@echo off
chcp 65001 >nul
cls
echo ===================================================
echo     CONFIGURANDO IDENTIDADE E ENVIANDO AO GITHUB
echo     Utilizador: adriano76  ^|  Repositorio: Repot
echo ===================================================
echo.

:: 1. Solicita seu e-mail do GitHub apenas se ainda não estiver configurado
for /f "tokens=*" %%i in ('git config --global user.email') do set CURRENT_EMAIL=%%i

if "%CURRENT_EMAIL%"=="" (
    echo [CONFIGURACAO INICIAL NECESSARIA]
    set /p USER_EMAIL="Digite o mesmo e-mail que voce usou para criar a conta no GitHub: "
    git config --global user.email "%USER_EMAIL%"
    git config --global user.name "adriano76"
    echo Identidade configurada com sucesso!
    echo.
)

:: 2. Prepara os arquivos
echo [1/4] A preparar ficheiros...
git add .

:: 3. Cria a versao
echo [2/4] A criar versao (commit)...
git commit -m "Publicacao do forum Repot"

:: 4. Ajusta a ramificacao para main
echo [3/4] A definir branch main...
git branch -M main

:: 5. Conecta ao repositorio
git remote remove origin 2>nul
git remote add origin https://github.com/adriano76/Repot.git

:: 6. Envia para o GitHub
echo [4/4] A enviar ficheiros para o GitHub...
git push -u origin main

echo.
echo ===================================================
echo   Processo finalizado!
echo   Aceda a: https://github.com/adriano76/Repot
echo ===================================================
echo.
pause