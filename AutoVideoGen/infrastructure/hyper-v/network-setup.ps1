# AutoVideoGen Hyper-V Network Setup
# Run as Administrator

param(
    [string]$SwitchName = "AutoVideoGen-Net",
    [string]$HostIP = "10.0.0.1",
    [int]$PrefixLength = 24
)

Write-Host "Setting up Hyper-V network for AutoVideoGen..." -ForegroundColor Cyan

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    exit 1
}

# Check if Hyper-V is installed
$hyperv = Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V
if ($hyperv.State -ne "Enabled") {
    Write-Host "Hyper-V is not enabled. Enabling now..." -ForegroundColor Yellow
    Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All -NoRestart
    Write-Host "Hyper-V has been enabled. Please restart your computer and run this script again." -ForegroundColor Yellow
    exit 0
}

# Check if switch already exists
$existingSwitch = Get-VMSwitch -Name $SwitchName -ErrorAction SilentlyContinue
if ($existingSwitch) {
    Write-Host "Virtual switch '$SwitchName' already exists." -ForegroundColor Green
} else {
    # Create Internal Virtual Switch
    Write-Host "Creating Internal Virtual Switch: $SwitchName" -ForegroundColor Yellow
    New-VMSwitch -Name $SwitchName -SwitchType Internal
    Write-Host "Virtual switch created successfully." -ForegroundColor Green
}

# Get the virtual adapter created by the switch
$adapter = Get-NetAdapter | Where-Object { $_.Name -like "*$SwitchName*" }
if (-not $adapter) {
    Write-Host "Waiting for virtual adapter..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    $adapter = Get-NetAdapter | Where-Object { $_.Name -like "*$SwitchName*" }
}

if ($adapter) {
    $adapterName = $adapter.Name
    Write-Host "Found virtual adapter: $adapterName" -ForegroundColor Green

    # Check existing IP configuration
    $existingIP = Get-NetIPAddress -InterfaceAlias $adapterName -AddressFamily IPv4 -ErrorAction SilentlyContinue

    if ($existingIP -and $existingIP.IPAddress -eq $HostIP) {
        Write-Host "IP address $HostIP is already configured." -ForegroundColor Green
    } else {
        # Remove existing IP if any
        if ($existingIP) {
            Remove-NetIPAddress -InterfaceAlias $adapterName -AddressFamily IPv4 -Confirm:$false -ErrorAction SilentlyContinue
        }

        # Set IP address on host adapter
        Write-Host "Configuring IP address: $HostIP/$PrefixLength" -ForegroundColor Yellow
        New-NetIPAddress -InterfaceAlias $adapterName -IPAddress $HostIP -PrefixLength $PrefixLength
        Write-Host "IP address configured successfully." -ForegroundColor Green
    }
} else {
    Write-Host "ERROR: Could not find virtual adapter for switch '$SwitchName'" -ForegroundColor Red
    exit 1
}

# Display configuration summary
Write-Host "`n=== Network Configuration Summary ===" -ForegroundColor Cyan
Write-Host "Switch Name: $SwitchName"
Write-Host "Host IP: $HostIP"
Write-Host "Subnet: 10.0.0.0/$PrefixLength"
Write-Host "Worker VM IPs: 10.0.0.11, 10.0.0.12, ..."
Write-Host "=====================================" -ForegroundColor Cyan

Write-Host "`nNetwork setup complete!" -ForegroundColor Green
