Set WshShell = CreateObject("WScript.Shell")
WshShell.Environment("Process")("ELECTRON_RUN_AS_NODE") = ""
WshShell.CurrentDirectory = "C:\Users\owner\Dev\tools\lp-projects\demo-saas"
WshShell.Run "LP-Editor.exe", 1, False
