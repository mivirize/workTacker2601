# VirtualBox Host-Only Network Setup
# Run after VirtualBox is installed

param(
    [string]$NetworkName = "AutoVideoGen-Net",
    [string]$HostIP = "10.0.0.1",
    [string]$DHCPLower = "10.0.0.11",
    [string]$DHCPUpper = "10.0.0.20"
)

Write-Host "Setting up VirtualBox network for AutoVideoGen..." -ForegroundColor Cyan

# Check if VBoxManage exists
$vboxManage = "C:\Program Files\Oracle\VirtualBox\VBoxManage.exe"
if (-not (Test-Path $vboxManage)) {
    Write-Host "ERROR: VirtualBox not found at $vboxManage" -ForegroundColor Red
    Write-Host "Please install VirtualBox first: https://www.virtualbox.org/wiki/Downloads" -ForegroundColor Yellow
    exit 1
}

# Create Host-Only Network
Write-Host "Creating Host-Only network..." -ForegroundColor Yellow
& $vboxManage hostonlyif create

# Get the created adapter name
$adapters = & $vboxManage list hostonlyifs
$adapterName = ($adapters | Select-String "Name:" | Select-Object -Last 1).ToString().Split(":")[1].Trim()

Write-Host "Created adapter: $adapterName" -ForegroundColor Green

# Configure IP
Write-Host "Configuring IP: $HostIP" -ForegroundColor Yellow
& $vboxManage hostonlyif ipconfig $adapterName --ip $HostIP --netmask 255.255.255.0

# Configure DHCP
Write-Host "Configuring DHCP server..." -ForegroundColor Yellow
& $vboxManage dhcpserver add --ifname $adapterName --ip 10.0.0.2 --netmask 255.255.255.0 --lowerip $DHCPLower --upperip $DHCPUpper --enable

Write-Host ""
Write-Host "=== Network Setup Complete ===" -ForegroundColor Cyan
Write-Host "Adapter: $adapterName"
Write-Host "Host IP: $HostIP"
Write-Host "DHCP Range: $DHCPLower - $DHCPUpper"
Write-Host ""
Write-Host "Next: Create VMs using create-worker-vm.ps1" -ForegroundColor Yellow
