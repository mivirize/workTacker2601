import json
import base64
from pathlib import Path

input_file = Path(__file__).parent / "vm_screenshot.json"
output_file = Path(__file__).parent / "vm_screenshot.png"

with open(input_file, "r") as f:
    data = json.load(f)

with open(output_file, "wb") as f:
    f.write(base64.b64decode(data["image"]))

print(f"Screenshot saved to: {output_file}")
