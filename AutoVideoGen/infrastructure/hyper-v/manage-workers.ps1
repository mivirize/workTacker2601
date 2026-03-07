# AutoVideoGen Worker VM Management Script
# Provides common management operations for worker VMs

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "status", "restart", "checkpoint", "restore")]
    [string]$Action,

    [string]$VMName = "AutoVideoGen-Worker-*"
)

Write-Host "AutoVideoGen Worker Management: $Action" -ForegroundColor Cyan

switch ($Action) {
    "start" {
        Write-Host "Starting worker VMs..." -ForegroundColor Yellow
        Get-VM -Name $VMName | Where-Object { $_.State -ne "Running" } | ForEach-Object {
            Write-Host "  Starting $($_.Name)..." -ForegroundColor Gray
            Start-VM -Name $_.Name
        }
        Write-Host "All workers started." -ForegroundColor Green
    }

    "stop" {
        Write-Host "Stopping worker VMs..." -ForegroundColor Yellow
        Get-VM -Name $VMName | Where-Object { $_.State -eq "Running" } | ForEach-Object {
            Write-Host "  Stopping $($_.Name)..." -ForegroundColor Gray
            Stop-VM -Name $_.Name -Force
        }
        Write-Host "All workers stopped." -ForegroundColor Green
    }

    "status" {
        Write-Host "`nWorker VM Status:" -ForegroundColor Yellow
        Get-VM -Name $VMName | Format-Table Name, State, CPUUsage, @{
            Label = "Memory (MB)"
            Expression = { [math]::Round($_.MemoryAssigned / 1MB) }
        }, Uptime -AutoSize
    }

    "restart" {
        Write-Host "Restarting worker VMs..." -ForegroundColor Yellow
        Get-VM -Name $VMName | ForEach-Object {
            Write-Host "  Restarting $($_.Name)..." -ForegroundColor Gray
            Restart-VM -Name $_.Name -Force
        }
        Write-Host "All workers restarted." -ForegroundColor Green
    }

    "checkpoint" {
        $checkpointName = "Backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Write-Host "Creating checkpoint: $checkpointName" -ForegroundColor Yellow
        Get-VM -Name $VMName | ForEach-Object {
            Write-Host "  Checkpointing $($_.Name)..." -ForegroundColor Gray
            Checkpoint-VM -Name $_.Name -SnapshotName $checkpointName
        }
        Write-Host "Checkpoints created." -ForegroundColor Green
    }

    "restore" {
        Write-Host "Available checkpoints:" -ForegroundColor Yellow
        $checkpoints = Get-VM -Name $VMName | Get-VMSnapshot
        $checkpoints | Format-Table VMName, Name, CreationTime -AutoSize

        $restoreName = Read-Host "Enter checkpoint name to restore"
        if ($restoreName) {
            Get-VM -Name $VMName | ForEach-Object {
                $snapshot = Get-VMSnapshot -VMName $_.Name -Name $restoreName -ErrorAction SilentlyContinue
                if ($snapshot) {
                    Write-Host "  Restoring $($_.Name) to '$restoreName'..." -ForegroundColor Gray
                    Restore-VMSnapshot -VMName $_.Name -Name $restoreName -Confirm:$false
                }
            }
            Write-Host "Restore complete." -ForegroundColor Green
        }
    }
}
