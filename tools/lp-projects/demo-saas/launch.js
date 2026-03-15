const { spawn } = require('child_process');
const path = require('path');

// Remove ELECTRON_RUN_AS_NODE from environment
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const exePath = path.join(__dirname, 'LP-Editor.exe');
console.log('Starting:', exePath);
console.log('Working directory:', __dirname);
console.log('ELECTRON_RUN_AS_NODE:', env.ELECTRON_RUN_AS_NODE || '(not set)');

const proc = spawn(exePath, [], {
  cwd: __dirname,
  env: env,
  detached: true,
  stdio: 'ignore'
});

proc.unref();
console.log('LP-Editor started with PID:', proc.pid);
process.exit(0);
