# AutoVideoGen Base VM Template Creation Guide
# This script provides instructions for creating a base VM template

Write-Host @"
=============================================================
  AutoVideoGen Base VM Template Creation Guide
=============================================================

This guide helps you create a base VM template that will be
used as the parent disk for all worker VMs (differencing disks).

PREREQUISITES:
- Windows 11 ISO file
- At least 50GB free disk space
- Hyper-V enabled

STEP 1: Create Base VM
======================
Run these commands in an elevated PowerShell:

# Create VM directory
New-Item -ItemType Directory -Path "C:\VMs\AutoVideoGen\Base-Template" -Force

# Create new VHDX disk (50GB dynamic)
New-VHD -Path "C:\VMs\AutoVideoGen\Base-Template\Base-Template.vhdx" -SizeBytes 50GB -Dynamic

# Create VM
New-VM -Name "AutoVideoGen-Base-Template" ``
    -Path "C:\VMs\AutoVideoGen" ``
    -MemoryStartupBytes 4GB ``
    -VHDPath "C:\VMs\AutoVideoGen\Base-Template\Base-Template.vhdx" ``
    -Generation 2

# Mount Windows ISO
Set-VMDvdDrive -VMName "AutoVideoGen-Base-Template" -Path "C:\path\to\windows11.iso"

# Start VM
Start-VM -Name "AutoVideoGen-Base-Template"


STEP 2: Install Windows
=======================
1. Connect to VM: vmconnect localhost "AutoVideoGen-Base-Template"
2. Install Windows 11 (minimal installation)
3. Create a local admin account
4. Enable Remote Desktop
5. Disable Windows Update (optional, for template stability)


STEP 3: Install Required Software
=================================
In the VM, run these commands:

# Install Chocolatey
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

# Install Node.js
choco install nodejs-lts -y

# Install Python
choco install python311 -y

# Install Git
choco install git -y

# Refresh environment
refreshenv

# Install Playwright
npm install -g playwright
npx playwright install chromium

# Install Python packages
pip install pyautogui pygetwindow pyperclip pillow requests


STEP 4: Configure Network
=========================
1. Open Network Connections (ncpa.cpl)
2. Set static IP based on worker number:
   - Worker-01: 10.0.0.11
   - Worker-02: 10.0.0.12
   - Subnet: 255.255.255.0
   - Gateway: 10.0.0.1
   - DNS: 10.0.0.1 (or your preferred DNS)


STEP 5: Create Worker Agent Directory
=====================================
mkdir C:\AutoVideoGen
mkdir C:\AutoVideoGen\output
mkdir C:\AutoVideoGen\chrome_profile
mkdir C:\AutoVideoGen\logs

# Copy worker agent files to C:\AutoVideoGen\worker


STEP 6: Sysprep (Optional but Recommended)
==========================================
For a clean template that can be cloned multiple times:

C:\Windows\System32\Sysprep\sysprep.exe /oobe /generalize /shutdown

WARNING: This will reset Windows activation and user accounts!


STEP 7: Mark Parent VHDX as Read-Only
=====================================
After VM shuts down:

Stop-VM -Name "AutoVideoGen-Base-Template" -Force
Set-ItemProperty -Path "C:\VMs\AutoVideoGen\Base-Template\Base-Template.vhdx" -Name IsReadOnly -Value `$true


STEP 8: Create Worker VMs
=========================
Now you can create worker VMs using:

.\create-worker-vm.ps1 -ParentVHDX "C:\VMs\AutoVideoGen\Base-Template\Base-Template.vhdx" -WorkerCount 2

=============================================================
"@ -ForegroundColor Cyan
