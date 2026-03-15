@echo off
echo Starting LP-Editor in Admin Mode...
cd /d "%~dp0release\win-unpacked"
start "" "LP-Editor.exe" --admin
