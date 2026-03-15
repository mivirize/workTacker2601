#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import * as path from 'path'
import { PageCapture } from '../services/capture/index.js'
import { LpProjectGenerator } from '../services/generator/index.js'
import { SiteComparer } from '../services/comparison/index.js'

const program = new Command()

program
  .name('lp-clone')
  .description('Clone websites and convert to LP-Editor projects')
  .version('1.0.0')

program
  .command('clone')
  .description('Clone a website and generate LP-Editor project')
  .argument('<url>', 'URL of the website to clone')
  .option('-o, --output <path>', 'Output directory', './output')
  .option('-n, --name <name>', 'Project name')
  .option('-c, --client <name>', 'Client name')
  .option('--scroll', 'Capture scroll animation states', false)
  .option('--no-fullpage', 'Disable full page screenshots')
  .option('--wait <ms>', 'Wait time after page load (ms)', '2000')
  .action(async (url: string, options) => {
    const spinner = ora('Initializing...').start()

    try {
      const projectName = options.name || extractProjectName(url)
      const outputPath = path.resolve(options.output, projectName)

      spinner.text = 'Capturing website...'
      const capture = new PageCapture()
      const captureResult = await capture.capture({
        url,
        fullPage: options.fullpage !== false,
        scrollCapture: options.scroll,
        waitForTimeout: parseInt(options.wait, 10),
        outputDir: outputPath,
      })

      spinner.text = 'Analyzing page structure...'

      spinner.text = 'Generating LP-Editor project...'
      const generator = new LpProjectGenerator({
        outputPath,
        projectName,
        clientName: options.client,
      })

      const result = await generator.generate(captureResult)

      spinner.succeed(chalk.green('Project generated successfully!'))

      console.log('')
      console.log(chalk.bold('Project Details:'))
      console.log(chalk.gray('  Path:'), result.projectPath)
      console.log(chalk.gray('  Name:'), result.config.name)
      console.log(chalk.gray('  Groups:'), Object.keys(result.config.groups).length)
      console.log(chalk.gray('  Files:'), result.files.length)

      if (result.config.repeatBlocks) {
        console.log(chalk.gray('  Repeat Blocks:'), Object.keys(result.config.repeatBlocks).length)
      }

      console.log('')
      console.log(chalk.cyan('Next steps:'))
      console.log(chalk.gray('  1. Open the project in LP-Editor'))
      console.log(chalk.gray('  2. Review and adjust data-editable markers'))
      console.log(chalk.gray('  3. Download images manually if needed'))
      console.log(chalk.gray('  4. Run comparison to verify reproduction'))
      console.log('')
      console.log(chalk.gray(`  cd ${outputPath}`))
      console.log(chalk.gray('  lp-clone compare', url, '.'))
    } catch (error) {
      spinner.fail(chalk.red('Failed to clone website'))
      console.error(chalk.red(error instanceof Error ? error.message : String(error)))
      process.exit(1)
    }
  })

