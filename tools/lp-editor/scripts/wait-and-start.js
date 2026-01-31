/**
 * Wait for Vite dev server to be ready, then start Electron.
 */
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');

const VITE_PORT = 5173;
const MAX_RETRIES = 30;
const RETRY_INTERVAL = 1000;

function checkViteReady() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${VITE_PORT}`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForVite() {
  console.log('Waiting for Vite dev server...');

  for (let i = 0; i < MAX_RETRIES; i++) {
    const ready = await checkViteReady();
    if (ready) {
      console.log('Vite dev server is ready!');
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
  }

  console.error('Vite dev server did not start in time');
  return false;
}

async function startElectron() {
  const viteReady = await waitForVite();
  if (!viteReady) {
    process.exit(1);
  }

  // Remove ELECTRON_RUN_AS_NODE from environment
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  env.NODE_ENV = 'development';
  env.ELECTRON_RENDERER_URL = `http://localhost:${VITE_PORT}`;

  // Check for project path from command line argument or environment variable
  const projectArg = process.argv.find(arg => arg.startsWith('--project='));
  if (projectArg) {
    env.LP_PROJECT_PATH = projectArg.split('=')[1];
  }

  // Ensure LP_PROJECT_PATH is passed through
  if (env.LP_PROJECT_PATH) {
    console.log(`Project path: ${env.LP_PROJECT_PATH}`);
  } else {
    console.log('No project path specified, will use default or show project selector');
  }

  // Find electron binary
  const electronPath = require('electron');

  console.log('Starting Electron...');

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
}

startElectron();
