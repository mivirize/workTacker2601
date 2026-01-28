/**
 * Init Command
 *
 * Initialize a new LP project with template files.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { existsSync } from 'node:fs'
import chalk from 'chalk'
import ora from 'ora'
import type { InitOptions } from '../types'

/**
 * Execute the init command
 */
export async function initCommand(
  projectName: string,
  options: InitOptions = {}
): Promise<void> {
  const spinner = ora(`Creating project: ${projectName}...`).start()

  const projectDir = resolve(process.cwd(), projectName)

  // Check if directory exists
  if (existsSync(projectDir)) {
    spinner.fail(chalk.red(`Directory already exists: ${projectName}`))
    return
  }

  try {
    // Create directory structure
    await mkdir(projectDir, { recursive: true })
    await mkdir(join(projectDir, 'src', 'css'), { recursive: true })
    await mkdir(join(projectDir, 'src', 'js'), { recursive: true })
    await mkdir(join(projectDir, 'src', 'images'), { recursive: true })

    // Create lp-config.json
    const config = generateConfig(projectName)
    await writeFile(
      join(projectDir, 'lp-config.json'),
      JSON.stringify(config, null, 2),
      'utf-8'
    )

    // Create index.html
    const html = generateHtmlTemplate(projectName, options.template === 'full')
    await writeFile(join(projectDir, 'src', 'index.html'), html, 'utf-8')

    // Create styles.css
    const css = generateCssTemplate()
    await writeFile(join(projectDir, 'src', 'css', 'styles.css'), css, 'utf-8')

    // Create main.js
    const js = generateJsTemplate()
    await writeFile(join(projectDir, 'src', 'js', 'main.js'), js, 'utf-8')

    // Create .gitignore
    const gitignore = generateGitignore()
    await writeFile(join(projectDir, '.gitignore'), gitignore, 'utf-8')

    spinner.succeed(chalk.green(`Project created: ${projectName}`))

    // Print next steps
    console.log()
    console.log(chalk.bold('Next steps:'))
    console.log()
    console.log(`  cd ${projectName}`)
    console.log('  # Edit src/index.html with Claude Code')
    console.log('  lp-packager validate src/index.html')
    console.log('  lp-packager build')
    console.log()
  } catch (error) {
    spinner.fail(chalk.red('Failed to create project'))
    console.error(chalk.red((error as Error).message))
  }
}

/**
 * Generate lp-config.json content
 */
function generateConfig(projectName: string): Record<string, unknown> {
  const slugName = projectName.replace(/\s+/g, '-').toLowerCase()

  return {
    name: `${projectName} LP`,
    client: projectName,
    version: '1.0.0',
    entry: 'src/index.html',
    output: {
      appName: 'LP-Editor',
      fileName: `${slugName}-lp-editor`,
    },
    editables: {
      'hero-headline': {
        type: 'text',
        label: 'メインキャッチ',
        group: 'hero',
      },
      'hero-subheadline': {
        type: 'text',
        label: 'サブキャッチ',
        group: 'hero',
      },
      'hero-cta': {
        type: 'link',
        label: 'CTAボタン',
        group: 'hero',
      },
    },
    colors: {
      primary: {
        value: '#3B82F6',
        label: 'メインカラー',
        description: 'ヘッダー、リンク、ボタンの基本色',
      },
      secondary: {
        value: '#1E40AF',
        label: 'サブカラー',
        description: 'ホバー状態、強調表示',
      },
      accent: {
        value: '#F59E0B',
        label: 'アクセントカラー',
        description: 'CTAボタン、重要な要素の強調',
      },
    },
    groups: {
      hero: { label: 'ヒーローセクション', order: 1 },
      features: { label: '特徴セクション', order: 2 },
      contact: { label: 'お問い合わせ', order: 3 },
      footer: { label: 'フッター', order: 4 },
    },
  }
}

/**
 * Generate HTML template
 */
