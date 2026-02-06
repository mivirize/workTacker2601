/**
 * Design Analysis Service
 *
 * Analyzes HTML/CSS for design quality and provides suggestions.
 */

// Design analysis result
export interface DesignAnalysis {
  score: number  // 0-100
  categories: {
    animation: CategoryResult
    layout: CategoryResult
    typography: CategoryResult
    colorContrast: CategoryResult
    performance: CategoryResult
    accessibility: CategoryResult
  }
}

export interface CategoryResult {
  score: number  // 0-100
  status: 'good' | 'warning' | 'error'
  issues: DesignIssue[]
  suggestions: string[]
}

export interface DesignIssue {
  type: 'error' | 'warning' | 'info'
  message: string
  element?: string
  line?: number
}

// Animation preset
export interface AnimationPreset {
  id: string
  name: string
  description: string
  css: string
  className: string
  jsRequired?: boolean
  js?: string
}

// Animation presets from lp-design-reference.md
export const ANIMATION_PRESETS: AnimationPreset[] = [
  {
    id: 'fade-in',
    name: 'Fade In',
    description: 'シンプルなフェードイン',
    className: 'animate-fade-in',
    css: `
.animate-fade-in {
  opacity: 0;
  transition: opacity 0.6s ease-out;
}
.animate-fade-in.is-visible {
  opacity: 1;
}`,
  },
  {
    id: 'fade-up',
    name: 'Fade Up',
    description: '下からフェードインしながら上に移動',
    className: 'animate-fade-up',
    css: `
.animate-fade-up {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;
}
.animate-fade-up.is-visible {
  opacity: 1;
  transform: translateY(0);
}`,
  },
  {
    id: 'slide-left',
    name: 'Slide Left',
    description: '右から左にスライドイン',
    className: 'animate-slide-left',
    css: `
.animate-slide-left {
  opacity: 0;
  transform: translateX(60px);
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;
}
.animate-slide-left.is-visible {
  opacity: 1;
  transform: translateX(0);
}`,
  },
  {
    id: 'slide-right',
    name: 'Slide Right',
    description: '左から右にスライドイン',
    className: 'animate-slide-right',
    css: `
.animate-slide-right {
  opacity: 0;
  transform: translateX(-60px);
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;
}
.animate-slide-right.is-visible {
  opacity: 1;
  transform: translateX(0);
}`,
  },
  {
    id: 'scale-in',
    name: 'Scale In',
    description: 'スケールしながらフェードイン',
    className: 'animate-scale-in',
    css: `
.animate-scale-in {
  opacity: 0;
  transform: scale(0.9);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}
.animate-scale-in.is-visible {
  opacity: 1;
  transform: scale(1);
}`,
  },
  {
    id: 'reveal-image',
    name: 'Reveal Image',
    description: 'カーテンが開くように画像を表示',
    className: 'reveal-image',
    css: `
.reveal-image {
  position: relative;
  overflow: hidden;
}
.reveal-image::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--color-bg, #0a0a0a);
  transform: scaleX(1);
  transform-origin: right;
  transition: transform 1s cubic-bezier(0.77, 0, 0.175, 1);
  z-index: 1;
}
.reveal-image.is-visible::before {
  transform: scaleX(0);
}`,
  },
  {
    id: 'parallax',
    name: 'Parallax',
    description: 'スクロールに連動した視差効果',
    className: 'parallax',
    jsRequired: true,
    css: `
.parallax {
  will-change: transform;
}`,
    js: `
// Parallax effect
const parallaxElements = document.querySelectorAll('.parallax');
window.addEventListener('scroll', () => {
  parallaxElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    const speed = parseFloat(el.dataset.parallaxSpeed) || 0.3;
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const yPos = (rect.top - window.innerHeight / 2) * speed;
      el.style.transform = \`translateY(\${yPos}px)\`;
    }
  });
}, { passive: true });`,
  },
  {
    id: 'stagger',
    name: 'Stagger Animation',
    description: '複数要素を順番にアニメーション',
    className: 'stagger-1',
    css: `
.stagger-1 { transition-delay: 0.1s; }
.stagger-2 { transition-delay: 0.2s; }
.stagger-3 { transition-delay: 0.3s; }
.stagger-4 { transition-delay: 0.4s; }
.stagger-5 { transition-delay: 0.5s; }`,
  },
  {
    id: 'glow-hover',
    name: 'Glow Hover',
    description: 'ホバー時に光るエフェクト',
    className: 'glow-hover',
    css: `
.glow-hover {
  position: relative;
  overflow: hidden;
}
.glow-hover::after {
  content: '';
  position: absolute;
  inset: -50%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}
.glow-hover:hover::after {
  opacity: 1;
}`,
  },
]

