Add-Type -AssemblyName System.Windows.Forms

# Find VirtualBox window
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

    # Open Start menu
    [System.Windows.Forms.SendKeys]::SendWait("^{ESC}")
    Start-Sleep -Milliseconds 1000

    # Type powershell
    [System.Windows.Forms.SendKeys]::SendWait("powershell")
    Start-Sleep -Milliseconds 1000

    # Press Enter
    [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
    Write-Host "Keys sent successfully"
} else {
    Write-Host "VM window not found"
    Get-Process | Where-Object { $_.MainWindowTitle -ne "" } | ForEach-Object { Write-Host $_.MainWindowTitle }
}
