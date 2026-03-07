@echo off
cd /d "%~dp0.."
echo Adding sample tasks...
python tools\add_task.py --file tools\sample_tasks.json
pause
