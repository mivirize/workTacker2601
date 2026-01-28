/**
 * Build Command
 *
 * Packages LP project into a distributable ZIP with Electron editor.
 */

import { readFile, mkdir, copyFile, writeFile, readdir } from 'node:fs/promises'
import { resolve, join, basename, dirname } from 'node:path'
import { createWriteStream, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import archiver from 'archiver'
import chalk from 'chalk'
import ora from 'ora'
import type { BuildOptions, LpConfig } from '../types'
import { parseHtml } from '../utils/marker-parser'
import { validateLpConfig } from '../utils/config-validator'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Default path to packaged Electron app (relative to lp-packager root)
const DEFAULT_EDITOR_PATH = resolve(__dirname, '..', '..', 'lp-editor', 'release', 'win-unpacked')

interface BuildResult {
  success: boolean
  outputPath: string
  files: string[]
  errors: string[]
}

/**
 * Execute the build command
 */
export async function buildCommand(
  projectPath: string = '.',
  options: BuildOptions = {}
): Promise<BuildResult> {
  const spinner = ora('Building LP package...').start()

  const absolutePath = resolve(process.cwd(), projectPath)
  const result: BuildResult = {
    success: false,
    outputPath: '',
    files: [],
    errors: [],
  }

  try {
    // Load config
    const configPath = join(absolutePath, 'lp-config.json')
    let config: LpConfig

    if (existsSync(configPath)) {
      const configContent = await readFile(configPath, 'utf-8')
      const parsed = JSON.parse(configContent)

      // Validate config
      const validation = validateLpConfig(parsed)
      if (!validation.success) {
        const errorMessages = validation.errors?.map(e =>
          e.path ? `${e.path}: ${e.message}` : e.message
        ).join('\n  ')
        throw new Error(`Invalid lp-config.json:\n  ${errorMessages}`)
      }

      config = parsed as LpConfig
    } else {
      // Use defaults if no config found
      config = {
        name: options.client || 'LP Package',
        client: options.client || 'Client',
        version: '1.0.0',
        entry: 'src/index.html',
        output: {
          appName: 'LP-Editor',
          fileName: options.client?.replace(/\s+/g, '-').toLowerCase() || 'lp-editor',
        },
      }
    }

    spinner.text = 'Validating HTML...'

    // Validate entry file
    const entryPath = join(absolutePath, config.entry)
    if (!existsSync(entryPath)) {
      throw new Error(`Entry file not found: ${config.entry}`)
    }

    const html = await readFile(entryPath, 'utf-8')
    const { markers, repeatBlocks, colors, validations } = parseHtml(html)

    // Check for errors
    const errors = validations.filter(v => v.severity === 'error')
    if (errors.length > 0) {
      result.errors = errors.map(e => `Line ${e.line}: ${e.message}`)
      throw new Error('Validation failed. Fix errors before building.')
    }

    spinner.text = 'Preparing package structure...'

    // Determine output directory
    const outputDir = options.output
      ? resolve(process.cwd(), options.output)
      : join(absolutePath, 'dist')

    const packageDir = join(outputDir, config.output.fileName)

    // Create directories
    await mkdir(packageDir, { recursive: true })
    await mkdir(join(packageDir, 'data'), { recursive: true })
    await mkdir(join(packageDir, 'src'), { recursive: true })
    await mkdir(join(packageDir, 'output'), { recursive: true })

    spinner.text = 'Copying source files...'

    // Copy source files
    const srcDir = dirname(entryPath)
    await copyDirectory(srcDir, join(packageDir, 'src'))
    result.files.push('src/')

    // Copy lp-config.json
    if (existsSync(configPath)) {
      await copyFile(configPath, join(packageDir, 'lp-config.json'))
      result.files.push('lp-config.json')
    }

    spinner.text = 'Generating content.json...'

    // Generate initial content.json
    const contentData = generateContentJson(markers, repeatBlocks, colors, config)
    await writeFile(
      join(packageDir, 'data', 'content.json'),
      JSON.stringify(contentData, null, 2),
      'utf-8'
    )
    result.files.push('data/content.json')

    spinner.text = 'Creating README...'

    // Create README
    const readme = generateReadme(config)
    await writeFile(join(packageDir, 'README.txt'), readme, 'utf-8')
    result.files.push('README.txt')

    spinner.text = 'Copying Electron app...'

    // Copy packaged Electron app
    const editorPath = options.editorPath || DEFAULT_EDITOR_PATH
    if (existsSync(editorPath)) {
      await copyDirectory(editorPath, packageDir)
      result.files.push('LP-Editor.exe')
    } else {
      console.log(chalk.yellow(`\nWarning: Editor app not found at ${editorPath}`))
      console.log(chalk.yellow('Run "pnpm run pack" in lp-editor first.'))
    }

    spinner.text = 'Creating ZIP archive...'

    // Create ZIP
    const zipPath = `${packageDir}.zip`
    await createZip(packageDir, zipPath)
    result.outputPath = zipPath

    spinner.succeed(chalk.green('Build completed successfully!'))

    // Print summary
    console.log()
    console.log(chalk.bold('Build Summary:'))
    console.log(`  Package: ${chalk.cyan(config.output.fileName)}`)
    console.log(`  Markers: ${chalk.cyan(markers.length)}`)
    console.log(`  Repeat Blocks: ${chalk.cyan(repeatBlocks.length)}`)
    console.log(`  Colors: ${chalk.cyan(colors.length)}`)
    console.log()
    console.log(`Output: ${chalk.green(zipPath)}`)
    console.log()

    result.success = true
  } catch (error) {
    spinner.fail(chalk.red('Build failed'))
    console.error(chalk.red((error as Error).message))

    if (result.errors.length > 0) {
      console.log()
      console.log(chalk.red('Validation Errors:'))
      for (const err of result.errors) {
        console.log(`  ${err}`)
      }
    }
  }

  return result
}

/**
 * Copy directory recursively
 */
async function copyDirectory(src: string, dest: string): Promise<void> {
  await mkdir(dest, { recursive: true })

  const entries = await readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = join(src, entry.name)
    const destPath = join(dest, entry.name)

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath)
    } else {
      await copyFile(srcPath, destPath)
    }
  }
}

