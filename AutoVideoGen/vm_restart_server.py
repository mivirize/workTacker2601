"""Restart remote_control.py on VM via VBoxManage keyboard input"""
import subprocess
import time

VBOX = r"C:\Program Files\Oracle\VirtualBox\VBoxManage.exe"
VM = "AutoVideoGen-Worker-01"


def send_keys(codes):
    subprocess.run([VBOX, "controlvm", VM, "keyboardputscancode"] + codes, check=True)
    time.sleep(0.3)


def type_char(ch):
    keymap = {
        "a": ["1e", "9e"], "b": ["30", "b0"], "c": ["2e", "ae"],
        "d": ["20", "a0"], "e": ["12", "92"], "f": ["21", "a1"],
        "g": ["22", "a2"], "h": ["23", "a3"], "i": ["17", "97"],
        "j": ["24", "a4"], "k": ["25", "a5"], "l": ["26", "a6"],
        "m": ["32", "b2"], "n": ["31", "b1"], "o": ["18", "98"],
        "p": ["19", "99"], "q": ["10", "90"], "r": ["13", "93"],
        "s": ["1f", "9f"], "t": ["14", "94"], "u": ["16", "96"],
        "v": ["2f", "af"], "w": ["11", "91"], "x": ["2d", "ad"],
        "y": ["15", "95"], "z": ["2c", "ac"], " ": ["39", "b9"],
        ".": ["34", "b4"], "_": ["2a", "0c", "8c", "aa"],
    }
    if ch in keymap:
        send_keys(keymap[ch])


# Step 1: Ctrl+C to stop server
print("Sending Ctrl+C...")
send_keys(["1d", "2e", "ae", "9d"])
time.sleep(1)
send_keys(["1d", "2e", "ae", "9d"])
time.sleep(2)

# Step 2: Type restart command
print("Typing: python remote_control.py")
for ch in "python remote_control.py":
    type_char(ch)
time.sleep(0.5)

# Step 3: Press Enter
send_keys(["1c", "9c"])
time.sleep(3)

# Step 4: Screenshot
subprocess.run([
    VBOX, "controlvm", VM, "screenshotpng",
    r"C:\Users\owner\Dev\AutoVideoGen\vm_after_restart.png"
], check=True)
print("Restart command sent. Screenshot saved.")
