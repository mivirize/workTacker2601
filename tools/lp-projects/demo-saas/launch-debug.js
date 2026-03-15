const { spawn } = require('child_process');
const path = require('path');

// Remove ELECTRON_RUN_AS_NODE from environment
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const exePath = path.join(__dirname, 'LP-Editor.exe');
console.log('Starting:', exePath);
console.log('Working directory:', __dirname);

const proc = spawn(exePath, [], {
  cwd: __dirname,
  env: env,
  stdio: ['ignore', 'pipe', 'pipe']
});

proc.stdout.on('data', (data) => {
  console.log('STDOUT:', data.toString());
});

proc.stderr.on('data', (data) => {
  console.log('STDERR:', data.toString());
});

proc.on('error', (err) => {
  console.log('Error:', err);
});

proc.on('exit', (code, signal) => {
  console.log('Exit code:', code, 'Signal:', signal);
});

// Keep script running for a while
setTimeout(() => {
  console.log('Timeout reached, exiting...');
  process.exit(0);
}, 10000);