// Intersection Observer script for scroll animations
export const SCROLL_ANIMATION_JS = `
// Scroll Animation Observer
const animatedElements = document.querySelectorAll(
  '.animate-fade-up, .animate-fade-in, .animate-slide-left, .animate-slide-right, .animate-scale-in, .reveal-image'
);

const observerOptions = {
  root: null,
  rootMargin: '0px 0px -100px 0px',
  threshold: 0.1
};

const animationObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
    }
  });
}, observerOptions);

animatedElements.forEach(el => {
  if (!el.closest('.hero')) {
    animationObserver.observe(el);
  } else {
    el.classList.add('is-visible');
  }
});
`

/**
 * Analyze design quality of HTML/CSS
 */
export function analyzeDesign(html: string, css?: string): DesignAnalysis {
  const categories = {
    animation: analyzeAnimation(html, css),
    layout: analyzeLayout(html, css),
    typography: analyzeTypography(html, css),
    colorContrast: analyzeColorContrast(html, css),
    performance: analyzePerformance(html, css),
    accessibility: analyzeAccessibility(html),
  }

  // Calculate overall score (weighted average)
  const weights = {
    animation: 0.15,
    layout: 0.2,
    typography: 0.15,
    colorContrast: 0.15,
    performance: 0.2,
    accessibility: 0.15,
  }

  const score = Object.entries(categories).reduce((total, [key, result]) => {
    return total + result.score * weights[key as keyof typeof weights]
  }, 0)

  return {
    score: Math.round(score),
    categories,
  }
}

/**
 * Analyze animation implementation
 */
function analyzeAnimation(html: string, css?: string): CategoryResult {
  const issues: DesignIssue[] = []
  const suggestions: string[] = []
  let score = 100

  // Check for scroll animations
  const hasScrollAnimations =
    html.includes('animate-fade') ||
    html.includes('animate-slide') ||
    html.includes('animate-scale') ||
    html.includes('reveal-image')

  if (!hasScrollAnimations) {
    issues.push({
      type: 'warning',
      message: 'スクロールアニメーションが検出されませんでした',
    })
    suggestions.push('セクション要素にanimate-fade-upクラスを追加してスクロールアニメーションを実装しましょう')
    score -= 20
  }

  // Check for Intersection Observer in JS
  const hasIntersectionObserver =
    html.includes('IntersectionObserver') ||
    (css && css.includes('.is-visible'))

  if (hasScrollAnimations && !hasIntersectionObserver) {
    issues.push({
      type: 'info',
      message: 'Intersection Observerによるアニメーショントリガーを推奨',
    })
    suggestions.push('JavaScriptでIntersection Observerを使用してアニメーションをトリガーしましょう')
    score -= 10
  }

  // Check for stagger animations
  const hasStagger =
    html.includes('stagger-1') ||
    html.includes('stagger-2') ||
    html.includes('transition-delay')

  if (!hasStagger && hasScrollAnimations) {
    suggestions.push('複数要素にstagger-1, stagger-2クラスを追加して順番にアニメーションさせましょう')
    score -= 5
  }

  // Check for hover effects
  const hasHoverEffects =
    html.includes('glow-hover') ||
    (css && css.includes(':hover'))

  if (!hasHoverEffects) {
    suggestions.push('インタラクティブ要素にホバーエフェクトを追加しましょう')
    score -= 5
  }

  return {
    score: Math.max(0, score),
    status: score >= 80 ? 'good' : score >= 50 ? 'warning' : 'error',
    issues,
    suggestions,
  }
}

/**
 * Analyze layout quality
 */
