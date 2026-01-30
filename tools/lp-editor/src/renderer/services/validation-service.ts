/**
 * Validation Service
 *
 * Provides validation checks for LP content quality assurance.
 */

import * as cheerio from 'cheerio'

export type ValidationSeverity = 'error' | 'warning' | 'info'

/**
 * 絵文字検出パターン（広範囲）
 * - Miscellaneous Symbols and Pictographs
 * - Emoticons
 * - Transport and Map Symbols
 * - Regional Indicator Symbols
 * - Miscellaneous Symbols
 * - Dingbats
 * - Miscellaneous Technical
 * - Star
 */
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]/gu

export interface ValidationIssue {
  id: string
  severity: ValidationSeverity
  category: string
  message: string
  field?: string
  line?: number
  suggestion?: string
}

export interface ValidationResult {
  isValid: boolean
  issues: ValidationIssue[]
  summary: {
    errors: number
    warnings: number
    info: number
  }
}

interface EditableField {
  id: string
  type: string
  value: string | null
  label?: string
  href?: string
  src?: string
}

interface RepeatBlock {
  id: string
  items: Array<{
    index: number
    fields: Record<string, {
      id: string
      type: string
      value: string | null
      href?: string
      src?: string
    }>
  }>
}

/**
 * Run all validation checks
 */
export function validateContent(
  html: string,
  editables: Record<string, EditableField>,
  repeatBlocks: Record<string, RepeatBlock>
): ValidationResult {
  const issues: ValidationIssue[] = []

  // Run all validation checks
  issues.push(...validateLinks(html, editables, repeatBlocks))
  issues.push(...validateImages(html, editables, repeatBlocks))
  issues.push(...validateRequiredFields(editables))
  issues.push(...validateTextContent(editables, repeatBlocks))
  issues.push(...validateHtmlStructure(html))
  issues.push(...validateEmoji(editables, repeatBlocks))
  issues.push(...validateRepeatBlocks(repeatBlocks))
  issues.push(...validateLpEditorCompatibility(html))

  // Calculate summary
  const summary = {
    errors: issues.filter(i => i.severity === 'error').length,
    warnings: issues.filter(i => i.severity === 'warning').length,
    info: issues.filter(i => i.severity === 'info').length,
  }

  return {
    isValid: summary.errors === 0,
    issues,
    summary,
  }
}

/**
 * Validate links and buttons
 */
function validateLinks(
  html: string,
  editables: Record<string, EditableField>,
  repeatBlocks: Record<string, RepeatBlock>
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const $ = cheerio.load(html)

  // Check all link-type editables
  for (const [id, field] of Object.entries(editables)) {
    if (field.type === 'link') {
      // Check for empty href
      if (!field.href || field.href.trim() === '') {
        issues.push({
          id: `link-empty-${id}`,
          severity: 'error',
          category: 'リンク',
          message: `リンク「${field.label || id}」のURLが設定されていません`,
          field: id,
          suggestion: 'URLを設定してください',
        })
      }
      // Check for placeholder href
      else if (field.href === '#' || field.href === 'javascript:void(0)') {
        issues.push({
          id: `link-placeholder-${id}`,
          severity: 'warning',
          category: 'リンク',
          message: `リンク「${field.label || id}」のURLがプレースホルダーのままです`,
          field: id,
          suggestion: '正しいURLを設定してください',
        })
      }
      // Check for empty link text
      if (!field.value || field.value.trim() === '') {
        issues.push({
          id: `link-text-empty-${id}`,
          severity: 'warning',
          category: 'リンク',
          message: `リンク「${field.label || id}」のテキストが空です`,
          field: id,
          suggestion: 'リンクテキストを設定してください',
        })
      }
    }
  }

  // Check repeat block links
  for (const [blockId, block] of Object.entries(repeatBlocks)) {
    for (const item of block.items) {
      for (const [fieldKey, field] of Object.entries(item.fields)) {
        if (field.type === 'link') {
          const fieldLabel = `${blockId} > アイテム${item.index + 1} > ${fieldKey}`
          if (!field.href || field.href.trim() === '' || field.href === '#') {
            issues.push({
              id: `link-repeat-${blockId}-${item.index}-${fieldKey}`,
              severity: 'warning',
              category: 'リンク',
              message: `リンク「${fieldLabel}」のURLが未設定またはプレースホルダーです`,
              field: field.id,
              suggestion: '正しいURLを設定してください',
            })
          }
        }
      }
    }
  }

  // Check all anchor links in HTML
  $('a[href^="#"]').each((_, el) => {
    const href = $(el).attr('href')
    if (href && href !== '#') {
      const targetId = href.substring(1)
      if ($(`#${targetId}`).length === 0) {
        issues.push({
          id: `anchor-missing-${targetId}`,
          severity: 'warning',
          category: 'リンク',
          message: `アンカーリンク「${href}」の対象セクションが見つかりません`,
          suggestion: `id="${targetId}"の要素を追加するか、リンクを修正してください`,
        })
      }
    }
  })

  return issues
}

