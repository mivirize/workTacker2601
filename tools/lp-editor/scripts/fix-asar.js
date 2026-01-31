/**
 * Fix app.asar to include the out directory
 * This script runs after electron-builder to ensure the out directory is included in app.asar
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '..')
const resourcesDir = path.join(projectRoot, 'release', 'win-unpacked', 'resources')
const asarPath = path.join(resourcesDir, 'app.asar')
const tempDir = path.join(resourcesDir, 'app-temp')
const outDir = path.join(projectRoot, 'out')

console.log('Fixing app.asar to include out directory...')

// Extract app.asar
console.log('Extracting app.asar...')
execSync(`npx @electron/asar extract "${asarPath}" "${tempDir}"`, { stdio: 'inherit' })

// Copy out directory
console.log('Copying out directory...')
const copyDir = (src, dest) => {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

copyDir(outDir, path.join(tempDir, 'out'))

// Remove old app.asar
fs.unlinkSync(asarPath)

// Create new app.asar
console.log('Creating new app.asar...')
execSync(`npx @electron/asar pack "${tempDir}" "${asarPath}"`, { stdio: 'inherit' })

// Cleanup
console.log('Cleaning up...')
fs.rmSync(tempDir, { recursive: true, force: true })

console.log('Done! app.asar now includes the out directory.')
