import * as fs from 'fs/promises'
import * as path from 'path'

const PROJECT_DIR = 'c:/Users/owner/Dev/tools/lp-site-cloner/output/cho-kaguyahime'
const SRC_DIR = path.join(PROJECT_DIR, 'src')

async function fixPaths() {
  console.log('Fixing paths in HTML...')

  const htmlPath = path.join(SRC_DIR, 'index.html')
  let html = await fs.readFile(htmlPath, 'utf-8')

  // Fix image paths - convert absolute URLs to relative paths
  html = html.replace(
    /https?:\/\/www\.cho-kaguyahime\.com\/wp-content\/themes\/cho-kaguyahime\/assets\/images\//g,
    'images/'
  )

  // Fix CSS paths
  html = html.replace(
    /https?:\/\/www\.cho-kaguyahime\.com\/wp-content\/themes\/cho-kaguyahime\/assets\/css\//g,
    'css/'
  )

  // Fix JS paths
  html = html.replace(
    /https?:\/\/www\.cho-kaguyahime\.com\/wp-content\/themes\/cho-kaguyahime\/assets\/js\//g,
    'js/'
  )

  // Remove external tracking scripts and problematic elements
  html = html.replace(/<script[^>]*gtag[^>]*>[\s\S]*?<\/script>/gi, '')
  html = html.replace(/<script[^>]*gtm[^>]*>[\s\S]*?<\/script>/gi, '')
  html = html.replace(/<script[^>]*analytics[^>]*>[\s\S]*?<\/script>/gi, '')
  html = html.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
  html = html.replace(/<link[^>]*preconnect[^>]*>/gi, '')
  html = html.replace(/<link[^>]*dns-prefetch[^>]*>/gi, '')
  html = html.replace(/<meta[^>]*Content-Security-Policy[^>]*>/gi, '')

  // Fix href="#" links to prevent navigation issues
  html = html.replace(/href="#"/g, 'href="javascript:void(0)"')
  html = html.replace(/href="javascript:;"/g, 'href="javascript:void(0)"')

  // Update CSS link tags to use local files
  html = html.replace(
    /<link[^>]*href="[^"]*common\.css[^"]*"[^>]*>/gi,
    '<link rel="stylesheet" href="css/common.css">'
  )
  html = html.replace(
    /<link[^>]*href="[^"]*top\.css[^"]*"[^>]*>/gi,
    '<link rel="stylesheet" href="css/top.css">'
  )

  // Update script tags to use local files
  html = html.replace(
    /<script[^>]*src="[^"]*incparts\.js[^"]*"[^>]*><\/script>/gi,
    '<script src="js/incparts.js"></script>'
  )
  html = html.replace(
    /<script[^>]*src="[^"]*jquery\.common\.js[^"]*"[^>]*><\/script>/gi,
    '<script src="js/jquery.common.js"></script>'
  )
  html = html.replace(
    /<script[^>]*src="[^"]*jquery\.top\.js[^"]*"[^>]*><\/script>/gi,
    '<script src="js/jquery.top.js"></script>'
  )

  await fs.writeFile(htmlPath, html, 'utf-8')

  console.log('HTML paths fixed!')

  // Fix CSS file paths
  const cssDir = path.join(SRC_DIR, 'css')
  const cssFiles = await fs.readdir(cssDir).catch(() => [])

  for (const file of cssFiles) {
    if (!file.endsWith('.css')) continue

    const cssPath = path.join(cssDir, file)
    let css = await fs.readFile(cssPath, 'utf-8')

    // Fix image URLs in CSS
    css = css.replace(
      /url\(['"]?\/wp-content\/themes\/cho-kaguyahime\/assets\/images\/([^'")\s]+)['"]?\)/g,
      "url('../images/$1')"
    )
    css = css.replace(
      /url\(['"]?\.\.\/images\/([^'")\s]+)['"]?\)/g,
      "url('../images/$1')"
    )

    await fs.writeFile(cssPath, css, 'utf-8')
    console.log(`Fixed CSS: ${file}`)
  }

  console.log('All paths fixed!')
}

fixPaths().catch(console.error)
