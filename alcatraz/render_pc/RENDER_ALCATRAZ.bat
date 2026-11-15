@echo off
cd /d "%~dp0"
title Render Alcatraz
set PY=
where python >nul 2>nul && set PY=python
if not defined PY where py >nul 2>nul && set PY=py -3
if not defined PY for /d %%D in ("%LOCALAPPDATA%\Python\pythoncore-3*") do if exist "%%D\python.exe" set PY="%%D\python.exe"
if not defined PY for /d %%D in ("%LOCALAPPDATA%\Programs\Python\Python3*") do if exist "%%D\python.exe" set PY="%%D\python.exe"
if not defined PY for /d %%D in ("C:\Program Files\Python3*") do if exist "%%D\python.exe" set PY="%%D\python.exe"
if not defined PY (echo Necesitas Python 3: https://www.python.org/downloads/  ^(marca "Add python.exe to PATH"^) & pause & exit /b)
echo Usando %PY%
echo Instalando dependencias...
%PY% -m pip install --quiet --upgrade playwright pillow imageio-ffmpeg
%PY% -m playwright install chromium
echo.
echo Renderizando con tu GPU. Se abrira una ventana de navegador: no la cierres.
%PY% -u render_all.py %* 2>&1 | powershell -NoProfile -Command "$input | Tee-Object -FilePath render_log.txt"
echo.
echo FIN
pause
