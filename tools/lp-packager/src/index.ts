#!/usr/bin/env node

/**
 * LP-CMS Packager CLI
 *
 * A CLI tool for packaging LP projects into editable packages.
 */

import { Command } from 'commander'
import chalk from 'chalk'
import { validateCommand, listMarkersCommand, listColorsCommand } from './commands/validate'
import { buildCommand } from './commands/build'
import { initCommand } from './commands/init'

const program = new Command()

program
  .name('lp-packager')
  .description('LP-CMS packaging CLI tool')
  .version('0.1.0')

// Init command
program
  .command('init <project-name>')
  .description('Initialize a new LP project')
  .option('-t, --template <type>', 'Template type (basic or full)', 'basic')
  .action(async (projectName: string, options: { template: 'basic' | 'full' }) => {
    await initCommand(projectName, { template: options.template })
  })

// Validate command
program
  .command('validate <file>')
  .description('Validate HTML file for proper marker usage')
  .option('-v, --verbose', 'Show all validation messages including info')
  .option('-f, --format <format>', 'Output format (text or json)', 'text')
  .action(async (file: string, options: { verbose?: boolean; format?: 'text' | 'json' }) => {
    const result = await validateCommand(file, options)
    process.exit(result.success ? 0 : 1)
  })

// List markers command
program
  .command('list-markers <file>')
  .description('List all editable markers in an HTML file')
  .action(async (file: string) => {
    await listMarkersCommand(file)
  })

// List colors command
program
  .command('list-colors <file>')
  .description('List all CSS color variables in an HTML file')
  .action(async (file: string) => {
    await listColorsCommand(file)
  })

// Build command
program
  .command('build [project-path]')
  .description('Build LP package for distribution')
  .option('-c, --client <name>', 'Client name')
  .option('-o, --output <path>', 'Output directory')
  .option('-e, --editor-path <path>', 'Path to LP-Editor release folder')
  .option('--include-source', 'Include source files in package')
  .action(async (projectPath: string = '.', options: { client?: string; output?: string; editorPath?: string; includeSource?: boolean }) => {
    const result = await buildCommand(projectPath, options)
    process.exit(result.success ? 0 : 1)
  })

// Error handling
program.configureOutput({
  writeErr: (str) => process.stderr.write(chalk.red(str)),
})

// Parse arguments
program.parse()
