# Check VM window
$procs = Get-Process | Where-Object { $_.MainWindowTitle -ne "" }
foreach ($p in $procs) {
    if ($p.MainWindowTitle -match "Worker" -or $p.MainWindowTitle -match "VirtualBox") {
        Write-Host "Found: [$($p.Id)] $($p.ProcessName) - $($p.MainWindowTitle)"
    }
}