/**
 * Generate initial content.json from parsed markers
 */
function generateContentJson(
  markers: Array<{ id: string; type: string; currentValue: string | null; label?: string; group?: string; attributes: Record<string, string> }>,
  repeatBlocks: Array<{ id: string; min: number; max: number; items: Array<{ index: number; markers: Array<{ id: string; type: string; currentValue: string | null; label?: string; group?: string; attributes: Record<string, string> }> }> }>,
  colors: Array<{ variable: string; value: string; label?: string; description?: string }>,
  config: LpConfig
): Record<string, unknown> {
  const content: Record<string, unknown> = {
    _meta: {
      name: config.name,
      client: config.client,
      version: config.version,
      generatedAt: new Date().toISOString(),
    },
    editables: {} as Record<string, unknown>,
    repeatBlocks: {} as Record<string, unknown>,
    colors: {} as Record<string, unknown>,
  }

  // Add editables
  const editables = content.editables as Record<string, unknown>
  for (const marker of markers) {
    const markerData: Record<string, unknown> = {
      type: marker.type,
      value: marker.currentValue,
      label: marker.label || marker.id,
    }

    // Only add group if present
    if (marker.group) {
      markerData.group = marker.group
    }

    // Add href for links
    if (marker.type === 'link' && marker.attributes.href) {
      markerData.href = marker.attributes.href
    }

    // Add src for images
    if (marker.type === 'image' && marker.attributes.src) {
      markerData.src = marker.attributes.src
    }

    // Add background-image specific attributes
    if (marker.type === 'background-image') {
      markerData.cssVar = marker.attributes['data-css-var'] || undefined
    }

    editables[marker.id] = markerData
  }

  // Add repeat blocks
  const blocks = content.repeatBlocks as Record<string, unknown>
  for (const block of repeatBlocks) {
    blocks[block.id] = {
      min: block.min,
      max: block.max,
      items: block.items.map(item => {
        const itemData: Record<string, unknown> = {}
        for (const marker of item.markers) {
          const shortId = marker.id.split('.').pop() || marker.id
          const markerData: Record<string, unknown> = {
            type: marker.type,
            value: marker.currentValue,
            label: marker.label || shortId,
          }

          // Add group if present
          if (marker.group) {
            markerData.group = marker.group
          }

          // Add href for links
          if (marker.type === 'link' && marker.attributes?.href) {
            markerData.href = marker.attributes.href
          }

          // Add src for images
          if (marker.type === 'image' && marker.attributes?.src) {
            markerData.src = marker.attributes.src
          }

          itemData[shortId] = markerData
        }
        return itemData
      }),
    }
  }

  // Add colors with full info
  const colorData = content.colors as Record<string, unknown>
  for (const color of colors) {
    const key = color.variable.replace('--color-', '')
    colorData[key] = {
      variable: color.variable,
      value: color.value,
      label: color.label || key,
      description: color.description,
    }
  }

  return content
}

/**
 * Generate README file
 */
function generateReadme(config: LpConfig): string {
  return `
${config.name}
${'='.repeat(config.name.length)}

LP-Editor ユーザーガイド

【使い方】

1. LP-Editor.exe を起動してください
2. 左側のパネルでテキスト・画像・カラーを編集できます
3. 編集内容はリアルタイムでプレビューに反映されます
4. 「HTML出力」ボタンをクリックすると output/ フォルダに
   完成したHTMLが出力されます
5. output/ フォルダの内容をFTPでサーバーにアップロードしてください

【フォルダ構成】

├── LP-Editor.exe    ... 編集アプリ
├── data/
│   └── content.json ... 編集データ（自動保存）
├── src/             ... 元のHTMLファイル
└── output/          ... 出力先（HTML出力後に生成）

【注意事項】

- src/ フォルダ内のファイルは直接編集しないでください
- content.json は自動保存されます
- 出力前に必ずプレビューで確認してください

【お問い合わせ】

ご不明な点がございましたら、制作担当者までご連絡ください。

---
Generated: ${new Date().toLocaleDateString('ja-JP')}
`.trim()
}

/**
 * Create ZIP archive
 */
async function createZip(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', () => resolve())
    archive.on('error', (err) => reject(err))

    archive.pipe(output)
    archive.directory(sourceDir, basename(sourceDir))
    archive.finalize()
  })
}
