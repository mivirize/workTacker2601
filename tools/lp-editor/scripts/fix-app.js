/**
 * Post-build verification and fix script
 * - Verifies that the dist directory is correctly included in the packaged app
 * - Copies native module dependencies (sharp) that pnpm doesn't include properly
 */

const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '..')
const appDir = path.join(projectRoot, 'release', 'win-unpacked', 'resources', 'app')
const distDir = path.join(appDir, 'dist')
const nodeModulesDir = path.join(appDir, 'node_modules')

console.log('Verifying packaged app structure...')

// Check if dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('ERROR: dist directory not found in packaged app!')
  process.exit(1)
}

// Check for required files
const requiredFiles = [
  'dist/main/index.js',
  'dist/preload/index.js',
  'dist/renderer/index.html',
]

let allFilesExist = true
for (const file of requiredFiles) {
  const filePath = path.join(appDir, file)
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: Required file not found: ${file}`)
    allFilesExist = false
  } else {
    console.log(`  ✓ ${file}`)
  }
}

if (!allFilesExist) {
  process.exit(1)
}

console.log('')
console.log('Packaged app structure is valid.')

// Copy native sharp bindings from pnpm store
console.log('')
console.log('Copying sharp native bindings...')

const pnpmSharpDir = path.join(projectRoot, 'node_modules', '.pnpm', '@img+sharp-win32-x64@0.34.5', 'node_modules', '@img', 'sharp-win32-x64')
const targetImgDir = path.join(nodeModulesDir, '@img', 'sharp-win32-x64')

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`Source directory not found: ${src}`)
    return false
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }

  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
  return true
}

if (fs.existsSync(pnpmSharpDir)) {
  // Ensure @img directory exists
  const imgDir = path.join(nodeModulesDir, '@img')
  if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true })
  }

  if (copyDirSync(pnpmSharpDir, targetImgDir)) {
    console.log('  ✓ Copied @img/sharp-win32-x64')

    // Verify native binary exists
    const nativeBinary = path.join(targetImgDir, 'lib', 'sharp-win32-x64.node')
    if (fs.existsSync(nativeBinary)) {
      console.log('  ✓ Native binary verified: sharp-win32-x64.node')
    } else {
      console.error('  ✗ Native binary not found!')
    }
  }
} else {
  console.warn('  ⚠ pnpm sharp directory not found, trying npm structure...')

  // Try npm/yarn structure
  const npmSharpDir = path.join(projectRoot, 'node_modules', '@img', 'sharp-win32-x64')
  if (fs.existsSync(npmSharpDir)) {
    if (copyDirSync(npmSharpDir, targetImgDir)) {
      console.log('  ✓ Copied @img/sharp-win32-x64 from npm structure')
    }
  } else {
    console.error('  ✗ Could not find sharp native bindings!')
    console.error('    Run: pnpm install or npm install to ensure sharp is properly installed')
  }
}

console.log('')
console.log('Contents:', fs.readdirSync(appDir))