/**
 * Validate images
 */
function validateImages(
  html: string,
  editables: Record<string, EditableField>,
  repeatBlocks: Record<string, RepeatBlock>
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const $ = cheerio.load(html)

  // Check image-type editables
  for (const [id, field] of Object.entries(editables)) {
    if (field.type === 'image') {
      if (!field.src || field.src.trim() === '') {
        issues.push({
          id: `image-empty-${id}`,
          severity: 'warning',
          category: '画像',
          message: `画像「${field.label || id}」のパスが設定されていません`,
          field: id,
          suggestion: '画像を選択してください',
        })
      }
    }
  }

  // Check for images without alt text
  $('img').each((_, el) => {
    const $img = $(el)
    const alt = $img.attr('alt')
    const src = $img.attr('src')
    if (!alt || alt.trim() === '') {
      issues.push({
        id: `image-alt-${src || 'unknown'}`,
        severity: 'info',
        category: '画像',
        message: '画像にalt属性がありません（アクセシビリティ）',
        suggestion: 'alt属性を追加してください',
      })
    }
  })

  return issues
}

/**
 * Validate required fields
 */
function validateRequiredFields(editables: Record<string, EditableField>): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Check for important fields that should have content
  const importantPatterns = ['title', 'headline', 'cta', 'heading', 'name']

  for (const [id, field] of Object.entries(editables)) {
    const idLower = id.toLowerCase()
    const isImportant = importantPatterns.some(p => idLower.includes(p))

    if (isImportant && (!field.value || field.value.trim() === '')) {
      issues.push({
        id: `required-empty-${id}`,
        severity: 'warning',
        category: '必須フィールド',
        message: `重要なフィールド「${field.label || id}」が空です`,
        field: id,
        suggestion: 'コンテンツを入力してください',
      })
    }
  }

  return issues
}

/**
 * Validate text content
 */
function validateTextContent(
  editables: Record<string, EditableField>,
  repeatBlocks: Record<string, RepeatBlock>
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Check for very long text that might break layout
  for (const [id, field] of Object.entries(editables)) {
    if (field.type === 'text' && field.value) {
      if (field.value.length > 200) {
        issues.push({
          id: `text-long-${id}`,
          severity: 'info',
          category: 'テキスト',
          message: `テキスト「${field.label || id}」が長すぎる可能性があります（${field.value.length}文字）`,
          field: id,
          suggestion: 'レイアウトが崩れないか確認してください',
        })
      }
    }
  }

  // Check repeat block text
  for (const [blockId, block] of Object.entries(repeatBlocks)) {
    for (const item of block.items) {
      for (const [fieldKey, field] of Object.entries(item.fields)) {
        if ((field.type === 'text' || field.type === 'richtext') && (!field.value || field.value.trim() === '')) {
          issues.push({
            id: `text-empty-${blockId}-${item.index}-${fieldKey}`,
            severity: 'info',
            category: 'テキスト',
            message: `リピートブロック「${blockId}」のアイテム${item.index + 1}の「${fieldKey}」が空です`,
            field: field.id,
            suggestion: 'コンテンツを入力するか、アイテムを削除してください',
          })
        }
      }
    }
  }

  return issues
}

