@echo off
echo Clearing ELECTRON_RUN_AS_NODE...
set ELECTRON_RUN_AS_NODE=
echo ELECTRON_RUN_AS_NODE is now: "%ELECTRON_RUN_AS_NODE%"
cd /d %~dp0
echo Current directory: %CD%
echo Starting LP-Editor.exe...
LP-Editor.exe
echo LP-Editor exited with code: %ERRORLEVEL%
pause
