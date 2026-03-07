# AutoVideoGen Worker VM Creation Script
# Creates worker VMs using differencing disks from a base template
# Run as Administrator

param(
    [Parameter(Mandatory=$true)]
    [string]$ParentVHDX,

    [string]$VMPath = "C:\VMs\AutoVideoGen",
    [string]$SwitchName = "AutoVideoGen-Net",
    [int]$WorkerCount = 2,
    [int]$MemoryMB = 4096,
    [int]$CPUCount = 2
)

Write-Host "Creating AutoVideoGen Worker VMs..." -ForegroundColor Cyan

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    exit 1
}

# Verify parent VHDX exists
if (-not (Test-Path $ParentVHDX)) {
    Write-Host "ERROR: Parent VHDX not found: $ParentVHDX" -ForegroundColor Red
    Write-Host "Please create a base VM template first using create-base-vm.ps1" -ForegroundColor Yellow
    exit 1
}

# Verify virtual switch exists
$switch = Get-VMSwitch -Name $SwitchName -ErrorAction SilentlyContinue
if (-not $switch) {
    Write-Host "ERROR: Virtual switch '$SwitchName' not found" -ForegroundColor Red
    Write-Host "Please run network-setup.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Create VM directory if it doesn't exist
if (-not (Test-Path $VMPath)) {
    New-Item -ItemType Directory -Path $VMPath -Force | Out-Null
    Write-Host "Created VM directory: $VMPath" -ForegroundColor Green
}

# Create worker VMs
for ($i = 1; $i -le $WorkerCount; $i++) {
    $vmName = "AutoVideoGen-Worker-{0:D2}" -f $i
    $vmFolder = Join-Path $VMPath $vmName
    $diffDisk = Join-Path $vmFolder "$vmName.vhdx"
    $workerIP = "10.0.0.{0}" -f (10 + $i)

    Write-Host "`nCreating VM: $vmName" -ForegroundColor Yellow

    # Check if VM already exists
    $existingVM = Get-VM -Name $vmName -ErrorAction SilentlyContinue
    if ($existingVM) {
        Write-Host "VM '$vmName' already exists. Skipping..." -ForegroundColor Yellow
        continue
    }

    # Create VM folder
    if (-not (Test-Path $vmFolder)) {
        New-Item -ItemType Directory -Path $vmFolder -Force | Out-Null
    }

    # Create differencing disk
    Write-Host "  Creating differencing disk..." -ForegroundColor Gray
    New-VHD -Path $diffDisk -ParentPath $ParentVHDX -Differencing | Out-Null

    # Create VM
    Write-Host "  Creating virtual machine..." -ForegroundColor Gray
    New-VM -Name $vmName `
        -Path $VMPath `
        -MemoryStartupBytes ($MemoryMB * 1MB) `
        -VHDPath $diffDisk `
        -Generation 2 | Out-Null

    # Configure VM
    Write-Host "  Configuring VM settings..." -ForegroundColor Gray

    # Set CPU count
    Set-VMProcessor -VMName $vmName -Count $CPUCount

    # Configure memory
    Set-VMMemory -VMName $vmName `
        -DynamicMemoryEnabled $true `
        -MinimumBytes (1024 * 1MB) `
        -MaximumBytes ($MemoryMB * 1MB) `
        -StartupBytes ($MemoryMB * 1MB)

    # Connect to network
    Get-VMNetworkAdapter -VMName $vmName | Remove-VMNetworkAdapter
    Add-VMNetworkAdapter -VMName $vmName -SwitchName $SwitchName

    # Enable auto-start
    Set-VM -VMName $vmName `
        -AutomaticStartAction Start `
        -AutomaticStartDelay ($i * 15) `
        -AutomaticStopAction ShutDown

    # Disable secure boot (if needed for some configurations)
    Set-VMFirmware -VMName $vmName -EnableSecureBoot Off -ErrorAction SilentlyContinue

    Write-Host "  VM created successfully!" -ForegroundColor Green
    Write-Host "  - Name: $vmName" -ForegroundColor Gray
    Write-Host "  - Expected IP: $workerIP" -ForegroundColor Gray
    Write-Host "  - Memory: $MemoryMB MB" -ForegroundColor Gray
    Write-Host "  - CPUs: $CPUCount" -ForegroundColor Gray
}

# Display summary
Write-Host "`n=== Worker VM Creation Summary ===" -ForegroundColor Cyan
Write-Host "Created $WorkerCount worker VMs"
Write-Host "Parent VHDX: $ParentVHDX"
Write-Host "VM Path: $VMPath"
Write-Host "Network: $SwitchName"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start VMs: Start-VM -Name 'AutoVideoGen-Worker-*'"
Write-Host "2. Configure static IPs in each VM (10.0.0.11, 10.0.0.12, ...)"
Write-Host "3. Install worker agent in each VM"
Write-Host "4. Set ORCHESTRATOR_URL=http://10.0.0.1:8000"
Write-Host "===================================" -ForegroundColor Cyan