function analyzeLayout(html: string, css?: string): CategoryResult {
  const issues: DesignIssue[] = []
  const suggestions: string[] = []
  let score = 100

  // Check for responsive viewport
  if (!html.includes('viewport')) {
    issues.push({
      type: 'error',
      message: 'viewportメタタグが見つかりません',
    })
    score -= 30
  }

  // Check for container class
  if (!html.includes('container')) {
    issues.push({
      type: 'warning',
      message: 'コンテナクラスが見つかりません',
    })
    suggestions.push('max-widthとmargin: autoを持つcontainerクラスを使用しましょう')
    score -= 10
  }

  // Check for grid/flexbox usage
  const hasModernLayout =
    (css && (css.includes('display: grid') || css.includes('display: flex'))) ||
    html.includes('grid') ||
    html.includes('flex')

  if (!hasModernLayout) {
    suggestions.push('CSSグリッドまたはFlexboxを使用したモダンなレイアウトを検討しましょう')
    score -= 10
  }

  // Check for section structure
  const sectionCount = (html.match(/<section/g) || []).length
  if (sectionCount < 3) {
    suggestions.push('コンテンツをセクションで分割して構造化しましょう')
    score -= 5
  }

  return {
    score: Math.max(0, score),
    status: score >= 80 ? 'good' : score >= 50 ? 'warning' : 'error',
    issues,
    suggestions,
  }
}

/**
 * Analyze typography
 */
function analyzeTypography(html: string, css?: string): CategoryResult {
  const issues: DesignIssue[] = []
  const suggestions: string[] = []
  let score = 100

  // Check for font loading
  const hasGoogleFonts = html.includes('fonts.googleapis.com')
  const hasLocalFonts = css && css.includes('@font-face')

  if (!hasGoogleFonts && !hasLocalFonts) {
    suggestions.push('カスタムフォントの使用を検討しましょう（Googleフォントまたはローカルフォント）')
    score -= 10
  }

  // Check for responsive font sizes
  const hasClamp = css && css.includes('clamp(')
  const hasVw = css && css.includes('vw')

  if (!hasClamp && !hasVw) {
    suggestions.push('clamp()またはvw単位を使用したレスポンシブなフォントサイズを検討しましょう')
    score -= 5
  }

  // Check for heading hierarchy
  const h1Count = (html.match(/<h1/g) || []).length
  const h2Count = (html.match(/<h2/g) || []).length

  if (h1Count === 0) {
    issues.push({
      type: 'warning',
      message: 'H1タグが見つかりません',
    })
    score -= 15
  } else if (h1Count > 1) {
    issues.push({
      type: 'warning',
      message: `H1タグが${h1Count}個あります（1つが推奨）`,
    })
    score -= 10
  }

  if (h2Count === 0) {
    suggestions.push('セクションにH2見出しを追加しましょう')
    score -= 5
  }

  return {
    score: Math.max(0, score),
    status: score >= 80 ? 'good' : score >= 50 ? 'warning' : 'error',
    issues,
    suggestions,
  }
}

/**
 * Analyze color contrast
 */
function analyzeColorContrast(_html: string, css?: string): CategoryResult {
  const issues: DesignIssue[] = []
  const suggestions: string[] = []
  let score = 100

  // Check for CSS variables
  const hasCssVariables = css && css.includes('--color-')

  if (!hasCssVariables) {
    suggestions.push('カラーにCSS変数を使用してテーマ管理を容易にしましょう')
    score -= 10
  }

  // Check for dark mode support
  const hasDarkMode =
    css && (css.includes('prefers-color-scheme') || css.includes('dark-mode'))

  if (!hasDarkMode) {
    suggestions.push('ダークモード対応を検討しましょう（prefers-color-scheme）')
    score -= 5
  }

  // Basic contrast check (simplified)
  const hasLightTextOnDark =
    (css && css.includes('color: #fff')) ||
    (css && css.includes('color: white'))

  if (hasLightTextOnDark) {
    suggestions.push('テキストと背景のコントラスト比がWCAG AA基準（4.5:1）を満たしているか確認しましょう')
  }

  return {
    score: Math.max(0, score),
    status: score >= 80 ? 'good' : score >= 50 ? 'warning' : 'error',
    issues,
    suggestions,
  }
}

/**
 * Analyze performance
 */
