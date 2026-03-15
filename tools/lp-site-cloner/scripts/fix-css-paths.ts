import * as fs from 'fs/promises'
import * as path from 'path'

const CSS_DIR = 'c:/Users/owner/Dev/tools/lp-projects/cho-kaguyahime/src/css'

async function fixCssPaths() {
  console.log('Fixing CSS image paths...')

  const cssFiles = await fs.readdir(CSS_DIR)

  for (const file of cssFiles) {
    if (!file.endsWith('.css')) continue

    const cssPath = path.join(CSS_DIR, file)
    let css = await fs.readFile(cssPath, 'utf-8')

    // Fix all ../img/xxx/ patterns to ../images/
    css = css.replace(/url\(['"]?\.\.\/img\/[^/]+\/([^'")\s]+)['"]?\)/g, "url('../images/$1')")

    // Fix /wp-content patterns
    css = css.replace(/url\(['"]?\/wp-content\/[^'")\s]+\/([^'")\s/]+)['"]?\)/g, "url('../images/$1')")

    await fs.writeFile(cssPath, css, 'utf-8')
    console.log(`Fixed: ${file}`)
  }

  console.log('Done!')
}

fixCssPaths().catch(console.error)
