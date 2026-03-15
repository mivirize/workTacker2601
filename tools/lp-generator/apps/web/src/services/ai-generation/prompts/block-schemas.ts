const BLOCK_SCHEMAS: Record<string, string> = {
  heroBlock: `{
  "_type": "heroBlock",
  "_key": "UUID形式の一意ID",
  "headline": "メインヘッドライン（必須、15文字以内推奨）",
  "subheadline": "サブヘッドライン（商品の価値を補足）",
  "ctaText": "CTAボタンテキスト（例: 今すぐ始める）",
  "ctaUrl": "#contact",
  "ctaStyle": "primary | secondary | outline",
  "layout": "center | left | right"
}`,

  featureBlock: `{
  "_type": "featureBlock",
  "_key": "UUID形式の一意ID",
  "sectionTitle": "セクションタイトル（例: 選ばれる理由）",
  "sectionSubtitle": "セクション説明文",
  "features": [
    {
      "_key": "UUID形式の一意ID",
      "icon": "絵文字（✨, 🚀, 💡, 🎯, ⚡等）",
      "title": "特徴タイトル（必須）",
      "description": "特徴の説明（2-3文）"
    }
  ],
  "layout": "grid-2 | grid-3 | list"
}`,

  ctaBlock: `{
  "_type": "ctaBlock",
  "_key": "UUID形式の一意ID",
  "headline": "行動を促すヘッドライン",
  "description": "CTAの説明文（なぜ今行動すべきか）",
  "primaryButtonText": "メインCTAテキスト",
  "primaryButtonUrl": "#contact",
  "secondaryButtonText": "サブCTAテキスト（任意）",
  "secondaryButtonUrl": "任意のURL",
  "layout": "center | split"
}`,

  benefitBlock: `{
  "_type": "benefitBlock",
  "_key": "UUID形式の一意ID",
  "sectionTitle": "セクションタイトル（例: お悩みを解決）",
  "benefits": [
    {
      "_key": "UUID形式の一意ID",
      "problem": "課題・悩み（Before）",
      "solution": "解決策・メリット（After）",
      "icon": "絵文字（🔧, 💪, 🎯, ✅, 🌟等）"
    }
  ],
  "layout": "before-after | list | grid"
}`,

  testimonialBlock: `{
  "_type": "testimonialBlock",
  "_key": "UUID形式の一意ID",
  "sectionTitle": "セクションタイトル（例: お客様の声）",
  "testimonials": [
    {
      "_key": "UUID形式の一意ID",
      "quote": "お客様の感想（具体的なエピソード込み）",
      "authorName": "お名前",
      "authorTitle": "役職（任意）",
      "authorCompany": "会社名（任意）",
      "rating": 5
    }
  ],
  "layout": "grid | carousel | list",
  "showRating": true
}`,

  faqBlock: `{
  "_type": "faqBlock",
  "_key": "UUID形式の一意ID",
  "sectionTitle": "セクションタイトル（例: よくある質問）",
  "faqs": [
    {
      "_key": "UUID形式の一意ID",
      "question": "質問文",
      "answer": "回答文（明確で簡潔に）"
    }
  ],
  "layout": "accordion | list"
}`,

  pricingBlock: `{
  "_type": "pricingBlock",
  "_key": "UUID形式の一意ID",
  "sectionTitle": "セクションタイトル（例: 料金プラン）",
  "sectionSubtitle": "料金に関する補足説明",
  "plans": [
    {
      "_key": "UUID形式の一意ID",
      "name": "プラン名",
      "price": "¥9,800",
      "pricePeriod": "/月",
      "description": "プランの説明",
      "features": ["機能1", "機能2", "機能3"],
      "isPopular": false,
      "ctaText": "このプランを選ぶ",
      "ctaUrl": "#contact"
    }
  ],
  "layout": "cards | comparison"
}`,

  formBlock: `{
  "_type": "formBlock",
  "_key": "UUID形式の一意ID",
  "sectionTitle": "セクションタイトル（例: お問い合わせ）",
  "sectionSubtitle": "フォーム上部の説明文",
  "formFields": [
    {
      "_key": "UUID形式の一意ID",
      "fieldName": "name | email | company | phone | message",
      "fieldLabel": "フィールドのラベル",
      "fieldType": "text | email | tel | textarea | select",
      "placeholder": "プレースホルダーテキスト",
      "required": true
    }
  ],
  "submitButtonText": "送信ボタンテキスト",
  "successMessage": "送信完了メッセージ"
}`,

  imageGalleryBlock: `{
  "_type": "imageGalleryBlock",
  "_key": "UUID形式の一意ID",
  "sectionTitle": "セクションタイトル",
  "images": [],
  "layout": "grid | masonry | carousel"
}`,

  videoBlock: `{
  "_type": "videoBlock",
  "_key": "UUID形式の一意ID",
  "sectionTitle": "セクションタイトル",
  "videoUrl": "YouTubeまたはVimeoのURL",
  "thumbnail": null,
  "autoplay": false
}`,

  textBlock: `{
  "_type": "textBlock",
  "_key": "UUID形式の一意ID",
  "sectionTitle": "セクションタイトル（任意）",
  "content": "リッチテキストコンテンツ（HTMLは使用不可、プレーンテキスト）",
  "layout": "full | narrow | split"
}`,
}

export function generateBlockSchemaReference(availableBlocks: string[]): string {
  const schemas = availableBlocks
    .filter((block) => BLOCK_SCHEMAS[block])
    .map((block) => `### ${block}\n\`\`\`json\n${BLOCK_SCHEMAS[block]}\n\`\`\``)
    .join('\n\n')

  return `
## 利用可能なブロックスキーマ

以下のブロックタイプから選択し、最適な順序で配置してください。
各ブロックの_keyフィールドには必ずUUID形式（例: "550e8400-e29b-41d4-a716-446655440000"）の一意IDを生成してください。

${schemas}
`
}
