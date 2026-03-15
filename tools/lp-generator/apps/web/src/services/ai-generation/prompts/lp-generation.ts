import type { HearingInput } from '../types'
import { generateBlockSchemaReference } from './block-schemas'
import { TIER_ALLOWED_BLOCKS } from '../types'

export function buildLpGenerationPrompt(hearing: HearingInput): string {
  const availableBlocks = TIER_ALLOWED_BLOCKS[hearing.templateTier]

  return `
## ヒアリング情報

### クライアント
- 会社名: ${hearing.clientName}
- 商品/サービス名: ${hearing.productName}
- 説明: ${hearing.productDescription ?? '(未入力)'}

### USP (Unique Selling Points)
${hearing.uniqueSellingPoints.length > 0 ? hearing.uniqueSellingPoints.map((usp, i) => `${i + 1}. ${usp}`).join('\n') : '(未入力)'}

### ターゲット
- 対象者: ${hearing.targetAudience ?? '(未入力)'}
- 顧客の課題:
${hearing.painPoints && hearing.painPoints.length > 0 ? hearing.painPoints.map((pain, i) => `  ${i + 1}. ${pain}`).join('\n') : '  (未入力)'}
- 期待する成果: ${hearing.desiredOutcome ?? '(未入力)'}

### 価格情報
${hearing.priceInfo?.price ? `- 価格: ${hearing.priceInfo.price}\n- 備考: ${hearing.priceInfo.priceNote ?? ''}` : '(未入力)'}

### デザイン設定
- テンプレートティア: ${hearing.templateTier}
- 利用可能ブロック: ${availableBlocks.join(', ')}
- プライマリカラー: ${hearing.primaryColor ?? '#3B82F6'}
- セカンダリカラー: ${hearing.secondaryColor ?? '#1E40AF'}
- アクセントカラー: ${hearing.accentColor ?? '#F59E0B'}

${hearing.referenceUrls && hearing.referenceUrls.length > 0 ? `### 参考URL\n${hearing.referenceUrls.join('\n')}` : ''}

---

## タスク

上記のヒアリング情報を**深く分析**し、以下を決定してください:

### 1. クライアント分析
- 推測される業種/業界
- ターゲットペルソナ（年齢層、職業、主な関心事）
- 推奨トーン（フォーマル/カジュアル/専門的/親しみやすい等）
- トーン選択の理由

### 2. LP構成の決定
利用可能ブロック（${availableBlocks.join(', ')}）から最適な順序で配置してください。

**配置のポイント:**
- ファーストビュー（heroBlock）で価値を端的に伝える
- 興味を持った訪問者に詳細を提示（featureBlock, benefitBlock）
- 信頼性を構築（testimonialBlock）
- 疑問を解消（faqBlock）
- 行動を促す（ctaBlock）

### 3. 各ブロックのコンテンツ作成

**重要: ヒアリング情報をそのまま使わず、解釈・最適化してください**

- ヘッドライン: ターゲットの関心を引く表現に変換
- 説明文: ベネフィットを前面に出した訴求
- CTA: 具体的で行動を促す文言
- FAQ: 想定される質問と回答を生成

---

## 出力形式

以下のJSON形式で**厳密に**出力してください:

\`\`\`json
{
  "analysis": {
    "industry": "推測される業種",
    "targetPersona": {
      "ageRange": "例: 30-50代",
      "occupation": "例: 中小企業経営者",
      "primaryConcern": "例: 業務効率化"
    },
    "recommendedTone": "フォーマル | カジュアル | 専門的 | 親しみやすい",
    "toneRationale": "トーン選択の理由を1-2文で"
  },
  "designRecommendations": {
    "layout": "center | left | right",
    "colorUsage": "カラー使用の提案",
    "iconStyle": "推奨するアイコン/絵文字のスタイル"
  },
  "blocks": [
    // LpBlock配列 - 下記スキーマに従う
  ]
}
\`\`\`

${generateBlockSchemaReference(availableBlocks)}

---

## 注意事項

1. **_keyの生成**: 各ブロックと配列要素の_keyは必ずUUID形式で一意に生成
2. **日本語でコピー作成**: すべてのテキストは日本語で
3. **利用可能ブロックのみ使用**: ${availableBlocks.join(', ')} 以外は使用不可
4. **JSON形式を厳守**: 必ず\`\`\`json ... \`\`\`で囲む
5. **空配列を避ける**: features, benefits, testimonials等は最低2-3項目生成
`
}
