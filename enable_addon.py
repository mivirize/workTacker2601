import bpy
import time
import sys
import os

# Add the _repos/blender-mcp directory to sys.path so bpy can find the addon
addon_dir = os.path.join(os.path.dirname(__file__), "_repos", "blender-mcp")
if addon_dir not in sys.path:
    sys.path.append(addon_dir)

try:
    bpy.ops.preferences.addon_enable(module='addon')
    print("Addon enabled successfully")

    # Create and start the MCP server
    from addon import BlenderMCPServer
    if not hasattr(bpy.types, "blendermcp_server") or not bpy.types.blendermcp_server:
        bpy.types.blendermcp_server = BlenderMCPServer(port=9876)
        bpy.types.blendermcp_server.start()
        print("Blender MCP server started on port 9876")

    # Keep blender running to keep server alive
    print("Starting server loop...")
    while True:
        time.sleep(1)
except Exception as e:
    print(f"Failed to enable addon and start server: {e}")
    import traceback
    traceback.print_exc()