program
  .command('compare')
  .description('Compare original website with generated project')
  .argument('<url>', 'URL of the original website')
  .argument('<project>', 'Path to generated project')
  .option('-o, --output <path>', 'Output directory for comparison results')
  .option('-t, --threshold <value>', 'Pixel comparison threshold (0-1)', '0.1')
  .action(async (url: string, projectPath: string, options) => {
    const spinner = ora('Starting comparison...').start()

    try {
      const resolvedProjectPath = path.resolve(projectPath)
      const outputPath = options.output
        ? path.resolve(options.output)
        : path.join(resolvedProjectPath, '.lp-editor', 'comparison')

      const comparer = new SiteComparer({
        threshold: parseFloat(options.threshold),
      })

      spinner.text = 'Capturing and comparing screenshots...'

      const result = await comparer.compare({
        originalUrl: url,
        generatedPath: resolvedProjectPath,
        outputPath,
        threshold: parseFloat(options.threshold),
      })

      spinner.succeed(chalk.green('Comparison completed!'))

      console.log('')
      console.log(chalk.bold('Comparison Results:'))
      console.log('')

      const scoreColor = (score: number) => {
        if (score >= 90) return chalk.green
        if (score >= 70) return chalk.yellow
        if (score >= 50) return chalk.hex('#FFA500')
        return chalk.red
      }

      console.log(
        chalk.gray('  Overall Score:'),
        scoreColor(result.overallScore)(`${result.overallScore.toFixed(1)}%`)
      )
      console.log(
        chalk.gray('  Pixel Match:'),
        scoreColor(result.pixelMatchScore)(`${result.pixelMatchScore.toFixed(1)}%`)
      )
      console.log(
        chalk.gray('  Structure Match:'),
        scoreColor(result.structureScore)(`${result.structureScore.toFixed(1)}%`)
      )
      console.log(
        chalk.gray('  Animation Match:'),
        scoreColor(result.animationScore)(`${result.animationScore.toFixed(1)}%`)
      )

      console.log('')
      console.log(chalk.gray('  Report:'), result.report)

      if (result.diffImages.length > 0) {
        console.log('')
        console.log(chalk.bold('Diff Images:'))
        for (const diff of result.diffImages) {
          console.log(chalk.gray(`  ${diff.viewport}:`), diff.diffPath)
        }
      }

      console.log('')

      if (result.overallScore >= 90) {
        console.log(chalk.green('✓ Excellent reproduction!'))
      } else if (result.overallScore >= 70) {
        console.log(chalk.yellow('⚠ Good reproduction with minor differences'))
      } else if (result.overallScore >= 50) {
        console.log(chalk.hex('#FFA500')('⚠ Significant differences detected'))
      } else {
        console.log(chalk.red('✗ Major differences - review required'))
      }
    } catch (error) {
      spinner.fail(chalk.red('Comparison failed'))
      console.error(chalk.red(error instanceof Error ? error.message : String(error)))
      process.exit(1)
    }
  })

program
  .command('analyze')
  .description('Analyze a website without generating project')
  .argument('<url>', 'URL of the website to analyze')
  .option('--json', 'Output as JSON', false)
  .action(async (url: string, options) => {
    const spinner = ora('Analyzing website...').start()

    try {
      const capture = new PageCapture()
      const captureResult = await capture.capture({
        url,
        fullPage: true,
        scrollCapture: false,
        waitForTimeout: 2000,
      })

      const { SiteAnalyzer } = await import('../services/analyzer/index.js')
      const analyzer = new SiteAnalyzer(captureResult.html, captureResult.css)
      const analysis = analyzer.analyze()

      spinner.succeed(chalk.green('Analysis completed!'))

      if (options.json) {
        console.log(JSON.stringify(analysis, null, 2))
      } else {
        console.log('')
        console.log(chalk.bold('Analysis Results:'))
        console.log('')
        console.log(chalk.gray('  Sections:'), analysis.sections.length)
        console.log(chalk.gray('  Editable Elements:'), analysis.editableElements.length)
        console.log(chalk.gray('  Repeat Patterns:'), analysis.repeatPatterns.length)
        console.log(chalk.gray('  Colors:'), analysis.colorPalette.length)

        if (analysis.sections.length > 0) {
          console.log('')
          console.log(chalk.bold('Sections:'))
          for (const section of analysis.sections.slice(0, 10)) {
            console.log(chalk.gray(`  - ${section.suggestedLabel} (${section.selector})`))
          }
          if (analysis.sections.length > 10) {
            console.log(chalk.gray(`  ... and ${analysis.sections.length - 10} more`))
          }
        }

        if (analysis.repeatPatterns.length > 0) {
          console.log('')
          console.log(chalk.bold('Repeat Patterns:'))
          for (const pattern of analysis.repeatPatterns) {
            console.log(
              chalk.gray(`  - ${pattern.id}: ${pattern.itemCount} items, ${pattern.fields.length} fields`)
            )
          }
        }

        if (analysis.colorPalette.length > 0) {
          console.log('')
          console.log(chalk.bold('Color Palette:'))
          for (const color of analysis.colorPalette.slice(0, 5)) {
            console.log(chalk.gray(`  - ${color.label}: ${color.value}`))
          }
        }
      }
    } catch (error) {
      spinner.fail(chalk.red('Analysis failed'))
      console.error(chalk.red(error instanceof Error ? error.message : String(error)))
      process.exit(1)
    }
  })

function extractProjectName(url: string): string {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname
      .replace(/^www\./, '')
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')

    return hostname || 'cloned-site'
  } catch {
    return 'cloned-site'
  }
}

program.parse()