/**
 * Validate HTML structure
 */
function validateHtmlStructure(html: string): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const $ = cheerio.load(html)

  // Check for multiple h1 tags
  const h1Count = $('h1').length
  if (h1Count > 1) {
    issues.push({
      id: 'html-multiple-h1',
      severity: 'warning',
      category: 'HTML構造',
      message: `複数のh1タグが存在します（${h1Count}個）`,
      suggestion: 'SEOのため、h1タグは1つにすることを推奨します',
    })
  }

  // Check for empty sections
  $('section').each((idx, el) => {
    const $section = $(el)
    const textContent = $section.text().trim()
    if (textContent.length < 10) {
      const id = $section.attr('id') || `section-${idx}`
      issues.push({
        id: `section-empty-${id}`,
        severity: 'info',
        category: 'HTML構造',
        message: `セクション「${id}」のコンテンツが少ないです`,
        suggestion: 'コンテンツを追加するか、セクションを削除してください',
      })
    }
  })

  // Check for broken CSS variable references
  const cssVarRefs = html.match(/var\(--[^)]+\)/g) || []
  const rootVars = new Set<string>()
  const rootMatch = html.match(/:root\s*\{([^}]+)\}/g)
  if (rootMatch) {
    for (const block of rootMatch) {
      const vars = block.matchAll(/(--[^:]+):/g)
      for (const v of vars) {
        rootVars.add(v[1].trim())
      }
    }
  }

  for (const ref of cssVarRefs) {
    const varName = ref.match(/var\((--[^,)]+)/)?.[1]
    if (varName && !rootVars.has(varName)) {
      issues.push({
        id: `css-var-missing-${varName}`,
        severity: 'warning',
        category: 'CSS',
        message: `CSS変数「${varName}」が定義されていません`,
        suggestion: ':rootブロックで変数を定義してください',
      })
    }
  }

  return issues
}

/**
 * Validate emoji usage in text fields
 * 絵文字を検出して警告を出す
 */
function validateEmoji(
  editables: Record<string, EditableField>,
  repeatBlocks: Record<string, RepeatBlock>
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  /**
   * テキストから絵文字を検出する
   */
  const detectEmojis = (text: string): string[] => {
    const matches = text.match(EMOJI_REGEX)
    return matches ? [...new Set(matches)] : []
  }

  // 通常のテキストフィールドをチェック
  for (const [id, field] of Object.entries(editables)) {
    if ((field.type === 'text' || field.type === 'richtext') && field.value) {
      const emojis = detectEmojis(field.value)
      if (emojis.length > 0) {
        issues.push({
          id: `emoji-detected-${id}`,
          severity: 'warning',
          category: 'テキスト品質',
          message: `フィールド「${field.label || id}」に絵文字が含まれています: ${emojis.join(' ')}`,
          field: id,
          suggestion: '絵文字の使用はメールクライアントやブラウザによって表示が異なる場合があります。必要に応じて削除を検討してください',
        })
      }
    }
  }

  // リピートブロック内のテキストフィールドをチェック
  for (const [blockId, block] of Object.entries(repeatBlocks)) {
    for (const item of block.items) {
      for (const [fieldKey, field] of Object.entries(item.fields)) {
        if ((field.type === 'text' || field.type === 'richtext') && field.value) {
          const emojis = detectEmojis(field.value)
          if (emojis.length > 0) {
            const fieldLabel = `${blockId} > アイテム${item.index + 1} > ${fieldKey}`
            issues.push({
              id: `emoji-repeat-${blockId}-${item.index}-${fieldKey}`,
              severity: 'warning',
              category: 'テキスト品質',
              message: `フィールド「${fieldLabel}」に絵文字が含まれています: ${emojis.join(' ')}`,
              field: field.id,
              suggestion: '絵文字の使用はメールクライアントやブラウザによって表示が異なる場合があります。必要に応じて削除を検討してください',
            })
          }
        }
      }
    }
  }

  return issues
}

