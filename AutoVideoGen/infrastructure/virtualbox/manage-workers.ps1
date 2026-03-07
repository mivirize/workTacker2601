# VirtualBox Worker VM Management

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "status", "list")]
    [string]$Action,

    [string]$VMPattern = "AutoVideoGen-Worker-*"
)

$vboxManage = "C:\Program Files\Oracle\VirtualBox\VBoxManage.exe"

function Get-WorkerVMs {
    $allVMs = & $vboxManage list vms
    $workers = @()
    foreach ($line in $allVMs) {
        if ($line -match '"(AutoVideoGen-Worker-\d+)"') {
            $workers += $Matches[1]
        }
    }
    return $workers
}

function Get-RunningVMs {
    $running = & $vboxManage list runningvms
    $vms = @()
    foreach ($line in $running) {
        if ($line -match '"([^"]+)"') {
            $vms += $Matches[1]
        }
    }
    return $vms
}

switch ($Action) {
    "start" {
        Write-Host "Starting worker VMs..." -ForegroundColor Yellow
        $workers = Get-WorkerVMs
        $running = Get-RunningVMs
        foreach ($vm in $workers) {
            if ($running -contains $vm) {
                Write-Host "  $vm is already running" -ForegroundColor Gray
            } else {
                Write-Host "  Starting $vm..." -ForegroundColor Cyan
                & $vboxManage startvm $vm --type headless
            }
        }
    }

    "stop" {
        Write-Host "Stopping worker VMs..." -ForegroundColor Yellow
        $workers = Get-WorkerVMs
        foreach ($vm in $workers) {
            Write-Host "  Stopping $vm..." -ForegroundColor Cyan
            & $vboxManage controlvm $vm acpipowerbutton 2>$null
            if ($LASTEXITCODE -ne 0) {
                & $vboxManage controlvm $vm poweroff 2>$null
            }
        }
    }

    "status" {
        Write-Host "Worker VM Status:" -ForegroundColor Cyan
        $workers = Get-WorkerVMs
        $running = Get-RunningVMs

        foreach ($vm in $workers) {
            $status = if ($running -contains $vm) { "[RUNNING]" } else { "[STOPPED]" }
            $color = if ($running -contains $vm) { "Green" } else { "Gray" }
            Write-Host "  $status $vm" -ForegroundColor $color
        }

        if ($workers.Count -eq 0) {
            Write-Host "  No worker VMs found" -ForegroundColor Yellow
        }
    }

    "list" {
        Write-Host "All VMs:" -ForegroundColor Cyan
        & $vboxManage list vms
    }
}
