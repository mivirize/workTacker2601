const { spawn } = require('child_process');
const path = require('path');

// Remove ELECTRON_RUN_AS_NODE from environment
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const exePath = path.join(__dirname, 'LP-Editor.exe');
console.log('Starting:', exePath);

const proc = spawn(exePath, [], {
  cwd: __dirname,
  env: env,
  detached: true,
  stdio: 'ignore',
  windowsHide: false
});

proc.unref();
console.log('LP-Editor launched with PID:', proc.pid);
console.log('Process should now be running independently.');
