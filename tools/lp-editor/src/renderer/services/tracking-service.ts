/**
 * Tracking Service
 *
 * Generates tracking code snippets and injects them into HTML.
 * Supports GA4, GTM, Facebook Pixel, and Google Ads.
 */

import type { TrackingConfig } from '../stores/tracking-store'

// Validation patterns
const GA4_PATTERN = /^G-[A-Z0-9]+$/
const GTM_PATTERN = /^GTM-[A-Z0-9]+$/
const FB_PIXEL_PATTERN = /^\d{15,16}$/
const GOOGLE_ADS_PATTERN = /^AW-\d+$/

export interface ValidationResult {
  readonly valid: boolean
  readonly message: string
}

/**
 * Validate a GA4 measurement ID
 */
export function validateGA4Id(id: string): ValidationResult {
  if (!id) return { valid: false, message: '' }
  if (GA4_PATTERN.test(id)) return { valid: true, message: '' }
  return { valid: false, message: 'G-XXXXXXXXXX の形式で入力してください' }
}

/**
 * Validate a GTM container ID
 */
export function validateGTMId(id: string): ValidationResult {
  if (!id) return { valid: false, message: '' }
  if (GTM_PATTERN.test(id)) return { valid: true, message: '' }
  return { valid: false, message: 'GTM-XXXXXXX の形式で入力してください' }
}

/**
 * Validate a Facebook Pixel ID
 */
export function validateFBPixelId(id: string): ValidationResult {
  if (!id) return { valid: false, message: '' }
  if (FB_PIXEL_PATTERN.test(id)) return { valid: true, message: '' }
  return { valid: false, message: '15-16桁の数字で入力してください' }
}

/**
 * Validate a Google Ads conversion ID
 */
export function validateGoogleAdsId(id: string): ValidationResult {
  if (!id) return { valid: false, message: '' }
  if (GOOGLE_ADS_PATTERN.test(id)) return { valid: true, message: '' }
  return { valid: false, message: 'AW-XXXXXXXXXX の形式で入力してください' }
}

/**
 * Generate GA4 tracking snippet
 */
function generateGA4Snippet(measurementId: string): string {
  return `<!-- Google Analytics (GA4) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${measurementId}');
</script>`
}

/**
 * Generate GTM head snippet
 */
function generateGTMHeadSnippet(containerId: string): string {
  return `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${containerId}');</script>
<!-- End Google Tag Manager -->`
}

/**
 * Generate GTM body snippet (noscript fallback)
 */
function generateGTMBodySnippet(containerId: string): string {
  return `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${containerId}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`
}

/**
 * Generate Facebook Pixel snippet
 */
function generateFBPixelSnippet(pixelId: string): string {
  return `<!-- Facebook Pixel -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"
/></noscript>
<!-- End Facebook Pixel -->`
}

/**
 * Generate Google Ads conversion tracking snippet
 */
function generateGoogleAdsSnippet(conversionId: string, conversionLabel: string): string {
  let snippet = `<!-- Google Ads -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${conversionId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${conversionId}');`

  if (conversionLabel) {
    snippet += `
  gtag('event', 'conversion', {'send_to': '${conversionId}/${conversionLabel}'});`
  }

  snippet += `
</script>
<!-- End Google Ads -->`
  return snippet
}

/**
 * Check for potential dual tracking issues
 */
export function checkDualTracking(config: TrackingConfig): string[] {
  const warnings: string[] = []

  if (config.ga4.enabled && config.gtm.enabled) {
    warnings.push(
      'GA4とGTMが両方有効です。GTM内でGA4を設定している場合、二重計測になる可能性があります。'
    )
  }

  if (config.ga4.enabled && config.googleAds.enabled) {
    warnings.push(
      'GA4とGoogle Adsが両方有効です。GA4のgtag.jsが重複して読み込まれます。パフォーマンスに影響する可能性があります。'
    )
  }

  return warnings
}

/**
 * Inject tracking tags into HTML string
 *
 * Inserts head tags before </head> and body tags after <body>
 */
export function injectTrackingTags(html: string, config: TrackingConfig): string {
  const headSnippets: string[] = []
  const bodySnippets: string[] = []

  // GA4
  if (config.ga4.enabled && config.ga4.measurementId) {
    const validation = validateGA4Id(config.ga4.measurementId)
    if (validation.valid) {
      headSnippets.push(generateGA4Snippet(config.ga4.measurementId))
    }
  }

  // GTM
  if (config.gtm.enabled && config.gtm.containerId) {
    const validation = validateGTMId(config.gtm.containerId)
    if (validation.valid) {
      headSnippets.push(generateGTMHeadSnippet(config.gtm.containerId))
      bodySnippets.push(generateGTMBodySnippet(config.gtm.containerId))
    }
  }

  // Facebook Pixel
  if (config.facebookPixel.enabled && config.facebookPixel.pixelId) {
    const validation = validateFBPixelId(config.facebookPixel.pixelId)
    if (validation.valid) {
      headSnippets.push(generateFBPixelSnippet(config.facebookPixel.pixelId))
    }
  }

  // Google Ads
  if (config.googleAds.enabled && config.googleAds.conversionId) {
    const validation = validateGoogleAdsId(config.googleAds.conversionId)
    if (validation.valid) {
      headSnippets.push(
        generateGoogleAdsSnippet(config.googleAds.conversionId, config.googleAds.conversionLabel)
      )
    }
  }

  let result = html

  // Inject head snippets before </head>
  if (headSnippets.length > 0) {
    const headCode = headSnippets.join('\n')
    result = result.replace('</head>', `${headCode}\n</head>`)
  }

  // Inject body snippets after <body> (or <body ...>)
  if (bodySnippets.length > 0) {
    const bodyCode = bodySnippets.join('\n')
    result = result.replace(/(<body[^>]*>)/, `$1\n${bodyCode}`)
  }

  return result
}

/**
 * Generate preview HTML for a tracking config
 */
export function generateTrackingPreview(config: TrackingConfig): string {
  const lines: string[] = []

  if (config.ga4.enabled && config.ga4.measurementId) {
    lines.push(`GA4: ${config.ga4.measurementId}`)
  }
  if (config.gtm.enabled && config.gtm.containerId) {
    lines.push(`GTM: ${config.gtm.containerId}`)
  }
  if (config.facebookPixel.enabled && config.facebookPixel.pixelId) {
    lines.push(`FB Pixel: ${config.facebookPixel.pixelId}`)
  }
  if (config.googleAds.enabled && config.googleAds.conversionId) {
    lines.push(`Google Ads: ${config.googleAds.conversionId}`)
  }

  return lines.length > 0 ? lines.join('\n') : 'No tracking configured'
}
