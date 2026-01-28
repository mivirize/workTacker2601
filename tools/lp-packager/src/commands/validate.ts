/**
 * Validate Command
 *
 * Validates HTML files for proper marker usage.
 */

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import chalk from 'chalk'
import type { ValidateOptions, ValidationMessage } from '../types'
import { parseHtml } from '../utils/marker-parser'

interface ValidateResult {
  success: boolean
  file: string
  markers: number
  repeatBlocks: number
  colors: number
  errors: ValidationMessage[]
  warnings: ValidationMessage[]
  infos: ValidationMessage[]
}

/**
 * Execute the validate command
 */
export async function validateCommand(
  filePath: string,
  options: ValidateOptions = {}
): Promise<ValidateResult> {
  const absolutePath = resolve(process.cwd(), filePath)

  // Read file
  let html: string
  try {
    html = await readFile(absolutePath, 'utf-8')
  } catch (error) {
    throw new Error(`Failed to read file: ${absolutePath}`)
  }

  // Parse and validate
  const { markers, repeatBlocks, colors, validations } = parseHtml(html)

  // Categorize validations
  const errors = validations.filter(v => v.severity === 'error')
  const warnings = validations.filter(v => v.severity === 'warning')
  const infos = validations.filter(v => v.severity === 'info')

  const result: ValidateResult = {
    success: errors.length === 0,
    file: filePath,
    markers: markers.length,
    repeatBlocks: repeatBlocks.length,
    colors: colors.length,
    errors,
    warnings,
    infos,
  }

  // Output based on format
  if (options.format === 'json') {
    console.log(JSON.stringify(result, null, 2))
  } else {
    printTextResult(result, options.verbose)
  }

  return result
}

/**
 * Print validation result in text format
 */
function printTextResult(result: ValidateResult, verbose?: boolean): void {
  console.log()
  console.log(chalk.bold(`✓ Validating: ${result.file}`))
  console.log()

  // Summary
  console.log(`Found ${chalk.cyan(result.markers)} editable markers`)
  if (result.repeatBlocks > 0) {
    console.log(`Found ${chalk.cyan(result.repeatBlocks)} repeat block(s)`)
  }
  console.log(`Found ${chalk.cyan(result.colors)} color variables`)
  console.log()

  // Validation messages
  const totalIssues = result.errors.length + result.warnings.length

  if (result.errors.length > 0) {
    console.log(chalk.red(`Errors: ${result.errors.length}`))
  }
  if (result.warnings.length > 0) {
    console.log(chalk.yellow(`Warnings: ${result.warnings.length}`))
  }

  if (verbose && result.infos.length > 0) {
    console.log(chalk.blue(`Info: ${result.infos.length}`))
  }

  console.log()

  // Print each message
  for (const msg of result.errors) {
    printValidationMessage(msg)
  }

  for (const msg of result.warnings) {
    printValidationMessage(msg)
  }

  if (verbose) {
    for (const msg of result.infos) {
      printValidationMessage(msg)
    }
  }

  // Final status
  console.log()
  if (result.success) {
    if (totalIssues > 0) {
      console.log(chalk.yellow('Validation passed with warnings.'))
    } else {
      console.log(chalk.green('Validation passed.'))
    }
  } else {
    console.log(chalk.red('Validation failed.'))
  }
}

/**
 * Print a single validation message
 */
function printValidationMessage(msg: ValidationMessage): void {
  const prefix = msg.severity === 'error'
    ? chalk.red('[ERROR]')
    : msg.severity === 'warning'
      ? chalk.yellow('[WARNING]')
      : chalk.blue('[INFO]')

  console.log(`${prefix} Line ${msg.line}: ${msg.message}`)
}

/**
 * List all markers in a file
 */
export async function listMarkersCommand(filePath: string): Promise<void> {
  const absolutePath = resolve(process.cwd(), filePath)
  const html = await readFile(absolutePath, 'utf-8')
  const { markers, repeatBlocks } = parseHtml(html)

  console.log()
  console.log(chalk.bold('Editable Markers:'))
  console.log()

  if (markers.length === 0) {
    console.log(chalk.gray('  No markers found.'))
  } else {
    for (const marker of markers) {
      const label = marker.label ? ` (${marker.label})` : ''
      const group = marker.group ? chalk.gray(` [${marker.group}]`) : ''
      console.log(`  ${chalk.cyan(marker.id)}${label}${group}`)
      console.log(`    Type: ${marker.type}, Element: <${marker.element}>`)
    }
  }

  console.log()

  if (repeatBlocks.length > 0) {
    console.log(chalk.bold('Repeat Blocks:'))
    console.log()

    for (const block of repeatBlocks) {
      console.log(`  ${chalk.cyan(block.id)}`)
      console.log(`    Items: ${block.items.length}, Min: ${block.min}, Max: ${block.max}`)
    }

    console.log()
  }
}

/**
 * List all color variables in a file
 */
export async function listColorsCommand(filePath: string): Promise<void> {
  const absolutePath = resolve(process.cwd(), filePath)
  const html = await readFile(absolutePath, 'utf-8')
  const { colors } = parseHtml(html)

  console.log()
  console.log(chalk.bold('Color Variables:'))
  console.log()

  if (colors.length === 0) {
    console.log(chalk.gray('  No color variables found.'))
  } else {
    for (const color of colors) {
      const swatch = chalk.bgHex(color.value.startsWith('#') ? color.value : '#888')('  ')
      console.log(`  ${swatch} ${chalk.cyan(color.variable)}: ${color.value}`)
    }
  }

  console.log()
}
