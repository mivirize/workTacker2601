/**
 * Start LP-Editor with this project
 *
 * Validates project structure before launching LP-Editor.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectPath = __dirname;
const lpEditorPath = path.join(__dirname, '..', '..', 'lp-editor');

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateProject() {
  log('\n=== LP-Editor Project Validator ===\n', 'cyan');
  log(`Project path: ${projectPath}`, 'blue');

  let valid = true;
  const errors = [];
  const warnings = [];

  // Check if project directory exists
  if (!fs.existsSync(projectPath)) {
    errors.push(`Project directory does not exist: ${projectPath}`);
    valid = false;
  }

  // Check for src/index.html (required)
  const htmlPath = path.join(projectPath, 'src', 'index.html');
  if (fs.existsSync(htmlPath)) {
    log('  [OK] src/index.html', 'green');
  } else {
    errors.push('Required file missing: src/index.html');
    valid = false;
  }

  // Check for lp-config.json (optional but recommended)
  const configPath = path.join(projectPath, 'lp-config.json');
  if (fs.existsSync(configPath)) {
    log('  [OK] lp-config.json', 'green');
  } else {
    warnings.push('Optional file missing: lp-config.json');
  }

  // Check for src/css directory (optional)
  const cssPath = path.join(projectPath, 'src', 'css');
  if (fs.existsSync(cssPath)) {
    log('  [OK] src/css/', 'green');
  } else {
    warnings.push('Optional directory missing: src/css/');
  }

  // Check for src/js directory (optional)
  const jsPath = path.join(projectPath, 'src', 'js');
  if (fs.existsSync(jsPath)) {
    log('  [OK] src/js/', 'green');
  } else {
    warnings.push('Optional directory missing: src/js/');
  }

  // Check for src/images directory (optional)
  const imagesPath = path.join(projectPath, 'src', 'images');
  if (fs.existsSync(imagesPath)) {
    log('  [OK] src/images/', 'green');
  } else {
    warnings.push('Optional directory missing: src/images/');
  }

  // Check LP-Editor exists
  if (!fs.existsSync(lpEditorPath)) {
    errors.push(`LP-Editor not found: ${lpEditorPath}`);
    valid = false;
  } else {
    log(`  [OK] LP-Editor found at: ${lpEditorPath}`, 'green');
  }

  // Display warnings
  if (warnings.length > 0) {
    log('\nWarnings:', 'yellow');
    warnings.forEach(w => log(`  - ${w}`, 'yellow'));
  }

  // Display errors
  if (errors.length > 0) {
    log('\nErrors:', 'red');
    errors.forEach(e => log(`  - ${e}`, 'red'));
    log('\nProject validation failed. Please fix the errors above.\n', 'red');
    return false;
  }

  log('\nProject validation passed!\n', 'green');
  return true;
}

function startEditor() {
  // Validate project before starting
  if (!validateProject()) {
    process.exit(1);
  }

  // Set project path environment variable
  process.env.LP_PROJECT_PATH = projectPath;

  log('Starting LP-Editor...', 'cyan');
  log(`Project: ${projectPath}\n`, 'blue');

  // Start npm dev in lp-editor directory
  const child = spawn('npm', ['run', 'dev'], {
    cwd: lpEditorPath,
    env: process.env,
    stdio: 'inherit',
    shell: true,
  });

  child.on('error', (err) => {
    log(`Failed to start LP-Editor: ${err.message}`, 'red');
    process.exit(1);
  });

  child.on('close', (code) => {
    if (code !== 0) {
      log(`LP-Editor exited with code ${code}`, 'red');
    }
    process.exit(code || 0);
  });
}

// Run
startEditor();
