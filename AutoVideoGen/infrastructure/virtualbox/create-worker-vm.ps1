# VirtualBox Worker VM Creation Script
# Creates linked clones from a base VM

param(
    [Parameter(Mandatory=$true)]
    [string]$BaseVMName,

    [int]$WorkerCount = 2,
    [int]$MemoryMB = 4096,
    [int]$CPUs = 2
)

Write-Host "Creating AutoVideoGen Worker VMs..." -ForegroundColor Cyan

$vboxManage = "C:\Program Files\Oracle\VirtualBox\VBoxManage.exe"
if (-not (Test-Path $vboxManage)) {
    Write-Host "ERROR: VirtualBox not found" -ForegroundColor Red
    exit 1
}

# Check if base VM exists
$vmList = & $vboxManage list vms
if ($vmList -notmatch $BaseVMName) {
    Write-Host "ERROR: Base VM '$BaseVMName' not found" -ForegroundColor Red
    Write-Host "Available VMs:" -ForegroundColor Yellow
    & $vboxManage list vms
    exit 1
}

# Get Host-Only adapter name
$adapters = & $vboxManage list hostonlyifs
$adapterName = ($adapters | Select-String "Name:" | Select-Object -First 1).ToString().Split(":")[1].Trim()

if (-not $adapterName) {
    Write-Host "ERROR: No Host-Only adapter found. Run create-network.ps1 first." -ForegroundColor Red
    exit 1
}

Write-Host "Using network adapter: $adapterName" -ForegroundColor Gray

# Create worker VMs
for ($i = 1; $i -le $WorkerCount; $i++) {
    $vmName = "AutoVideoGen-Worker-{0:D2}" -f $i

    Write-Host ""
    Write-Host "Creating $vmName..." -ForegroundColor Yellow

    # Check if already exists
    if ($vmList -match $vmName) {
        Write-Host "  VM '$vmName' already exists. Skipping." -ForegroundColor Yellow
        continue
    }

    # Create linked clone
    & $vboxManage clonevm $BaseVMName --name $vmName --register --mode machine --options link

    # Configure VM
    Write-Host "  Configuring VM..." -ForegroundColor Gray
    & $vboxManage modifyvm $vmName --memory $MemoryMB --cpus $CPUs
    & $vboxManage modifyvm $vmName --nic1 hostonly --hostonlyadapter1 $adapterName
    & $vboxManage modifyvm $vmName --clipboard bidirectional
    & $vboxManage modifyvm $vmName --draganddrop bidirectional

    Write-Host "  Created: $vmName" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Worker VMs Created ===" -ForegroundColor Cyan
Write-Host "Start VMs with: VBoxManage startvm <vmname>"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start each VM"
Write-Host "2. Configure static IP (10.0.0.11, 10.0.0.12, ...)"
Write-Host "3. Copy worker agent files"
Write-Host "4. Run worker agent"
