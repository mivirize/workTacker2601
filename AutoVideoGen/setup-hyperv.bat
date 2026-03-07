@echo off
echo ============================================
echo   AutoVideoGen Hyper-V Setup
echo   (Requires Administrator privileges)
echo ============================================
echo.

:: Check for admin privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: This script requires Administrator privileges.
    echo.
    echo Right-click this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo [1/4] Checking Hyper-V status...
powershell -Command "Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V | Select-Object State"

echo.
echo [2/4] Setting up network...
cd /d "%~dp0infrastructure\hyper-v"
powershell -ExecutionPolicy Bypass -File "network-setup.ps1"

echo.
echo [3/4] Network setup complete!
echo.
echo Next steps:
echo   1. Create a base VM template manually (see SETUP.md)
echo   2. Run create-worker-vm.ps1 to create worker VMs
echo.
pause