function generateHtmlTemplate(projectName: string, full: boolean): string {
  const basicTemplate = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${projectName}のランディングページ">

  <title data-editable="page-title" data-type="text">${projectName}</title>

  <style>
    :root {
      /* カラーパレット */
      --color-primary: #3B82F6;
      --color-primary-dark: #2563EB;
      --color-secondary: #1E40AF;
      --color-accent: #F59E0B;
      --color-accent-dark: #D97706;

      /* テキストカラー */
      --color-text: #1F2937;
      --color-text-light: #6B7280;
      --color-text-inverse: #FFFFFF;

      /* 背景カラー */
      --color-background: #FFFFFF;
      --color-background-alt: #F3F4F6;

      /* その他 */
      --color-border: #E5E7EB;
    }
  </style>

  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <!-- ヒーローセクション -->
  <section class="hero">
    <div class="container">
      <h1
        data-editable="hero-headline"
        data-type="text"
        data-label="メインキャッチ"
        data-group="hero"
        class="hero__title"
      >
        あなたのビジネスを次のレベルへ
      </h1>

      <p
        data-editable="hero-subheadline"
        data-type="text"
        data-label="サブキャッチ"
        data-group="hero"
        class="hero__subtitle"
      >
        私たちのソリューションで課題を解決します
      </p>

      <a
        data-editable="hero-cta"
        data-type="link"
        data-label="CTAボタン"
        data-group="hero"
        href="#contact"
        class="btn btn--accent"
      >
        今すぐ始める
      </a>
    </div>
  </section>

  <!-- フッター -->
  <footer class="footer">
    <p
      data-editable="copyright"
      data-type="text"
      data-label="コピーライト"
      data-group="footer"
    >
      © 2024 ${projectName} All Rights Reserved.
    </p>
  </footer>

  <script src="js/main.js"></script>
</body>
</html>`

  if (!full) {
    return basicTemplate
  }

  // Full template with more sections
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${projectName}のランディングページ">

  <!-- OGP -->
  <meta property="og:title" content="${projectName}">
  <meta property="og:description" content="${projectName}のランディングページ">
  <meta property="og:type" content="website">

  <title data-editable="page-title" data-type="text">${projectName}</title>

  <style>
    :root {
      /* カラーパレット */
      --color-primary: #3B82F6;
      --color-primary-dark: #2563EB;
      --color-secondary: #1E40AF;
      --color-accent: #F59E0B;
      --color-accent-dark: #D97706;

      /* テキストカラー */
      --color-text: #1F2937;
      --color-text-light: #6B7280;
      --color-text-inverse: #FFFFFF;

      /* 背景カラー */
      --color-background: #FFFFFF;
      --color-background-alt: #F3F4F6;

      /* その他 */
      --color-border: #E5E7EB;
    }
  </style>

  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <!-- ヘッダー -->
  <header class="header">
    <div class="container">
      <img
        data-editable="logo"
        data-type="image"
        data-label="ロゴ"
        data-group="header"
        src="images/logo.png"
        alt="${projectName} ロゴ"
        class="header__logo"
      >
    </div>
  </header>

  <!-- ヒーローセクション -->
  <section class="hero">
    <div class="container">
      <h1
        data-editable="hero-headline"
        data-type="text"
        data-label="メインキャッチ"
        data-group="hero"
        class="hero__title"
      >
        あなたのビジネスを次のレベルへ
      </h1>

      <p
        data-editable="hero-subheadline"
        data-type="text"
        data-label="サブキャッチ"
        data-group="hero"
        class="hero__subtitle"
      >
        私たちのソリューションで課題を解決します
      </p>

      <a
        data-editable="hero-cta"
        data-type="link"
        data-label="CTAボタン"
        data-group="hero"
        href="#contact"
        class="btn btn--accent"
      >
        今すぐ始める
      </a>
    </div>
  </section>

  <!-- 特徴セクション -->
  <section class="features">
    <div class="container">
      <h2
        data-editable="features-title"
        data-type="text"
        data-label="セクションタイトル"
        data-group="features"
        class="section-title"
      >
        選ばれる3つの理由
      </h2>

      <div
        class="features__grid"
        data-repeat="features"
        data-min="1"
        data-max="6"
      >
        <div class="feature-card" data-repeat-item>
          <div class="feature-card__icon">
            <img
              data-editable="features.icon"
              data-type="image"
              src="images/icon-feature.svg"
              alt=""
            >
          </div>
          <h3
            data-editable="features.title"
            data-type="text"
            class="feature-card__title"
          >
            特徴タイトル
          </h3>
          <p
            data-editable="features.description"
            data-type="text"
            class="feature-card__text"
          >
            特徴の説明文がここに入ります。
          </p>
        </div>

        <div class="feature-card" data-repeat-item>
          <div class="feature-card__icon">
            <img
              data-editable="features.icon"
              data-type="image"
              src="images/icon-feature.svg"
              alt=""
            >
          </div>
          <h3
            data-editable="features.title"
            data-type="text"
            class="feature-card__title"
          >
            特徴タイトル
          </h3>
          <p
            data-editable="features.description"
            data-type="text"
            class="feature-card__text"
          >
            特徴の説明文がここに入ります。
          </p>
        </div>

        <div class="feature-card" data-repeat-item>
          <div class="feature-card__icon">
            <img
              data-editable="features.icon"
              data-type="image"
              src="images/icon-feature.svg"
              alt=""
            >
          </div>
          <h3
            data-editable="features.title"
            data-type="text"
            class="feature-card__title"
          >
            特徴タイトル
          </h3>
          <p
            data-editable="features.description"
            data-type="text"
            class="feature-card__text"
          >
            特徴の説明文がここに入ります。
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTAセクション -->
  <section id="contact" class="cta">
    <div class="container">
      <h2
        data-editable="cta-headline"
        data-type="text"
        data-label="見出し"
        data-group="cta"
        class="cta__title"
      >
        今すぐ始めましょう
      </h2>

      <p
        data-editable="cta-description"
        data-type="text"
        data-label="説明文"
        data-group="cta"
        class="cta__text"
      >
        まずは無料でお試しください。
      </p>

      <a
        data-editable="cta-button"
        data-type="link"
        data-label="ボタン"
        data-group="cta"
        href="#"
        class="btn btn--accent btn--large"
      >
        無料で試す
      </a>
    </div>
  </section>

  <!-- フッター -->
  <footer class="footer">
    <div class="container">
      <p
        data-editable="copyright"
        data-type="text"
        data-label="コピーライト"
        data-group="footer"
      >
        © 2024 ${projectName} All Rights Reserved.
      </p>
    </div>
  </footer>

  <script src="js/main.js"></script>
</body>
</html>`
}

