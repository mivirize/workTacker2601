Add-Type -AssemblyName System.Windows.Forms

# Find VirtualBox window for Worker-01
$process = Get-Process | Where-Object { $_.MainWindowTitle -like '*Worker-01*' }
if ($process) {
    Write-Host "Found VM window: $($process.MainWindowTitle)"
    Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    public class Win32 {
        [DllImport("user32.dll")]
        public static extern bool SetForegroundWindow(IntPtr hWnd);
    }
"@
    [Win32]::SetForegroundWindow($process.MainWindowHandle)
    Start-Sleep -Milliseconds 500

    # Commands to send to VM
    $commands = @(
        # 1. Install Python packages
        "pip install pyperclip pyautogui pygetwindow",
        # 2. Set environment variable
        "`$env:VREW_USE_DESKTOP='true'",
        # 3. Navigate to worker directory
        "cd C:\AutoVideoGen\worker",
        # 4. Download latest scripts from host
        "Invoke-WebRequest -Uri 'http://10.0.0.1:8080/worker/automation/vrew_desktop_controller.py' -OutFile 'automation\vrew_desktop_controller.py'",
        # 5. Start worker agent
        "python agent\main.py"
    )

    Write-Host ""
    Write-Host "=== Sending commands to VM ===" -ForegroundColor Cyan
    Write-Host ""

    foreach ($cmd in $commands) {
        Write-Host "Sending: $cmd" -ForegroundColor Yellow

        # Type the command
        [System.Windows.Forms.SendKeys]::SendWait($cmd)
        Start-Sleep -Milliseconds 300

        # Press Enter
        [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
        Start-Sleep -Milliseconds 2000

        Write-Host "  Done." -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "=== All commands sent ===" -ForegroundColor Cyan
} else {
    Write-Host "VM window not found. Available windows:" -ForegroundColor Red
    Get-Process | Where-Object { $_.MainWindowTitle -ne "" } | ForEach-Object { Write-Host "  - $($_.MainWindowTitle)" }
}
