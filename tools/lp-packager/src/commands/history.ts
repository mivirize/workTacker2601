/**
 * LP Package History Command
 *
 * View and manage package build history.
 */

import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { resolve, join } from 'path'
import chalk from 'chalk'
import { PackageManifest, HistoryOptions, BuildRecord } from '../types'

const HISTORY_DIR = '.lp-history'
const MANIFEST_FILE = 'manifest.json'

/**
 * Load package manifest
 */
export async function loadManifest(projectPath: string): Promise<PackageManifest | null> {
  const manifestPath = join(projectPath, HISTORY_DIR, MANIFEST_FILE)

  if (!existsSync(manifestPath)) {
    return null
  }

  const content = await readFile(manifestPath, 'utf-8')
  return JSON.parse(content)
}

/**
 * Format file size
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/**
 * Format date
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * History command
 */
export async function historyCommand(
  projectPath: string = '.',
  options: HistoryOptions = {}
): Promise<{ success: boolean; manifest?: PackageManifest }> {
  const resolvedPath = resolve(projectPath)

  // Check if path exists
  if (!existsSync(resolvedPath)) {
    console.error(chalk.red(`Error: Path does not exist: ${resolvedPath}`))
    return { success: false }
  }

  // Load manifest
  const manifest = await loadManifest(resolvedPath)

  if (!manifest) {
    console.log(chalk.yellow('No build history found.'))
    console.log(chalk.gray('Run `lp-packager build` to create your first build.'))
    return { success: true }
  }

  // JSON output
  if (options.json) {
    console.log(JSON.stringify(manifest, null, 2))
    return { success: true, manifest }
  }

  // Text output
  console.log('')
  console.log(chalk.bold('Package Build History'))
  console.log('='.repeat(60))
  console.log('')
  console.log(`Project: ${chalk.cyan(manifest.projectName)}`)
  console.log(`Client:  ${chalk.cyan(manifest.client)}`)
  console.log(`ID:      ${chalk.gray(manifest.projectId)}`)
  console.log('')

  // Get builds (limit if specified)
  const builds = options.limit
    ? manifest.builds.slice(-options.limit)
    : manifest.builds

  if (builds.length === 0) {
    console.log(chalk.yellow('No builds yet.'))
    return { success: true, manifest }
  }

  console.log(chalk.bold(`Builds (${manifest.builds.length} total):`))
  console.log('-'.repeat(60))

  for (const build of builds.reverse()) {
    const versionColor = build.version.startsWith('1.0') ? chalk.green : chalk.blue
    console.log('')
    console.log(`  ${versionColor(build.version)} (${build.buildId})`)
    console.log(`  ${chalk.gray('Date:')}     ${formatDate(build.buildDate)}`)
    console.log(`  ${chalk.gray('Size:')}     ${formatSize(build.size)}`)
    console.log(`  ${chalk.gray('Content:')}  ${build.markers} markers, ${build.repeatBlocks} repeat blocks, ${build.colors} colors`)
    if (build.notes) {
      console.log(`  ${chalk.gray('Notes:')}    ${build.notes}`)
    }
  }

  console.log('')
  console.log('-'.repeat(60))
  console.log('')

  return { success: true, manifest }
}

/**
 * Get latest build
 */
export function getLatestBuild(manifest: PackageManifest): BuildRecord | null {
  if (manifest.builds.length === 0) {
    return null
  }
  return manifest.builds[manifest.builds.length - 1]
}

/**
 * Get next version (auto-increment patch)
 */
export function getNextVersion(manifest: PackageManifest | null): string {
  if (!manifest || manifest.builds.length === 0) {
    return '1.0.0'
  }

  const latest = getLatestBuild(manifest)
  if (!latest) return '1.0.0'

  const parts = latest.version.split('.').map(Number)
  parts[2] = (parts[2] || 0) + 1
  return parts.join('.')
}
