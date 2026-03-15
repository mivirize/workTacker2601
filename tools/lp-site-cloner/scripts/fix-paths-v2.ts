import * as fs from 'fs/promises'
import * as path from 'path'

const PROJECT_DIR = 'c:/Users/owner/Dev/tools/lp-projects/cho-kaguyahime'
const SRC_DIR = path.join(PROJECT_DIR, 'src')

async function fixPaths() {
  console.log('Fixing all paths in HTML...')

  const htmlPath = path.join(SRC_DIR, 'index.html')
  let html = await fs.readFile(htmlPath, 'utf-8')

  // Fix image paths - multiple patterns
  // ./assets/img/character/character_0thumb.png -> images/character_0thumb.png
  html = html.replace(/\.\/assets\/img\/[^/]+\/([^"']+)/g, 'images/$1')

  // https://www.cho-kaguyahime.com/assets/img/... -> images/...
  html = html.replace(/https?:\/\/www\.cho-kaguyahime\.com\/assets\/img\/[^/]+\/([^"']+)/g, 'images/$1')

  // wp-content/themes paths
  html = html.replace(/https?:\/\/www\.cho-kaguyahime\.com\/wp-content\/themes\/cho-kaguyahime\/assets\/images\/([^"']+)/g, 'images/$1')

  // News images from subdomain
  html = html.replace(/https?:\/\/www\.news\.cho-kaguyahime\.com\/wp-content\/uploads\/[^/]+\/[^/]+\/([^"']+)/g, 'images/$1')

  // Fix JS paths - make external libs work via CDN but local scripts relative
  // Remove local fallback scripts that don't exist
  html = html.replace(/<script>window\.jQuery \|\| document\.write\([^)]+\)<\/script>/g, '')
  html = html.replace(/<script>window\.jQuery\.easing\.def \|\| document\.write\([^)]+\)<\/script>/g, '')

  // Fix local JS references
  html = html.replace(/\.\/assets\/js\/([^"']+)/g, 'js/$1')
  html = html.replace(/https?:\/\/www\.cho-kaguyahime\.com\/wp-content\/themes\/cho-kaguyahime\/assets\/js\/([^"']+)/g, 'js/$1')

  // Fix href="#" links
  html = html.replace(/href="#(?=[^a-zA-Z])/g, 'href="javascript:void(0)"')
  html = html.replace(/href="javascript:;"/g, 'href="javascript:void(0)"')

  // Remove tracking scripts
  html = html.replace(/<script[^>]*gtag[^>]*>[\s\S]*?<\/script>/gi, '')
  html = html.replace(/<script[^>]*gtm[^>]*>[\s\S]*?<\/script>/gi, '')

  // Fix favicon
  html = html.replace(/href="\.\/favicon\.ico"/g, 'href="images/favicon.ico"')

  await fs.writeFile(htmlPath, html, 'utf-8')
  console.log('HTML paths fixed!')

  // Also check what images we have vs what's referenced
  const imagesDir = path.join(SRC_DIR, 'images')
  const imageFiles = new Set(await fs.readdir(imagesDir).catch(() => []))

  // Extract referenced images
  const imgMatches = html.match(/src="images\/([^"]+)"/g) || []
  const referencedImages = imgMatches.map(m => m.replace(/src="images\/|"/g, ''))

  const missing: string[] = []
  for (const img of referencedImages) {
    if (!imageFiles.has(img) && !imageFiles.has(decodeURIComponent(img))) {
      missing.push(img)
    }
  }

  if (missing.length > 0) {
    console.log(`\nMissing images (${missing.length}):`)
    missing.slice(0, 10).forEach(m => console.log(`  - ${m}`))
    if (missing.length > 10) {
      console.log(`  ... and ${missing.length - 10} more`)
    }
  }

  console.log('\nDone!')
}

fixPaths().catch(console.error)
