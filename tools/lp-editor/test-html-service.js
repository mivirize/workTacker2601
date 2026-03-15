/**
 * Test script to verify html-service auto-detection
 */
const fs = require('fs')
const path = require('path')

// Load cheerio
const cheerio = require('cheerio')

// Read the demo-saas HTML
const htmlPath = path.join(__dirname, '..', 'lp-projects', 'demo-saas', 'src', 'index.html')
const html = fs.readFileSync(htmlPath, 'utf-8')

const $ = cheerio.load(html)

console.log('=== Testing Auto-Detection ===\n')

// Test 1: Find data-target elements (counters)
console.log('--- Counters (data-target) ---')
$('[data-target]').each((idx, el) => {
  const $el = $(el)
  const inRepeat = $el.closest('[data-repeat-item]').length > 0
  const hasEditable = $el.attr('data-editable')
  const target = $el.attr('data-target')
  const classes = $el.attr('class')
  console.log(`[${idx}] target=${target}, inRepeat=${inRepeat}, hasEditable=${hasEditable}, class="${classes}"`)
})

console.log('\n--- Icons (.icon, .feature-card__icon, [class*="icon"]) ---')
$('.icon, .feature-card__icon, [class*="icon"]').each((idx, el) => {
  const $el = $(el)
  const $svg = $el.find('svg')
  const hasSvg = $svg.length > 0
  const inRepeat = $el.closest('[data-repeat-item]').length > 0
  const hasEditable = $el.attr('data-editable')
  const classes = $el.attr('class')
  console.log(`[${idx}] hasSvg=${hasSvg}, inRepeat=${inRepeat}, hasEditable=${hasEditable}, class="${classes}"`)
})

console.log('\n=== Summary ===')
const countersTotal = $('[data-target]').length
const countersOutsideRepeat = $('[data-target]').filter((_, el) => $(el).closest('[data-repeat-item]').length === 0).length
console.log(`Counters: ${countersTotal} total, ${countersOutsideRepeat} outside repeat blocks`)

const iconsSelector = '.icon, .feature-card__icon, [class*="icon"]'
const iconsTotal = $(iconsSelector).filter((_, el) => $(el).find('svg').length > 0).length
const iconsOutsideRepeat = $(iconsSelector).filter((_, el) => {
  const $el = $(el)
  return $el.find('svg').length > 0 && $el.closest('[data-repeat-item]').length === 0
}).length
console.log(`Icons with SVG: ${iconsTotal} total, ${iconsOutsideRepeat} outside repeat blocks`)
