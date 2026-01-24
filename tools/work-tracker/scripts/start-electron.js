/**
 * Start Electron with ELECTRON_RUN_AS_NODE unset.
 * This is necessary when running from environments like Claude Code
 * that set ELECTRON_RUN_AS_NODE=1 for their own shell processes.
 */
const { spawn } = require('child_process');
const path = require('path');

// Remove ELECTRON_RUN_AS_NODE from environment
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

// Find electron binary
const electronPath = require('electron');

// Spawn electron with clean environment
const child = spawn(electronPath, ['.'], {
  cwd: path.join(__dirname, '..'),
  env,
  stdio: 'inherit',
  shell: false,
});

child.on('close', (code) => {
  process.exit(code || 0);
});

child.on('error', (err) => {
  console.error('Failed to start Electron:', err);
  process.exit(1);
});
