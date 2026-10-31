@echo off
rem Enciende la app de PAGOS y la abre en el navegador. Deja esta ventana abierta mientras la usas.
cd /d "%~dp0"
if not exist node_modules (
  echo Instalando dependencias por primera vez...
  call npm install
)
call npm run dev -- --open
pause