/**
 * Generate CSS template
 */
function generateCssTemplate(): string {
  return `/* Reset */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Base */
html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  line-height: 1.6;
  color: var(--color-text);
  background-color: var(--color-background);
}

/* Container */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
  font-weight: 700;
  line-height: 1.3;
}

/* Buttons */
.btn {
  display: inline-block;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.btn--primary {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.btn--primary:hover {
  background-color: var(--color-primary-dark);
}

.btn--accent {
  background-color: var(--color-accent);
  color: var(--color-text-inverse);
}

.btn--accent:hover {
  background-color: var(--color-accent-dark);
}

.btn--large {
  padding: 1rem 3rem;
  font-size: 1.125rem;
}

/* Section Title */
.section-title {
  font-size: 2rem;
  text-align: center;
  margin-bottom: 3rem;
}

/* Hero */
.hero {
  padding: 6rem 0;
  text-align: center;
  background-color: var(--color-background-alt);
}

.hero__title {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.hero__subtitle {
  font-size: 1.25rem;
  color: var(--color-text-light);
  margin-bottom: 2rem;
}

/* Features */
.features {
  padding: 5rem 0;
}

.features__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  text-align: center;
  padding: 2rem;
  border-radius: 8px;
  background-color: var(--color-background);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.feature-card__icon {
  margin-bottom: 1rem;
}

.feature-card__icon img {
  width: 64px;
  height: 64px;
}

.feature-card__title {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.feature-card__text {
  color: var(--color-text-light);
}

/* CTA */
.cta {
  padding: 5rem 0;
  text-align: center;
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.cta__title {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.cta__text {
  margin-bottom: 2rem;
  opacity: 0.9;
}

/* Footer */
.footer {
  padding: 2rem 0;
  text-align: center;
  background-color: var(--color-background-alt);
  color: var(--color-text-light);
}

/* Responsive */
@media (max-width: 768px) {
  .hero__title {
    font-size: 1.75rem;
  }

  .section-title {
    font-size: 1.5rem;
  }
}
`
}

/**
 * Generate JS template
 */
function generateJsTemplate(): string {
  return `// Main JavaScript
document.addEventListener('DOMContentLoaded', () => {
  console.log('LP loaded successfully')

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault()
      const target = document.querySelector(anchor.getAttribute('href'))
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' })
      }
    })
  })
})
`
}

/**
 * Generate .gitignore content
 */
function generateGitignore(): string {
  return `# Dependencies
node_modules/

# Build output
dist/
output/

# OS files
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/

# Logs
*.log
`
}
