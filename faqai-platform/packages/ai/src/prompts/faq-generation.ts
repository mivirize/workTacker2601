/**
 * FAQ自動生成プロンプト - 多角的視点での分析
 */

export interface FaqGenerationInput {
  url: string;
  title: string;
  content: string;
  perspective: FaqPerspective;
  existingQuestions?: string[];
  language?: 'ja' | 'en';
}

export type FaqPerspective =
  | 'user_problems'      // ユーザーの困りごと・疑問視点
  | 'product_info'       // 製品・サービス情報視点
  | 'procedures'         // 手順・操作視点
  | 'troubleshooting';   // トラブルシューティング視点

export interface GeneratedFaq {
  question: string;
  answer: string;
  category: string;
  qualityScore: number; // 0-1
  relatedKeywords: string[];
}

const PERSPECTIVE_INSTRUCTIONS: Record<FaqPerspective, string> = {
  user_problems: `
ユーザーが実際に感じる疑問・困りごとの視点でFAQを生成してください。
- 初めて利用するユーザーが感じる不安や疑問
- よくある誤解や混乱ポイント
- 「〇〇できますか？」「〇〇はどうすればいいですか？」形式の質問`,

  product_info: `
製品・サービスの機能・特徴・仕様に関するFAQを生成してください。
- 主要機能の説明
- 料金・プランに関する情報
- 対応環境・制限事項
- 他サービスとの違い`,

  procedures: `
具体的な操作手順・使い方に関するFAQを生成してください。
- 「〇〇するにはどうすればいいですか？」形式
- ステップバイステップの手順が必要な操作
- 設定・カスタマイズ方法`,

  troubleshooting: `
問題解決・トラブルシューティングに関するFAQを生成してください。
- エラーメッセージへの対処法
- うまくいかない場合の確認事項
- よくある失敗パターンと解決策`,
};

export function buildFaqGenerationPrompt(input: FaqGenerationInput): string {
  const lang = input.language === 'en' ? 'English' : '日本語';
  const existingQuestionsText = input.existingQuestions && input.existingQuestions.length > 0
    ? `\n\n## 既存のFAQ（重複を避けること）\n${input.existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : '';

  return `あなたはWebサイトのコンテンツを分析してFAQを作成する専門家です。
以下のWebページコンテンツを分析して、${lang}でFAQを生成してください。

## ページ情報
URL: ${input.url}
タイトル: ${input.title}

## コンテンツ
${input.content.slice(0, 8000)}

## 生成方針
${PERSPECTIVE_INSTRUCTIONS[input.perspective]}
${existingQuestionsText}

## 出力形式
以下のJSON配列形式で出力してください（マークダウンコードブロックなし）:
[
  {
    "question": "質問文",
    "answer": "回答文（具体的で明確に、箇条書きも活用）",
    "category": "カテゴリ名",
    "qualityScore": 0.85,
    "relatedKeywords": ["キーワード1", "キーワード2"]
  }
]

## 制約
- 5〜10個のFAQを生成する
- 質問は具体的で検索されやすい形式にする
- 回答は200文字以上、500文字以内を目安にする
- qualityScoreは0〜1の数値（コンテンツの信頼度・具体性で評価）
- 重複する質問は生成しない`;
}

export function buildCategoryClassificationPrompt(
  faqs: Array<{ question: string; answer: string }>,
  existingCategories: string[]
): string {
  return `以下のFAQリストを適切なカテゴリに分類してください。

## 既存カテゴリ（可能な限り使用する）
${existingCategories.join(', ') || 'なし（新規作成可）'}

## FAQ一覧
${faqs.map((f, i) => `${i + 1}. Q: ${f.question}`).join('\n')}

## 出力形式（JSON配列）
[
  { "index": 0, "category": "カテゴリ名" },
  ...
]

カテゴリ名は簡潔に（10文字以内）。`;
}
