/**
 * LP Package Verify Command
 *
 * Verifies LP package integrity and quality.
 */

import { existsSync } from 'fs'
import { resolve } from 'path'
import chalk from 'chalk'
import ora from 'ora'
import { verifyBuild, VerifyResult } from '../utils/verifier'

export interface VerifyOptions {
  json?: boolean
  fix?: boolean
}

export interface VerifyCommandResult {
  success: boolean
  result?: VerifyResult
}

/**
 * Verify command
 */
export async function verifyCommand(
  outputPath: string = '.',
  options: VerifyOptions = {}
): Promise<VerifyCommandResult> {
  const resolvedPath = resolve(outputPath)

  // Check if path exists
  if (!existsSync(resolvedPath)) {
    console.error(chalk.red(`Error: Path does not exist: ${resolvedPath}`))
    return { success: false }
  }

  const spinner = ora('Verifying LP package...').start()

  try {
    const result = await verifyBuild(resolvedPath)

    spinner.stop()

    // Output based on format
    if (options.json) {
      console.log(JSON.stringify(result, null, 2))
    } else {
      // Print report
      console.log('')
      console.log(result.report)

      // Print summary
      const summaryColor = result.success ? chalk.green : chalk.red
      console.log(
        summaryColor(
          `Summary: ${result.summary.passed} passed, ${result.summary.failed} failed, ${result.summary.warnings} with warnings`
        )
      )
      console.log('')

      if (result.success) {
        console.log(chalk.green('✓ Verification passed!'))
      } else {
        console.log(chalk.red('✗ Verification failed. Please fix the issues above.'))
      }
    }

    return { success: result.success, result }
  } catch (error) {
    spinner.fail('Verification failed')
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`))
    return { success: false }
  }
}
