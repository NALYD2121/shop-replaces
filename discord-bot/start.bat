@echo off
echo ====================================
echo Installation des dependances...
echo ====================================
cd /d "%~dp0"

echo Installation de cors...
call npm install cors

echo Installation des autres dependances...
call npm install discord.js express multer dotenv

echo.
echo ====================================
echo Demarrage du bot Discord...
echo ====================================
node bot.js

if errorlevel 1 (
    echo.
    echo ERREUR: Le bot s'est arrete de maniere inattendue
    echo.
)

echo Appuyez sur une touche pour fermer...
pause > nul 