/**
 * Validate repeat blocks for common issues
 * リピートブロックの詳細チェック
 */
function validateRepeatBlocks(
  repeatBlocks: Record<string, RepeatBlock>
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  for (const [blockId, block] of Object.entries(repeatBlocks)) {
    // 1. 空のリピートアイテム検出（全フィールドが空または未入力）
    for (const item of block.items) {
      const fields = Object.values(item.fields)
      const allFieldsEmpty = fields.every(field => {
        if (field.type === 'image') {
          return !field.src || field.src.trim() === ''
        }
        if (field.type === 'link') {
          return (!field.href || field.href.trim() === '' || field.href === '#') &&
                 (!field.value || field.value.trim() === '')
        }
        return !field.value || field.value.trim() === ''
      })

      if (allFieldsEmpty && fields.length > 0) {
        issues.push({
          id: `repeat-empty-item-${blockId}-${item.index}`,
          severity: 'warning',
          category: 'リピートブロック',
          message: `リピートブロック「${blockId}」のアイテム${item.index + 1}は全てのフィールドが空です`,
          suggestion: 'コンテンツを入力するか、不要なアイテムは削除してください',
        })
      }
    }

    // 2. アイテム間のフィールド値の重複検出
    if (block.items.length >= 2) {
      // 各フィールドキーについて重複をチェック
      const firstItem = block.items[0]
      if (firstItem) {
        for (const fieldKey of Object.keys(firstItem.fields)) {
          const values: Map<string, number[]> = new Map()

          for (const item of block.items) {
            const field = item.fields[fieldKey]
            if (!field) continue

            let valueToCheck: string | undefined
            if (field.type === 'image') {
              valueToCheck = field.src
            } else if (field.type === 'link') {
              // リンクの場合はテキストとURLの両方をチェック
              valueToCheck = `${field.value || ''}|${field.href || ''}`
            } else {
              valueToCheck = field.value ?? undefined
            }

            if (valueToCheck && valueToCheck.trim() !== '' && valueToCheck !== '|' && valueToCheck !== '#') {
              const normalizedValue = valueToCheck.trim().toLowerCase()
              const existing = values.get(normalizedValue) || []
              values.set(normalizedValue, [...existing, item.index + 1])
            }
          }

          // 重複を報告
          for (const [value, indices] of values.entries()) {
            if (indices.length >= 2) {
              // 値が意味のあるものかチェック（プレースホルダーでない）
              const displayValue = value.length > 30 ? value.substring(0, 30) + '...' : value
              issues.push({
                id: `repeat-duplicate-${blockId}-${fieldKey}-${indices.join('-')}`,
                severity: 'info',
                category: 'リピートブロック',
                message: `リピートブロック「${blockId}」の「${fieldKey}」で同じ値が複数のアイテムに存在します（アイテム${indices.join(', ')}）: "${displayValue}"`,
                suggestion: '意図した重複でない場合は、各アイテムに異なる値を設定してください',
              })
            }
          }
        }
      }
    }

    // 3. リピートブロック内の画像パス未設定検出
    for (const item of block.items) {
      for (const [fieldKey, field] of Object.entries(item.fields)) {
        if (field.type === 'image') {
          if (!field.src || field.src.trim() === '') {
            const fieldLabel = `${blockId} > アイテム${item.index + 1} > ${fieldKey}`
            issues.push({
              id: `repeat-image-empty-${blockId}-${item.index}-${fieldKey}`,
              severity: 'warning',
              category: 'リピートブロック',
              message: `画像「${fieldLabel}」のパスが設定されていません`,
              field: field.id,
              suggestion: '画像を選択してください',
            })
          }
        }
      }
    }

    // 4. リピートブロック内のリンクURL未設定検出
    for (const item of block.items) {
      for (const [fieldKey, field] of Object.entries(item.fields)) {
        if (field.type === 'link') {
          if (!field.href || field.href.trim() === '' || field.href === '#' || field.href === 'javascript:void(0)') {
            const fieldLabel = `${blockId} > アイテム${item.index + 1} > ${fieldKey}`
            issues.push({
              id: `repeat-link-empty-${blockId}-${item.index}-${fieldKey}`,
              severity: 'warning',
              category: 'リピートブロック',
              message: `リンク「${fieldLabel}」のURLが設定されていません`,
              field: field.id,
              suggestion: '正しいURLを設定してください',
            })
          }
        }
      }
    }
  }

  return issues
}

