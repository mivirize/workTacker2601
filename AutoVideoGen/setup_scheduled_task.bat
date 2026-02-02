@echo off
echo === Vrew Automation Scheduled Task Setup ===
echo.
echo This will create a scheduled task to run Vrew automation hourly.
echo Run this as Administrator.
echo.
pause

schtasks /create /tn "VrewAutomation" /tr "C:\Users\owner\AppData\Local\Programs\Python\Python313\python.exe C:\Users\owner\Dev\AutoVideoGen\scripts\background_automation.py --process-one" /sc hourly /st 00:00 /ru %USERNAME% /rl highest

echo.
echo Task created! To run manually:
echo   schtasks /run /tn "VrewAutomation"
echo.
echo To delete:
echo   schtasks /delete /tn "VrewAutomation" /f
echo.
pause
