/**
 * Post-build verification script
 * Verifies that the dist directory is correctly included in the packaged app
 */

const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '..')
const appDir = path.join(projectRoot, 'release', 'win-unpacked', 'resources', 'app')
const distDir = path.join(appDir, 'dist')

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
console.log('Contents:', fs.readdirSync(appDir))
