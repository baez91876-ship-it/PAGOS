@echo off
rem Enciende PAGOS con la base de datos MongoDB local y la abre en el navegador.
rem Deja esta ventana abierta mientras la usas.
cd /d "%~dp0"
if not exist node_modules (
  echo Instalando dependencias por primera vez...
  call npm install
)
call npm run build
start "" http://localhost:3001
node servidor.js
pause
