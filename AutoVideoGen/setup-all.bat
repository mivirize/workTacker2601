@echo off
REM AutoVideoGen - One-Click Setup Script
REM This script sets up the entire Hyper-V infrastructure

echo ===================================================================
echo   AutoVideoGen - Complete Setup
echo ===================================================================
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: This script must be run as Administrator
    echo.
    echo Right-click this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo [1/5] Checking system requirements...
echo.

REM Check Windows version
ver | findstr /i "10\.0\." > nul
if %errorlevel% neq 0 (
    echo ERROR: Windows 10 or 11 is required
    pause
    exit /b 1
)

REM Check if Hyper-V is available
powershell -Command "if ((Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V).State -eq 'Disabled') { exit 0 } else { exit 1 }" >nul 2>&1
set HYPERV_DISABLED=%errorlevel%

if %HYPERV_DISABLED%==0 (
    echo Hyper-V is not enabled on this system.
    echo.
    echo This script will:
    echo   - Enable Hyper-V feature
    echo   - Require a system reboot
    echo.
    set /p CONFIRM="Do you want to enable Hyper-V? (Y/N): "
    if /i "%CONFIRM%" neq "Y" (
        echo Setup cancelled.
        pause
        exit /b 0
    )
    
    echo.
    echo [2/5] Enabling Hyper-V...
    powershell -Command "Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All -NoRestart"
    
    echo.
    echo ===================================================================
    echo   Hyper-V has been enabled!
    echo ===================================================================
    echo.
    echo IMPORTANT: Your computer needs to restart to complete the setup.
    echo.
    echo After restart, please run this script again to continue setup.
    echo.
    set /p REBOOT="Restart now? (Y/N): "
    if /i "%REBOOT%"=="Y" (
        shutdown /r /t 10 /c "Restarting to complete Hyper-V installation"
        echo Computer will restart in 10 seconds...
        timeout /t 10
    ) else (
        echo.
        echo Please restart your computer manually, then run this script again.
    )
    exit /b 0
)

echo Hyper-V is enabled - OK
echo.

echo [2/5] Setting up Hyper-V network...
echo.
pushd "%~dp0infrastructure\hyper-v"
powershell -ExecutionPolicy Bypass -File "network-setup.ps1"
set NETWORK_RESULT=%errorlevel%
popd

if %NETWORK_RESULT% neq 0 (
    echo ERROR: Network setup failed
    pause
    exit /b 1
)

echo.
echo [3/5] Checking for base VM template...
echo.

set BASE_VHDX=C:\VMs\AutoVideoGen\Base-Template\Base-Template.vhdx
if not exist "%BASE_VHDX%" (
    echo.
    echo ===================================================================
    echo   Base VM Template Not Found
    echo ===================================================================
    echo.
    echo You need to create a base VM template before creating worker VMs.
    echo.
    echo The base VM template is a Windows installation that will be used
    echo as the parent disk for all worker VMs using differencing disks.
    echo.
    echo To create a base VM template:
    echo.
    echo   1. View the guide:
    echo      infrastructure\hyper-v\create-base-vm.ps1
    echo.
    echo   2. Or follow manual steps in SETUP.md
    echo.
    echo After creating the base VM, run this script again.
    echo ===================================================================
    echo.
    pause
    exit /b 0
)

echo Base VM template found: %BASE_VHDX%
echo.

echo [4/5] Creating worker VMs...
echo.
echo How many worker VMs do you want to create?
set /p WORKER_COUNT="Enter number (1-4, recommended: 2): "
if "%WORKER_COUNT%"=="" set WORKER_COUNT=2

echo.
echo Creating %WORKER_COUNT% worker VM(s)...
pushd "%~dp0infrastructure\hyper-v"
powershell -ExecutionPolicy Bypass -File "create-worker-vm.ps1" -ParentVHDX "%BASE_VHDX%" -WorkerCount %WORKER_COUNT%
set WORKER_RESULT=%errorlevel%
popd

if %WORKER_RESULT% neq 0 (
    echo ERROR: Worker VM creation failed
    pause
    exit /b 1
)

echo.
echo [5/5] Setup complete!
echo.

echo ===================================================================
echo   Setup Summary
echo ===================================================================
echo.
echo Network:
echo   - Virtual Switch: AutoVideoGen-Net (Internal)
echo   - Host IP: 10.0.0.1/24
echo.
echo Worker VMs created: %WORKER_COUNT%
echo   - AutoVideoGen-Worker-01 (Expected IP: 10.0.0.11)
echo   - AutoVideoGen-Worker-02 (Expected IP: 10.0.0.12)
echo   - ... etc
echo.
echo Base Template: %BASE_VHDX%
echo.
echo ===================================================================
echo   Next Steps
echo ===================================================================
echo.
echo 1. Start worker VMs:
echo    PowerShell: infrastructure\hyper-v\manage-workers.ps1 -Action start
echo.
echo 2. Configure each VM:
echo    - Set static IP (10.0.0.11, 10.0.0.12, etc.)
echo    - Install worker agent
echo    - Set ORCHESTRATOR_URL=http://10.0.0.1:8000
echo.
echo 3. Start the orchestrator:
echo    start-orchestrator.bat
echo.
echo 4. Check system status:
echo    python tools\status.py
echo.
echo For detailed instructions, see SETUP.md
echo ===================================================================
echo.
pause