function analyzePerformance(html: string, css?: string): CategoryResult {
  const issues: DesignIssue[] = []
  const suggestions: string[] = []
  let score = 100

  // Check for lazy loading
  if (!html.includes('loading="lazy"')) {
    suggestions.push('画像にloading="lazy"属性を追加して遅延読み込みを有効にしましょう')
    score -= 10
  }

  // Check for image optimization hints
  const hasWebP = html.includes('.webp')
  if (!hasWebP) {
    suggestions.push('WebP形式の画像使用を検討しましょう')
    score -= 5
  }

  // Check for will-change usage
  if (css && css.includes('will-change')) {
    // Good practice
  } else if (html.includes('animate-') || html.includes('parallax')) {
    suggestions.push('アニメーション要素にwill-changeプロパティを追加してGPUアクセラレーションを有効にしましょう')
    score -= 5
  }

  // Check for external resources count
  const externalScripts = (html.match(/<script[^>]+src=/g) || []).length
  const externalStyles = (html.match(/<link[^>]+stylesheet/g) || []).length

  if (externalScripts > 5) {
    issues.push({
      type: 'warning',
      message: `外部スクリプトが${externalScripts}個あります`,
    })
    suggestions.push('スクリプトの統合または遅延読み込みを検討しましょう')
    score -= 10
  }

  if (externalStyles > 3) {
    issues.push({
      type: 'info',
      message: `外部スタイルシートが${externalStyles}個あります`,
    })
    score -= 5
  }

  // Check for reduced motion support
  if (css && !css.includes('prefers-reduced-motion')) {
    suggestions.push('@media (prefers-reduced-motion: reduce)でアニメーションを無効化できるようにしましょう')
    score -= 5
  }

  return {
    score: Math.max(0, score),
    status: score >= 80 ? 'good' : score >= 50 ? 'warning' : 'error',
    issues,
    suggestions,
  }
}

/**
 * Analyze accessibility
 */
function analyzeAccessibility(html: string): CategoryResult {
  const issues: DesignIssue[] = []
  const suggestions: string[] = []
  let score = 100

  // Check for alt attributes
  const imgTags = html.match(/<img[^>]*>/g) || []
  const imgsWithoutAlt = imgTags.filter(img => !img.includes('alt='))

  if (imgsWithoutAlt.length > 0) {
    issues.push({
      type: 'error',
      message: `${imgsWithoutAlt.length}個の画像にalt属性がありません`,
    })
    score -= 20
  }

  // Check for ARIA labels on interactive elements
  const hasAriaLabels = html.includes('aria-label')
  if (!hasAriaLabels) {
    suggestions.push('インタラクティブ要素にaria-label属性を追加しましょう')
    score -= 5
  }

  // Check for form labels
  const inputs = (html.match(/<input/g) || []).length
  const labels = (html.match(/<label/g) || []).length

  if (inputs > 0 && labels < inputs) {
    issues.push({
      type: 'warning',
      message: 'フォーム入力要素に対応するラベルが不足しています',
    })
    score -= 10
  }

  // Check for lang attribute
  if (!html.includes('lang=')) {
    issues.push({
      type: 'warning',
      message: 'htmlタグにlang属性がありません',
    })
    score -= 10
  }

  // Check for skip link
  if (!html.includes('skip') && !html.includes('Skip')) {
    suggestions.push('キーボードユーザー向けにスキップリンクの追加を検討しましょう')
    score -= 5
  }

  return {
    score: Math.max(0, score),
    status: score >= 80 ? 'good' : score >= 50 ? 'warning' : 'error',
    issues,
    suggestions,
  }
}

/**
 * Get quality level from score
 */
export function getQualityLevel(score: number): {
  level: 'excellent' | 'good' | 'fair' | 'poor'
  label: string
  color: string
} {
  if (score >= 90) {
    return { level: 'excellent', label: '優秀', color: '#22c55e' }
  } else if (score >= 70) {
    return { level: 'good', label: '良好', color: '#3b82f6' }
  } else if (score >= 50) {
    return { level: 'fair', label: '改善余地あり', color: '#f59e0b' }
  } else {
    return { level: 'poor', label: '要改善', color: '#ef4444' }
  }
}

/**
 * Generate CSS for selected animation presets
 */
export function generateAnimationCSS(presetIds: string[]): string {
  const presets = ANIMATION_PRESETS.filter(p => presetIds.includes(p.id))
  return presets.map(p => p.css).join('\n')
}

/**
 * Generate JS for selected animation presets
 */
export function generateAnimationJS(presetIds: string[]): string {
  const presets = ANIMATION_PRESETS.filter(p => presetIds.includes(p.id) && p.jsRequired)
  const jsCode = presets.map(p => p.js).filter(Boolean).join('\n\n')

  // Always include the scroll animation observer
  if (presetIds.some(id => ['fade-in', 'fade-up', 'slide-left', 'slide-right', 'scale-in', 'reveal-image'].includes(id))) {
    return SCROLL_ANIMATION_JS + '\n\n' + jsCode
  }

  return jsCode
}