/**
 * Validate LP-Editor compatibility
 * LPがLP-Editorで正しく動作するかチェック
 */
function validateLpEditorCompatibility(html: string): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const $ = cheerio.load(html)

  // 1. CSPメタタグの検出（プレビューでfile://がブロックされる原因）
  const cspMeta = $('meta[http-equiv="Content-Security-Policy"]')
  if (cspMeta.length > 0) {
    issues.push({
      id: 'lp-csp-detected',
      severity: 'warning',
      category: 'LP-Editor互換性',
      message: 'HTMLにContent-Security-Policyメタタグが含まれています',
      suggestion: 'LP-Editorのプレビューでfile://プロトコルがブロックされる可能性があります。CSPはサーバー側で設定することを推奨します',
    })
  }

  // 2. href="#"のみのリンク（白画面の原因になりうる）
  const placeholderLinks = $('a[href="#"]').not('[data-editable]')
  if (placeholderLinks.length > 0) {
    issues.push({
      id: 'lp-placeholder-links',
      severity: 'info',
      category: 'LP-Editor互換性',
      message: `href="#"のみのリンクが${placeholderLinks.length}個あります`,
      suggestion: 'LP側のJSでe.preventDefault()を追加するか、正しいURLを設定してください',
    })
  }

  // 3. 外部リソース（Google Fonts等）の検出
  const externalLinks = $('link[href^="https://fonts.googleapis.com"], link[href^="https://fonts.gstatic.com"]')
  if (externalLinks.length > 0) {
    issues.push({
      id: 'lp-external-fonts',
      severity: 'info',
      category: 'LP-Editor互換性',
      message: '外部フォント（Google Fonts等）が使用されています',
      suggestion: 'LP-Editorのプレビューではオフライン環境でフォントが表示されない場合があります。システムフォントへのフォールバックを設定してください',
    })
  }

  // 4. インラインSVGのdata-type="image"（画像フィールドとして認識されない）
  const svgImages = $('svg[data-type="image"]')
  if (svgImages.length > 0) {
    issues.push({
      id: 'lp-svg-image-field',
      severity: 'error',
      category: 'LP-Editor互換性',
      message: `インラインSVGにdata-type="image"が設定されています（${svgImages.length}個）`,
      suggestion: '画像フィールドには<img src="...">タグを使用してください。インラインSVGにはsrc属性がないため、LP-Editorで認識されません',
    })
  }

  // 5. data-editable属性を持つが必須属性が欠けている要素
  $('[data-editable]').each((_, el) => {
    const $el = $(el)
    const editableId = $el.attr('data-editable')
    const dataType = $el.attr('data-type')

    if (!dataType) {
      issues.push({
        id: `lp-missing-type-${editableId}`,
        severity: 'warning',
        category: 'LP-Editor互換性',
        message: `編集可能要素「${editableId}」にdata-type属性がありません`,
        suggestion: 'data-type="text", "richtext", "image", または "link"を設定してください',
      })
    }
  })

  return issues
}

/**
 * Get validation summary as a formatted string
 */
export function getValidationSummary(result: ValidationResult): string {
  const { summary } = result

  if (result.isValid && summary.warnings === 0 && summary.info === 0) {
    return 'すべてのチェックをパスしました'
  }

  const parts: string[] = []
  if (summary.errors > 0) parts.push(`エラー: ${summary.errors}`)
  if (summary.warnings > 0) parts.push(`警告: ${summary.warnings}`)
  if (summary.info > 0) parts.push(`情報: ${summary.info}`)

  return parts.join(' / ')
}
