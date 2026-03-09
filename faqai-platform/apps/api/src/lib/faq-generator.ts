import Anthropic from '@anthropic-ai/sdk';
import { logger } from './logger.js';

export type GeneratedFaq = {
  question: string;
  answer: string;
  category?: string;
  qualityScore?: number;
  tags?: string[];
};

export type FaqGenerationContext = {
  siteUrl: string;
  siteName: string;
  aiContext?: string;
  existingFaqs?: Array<{ question: string; answer: string }>;
  existingSiteFaqs?: Array<{ question: string; answer: string }>;
};

type PageContent = {
  url: string;
  title: string | null;
  contentText: string | null;
  isFaqPage?: boolean;
  structuredFaqs?: Array<{ question: string; answer: string }>;
};

/**
 * サイト分析フェーズ: AIでサイトの傾向を分析し、必要なFAQ項目を提案
 */
export async function analyzeSiteForFaqTopics(
  pages: Array<{ url: string; title: string | null; contentText: string | null }>,
  context: FaqGenerationContext,
): Promise<{
  suggestedTopics: string[];
  siteCategory: string;
  targetAudience: string;
}> {
  const llmConfig = getLlmConfig();
  if (!llmConfig) {
    return {
      suggestedTopics: ['サービス概要', '料金', '使い方', 'サポート', 'よくある質問'],
      siteCategory: '一般',
      targetAudience: '一般ユーザー',
    };
  }

  const pagesSummary = pages
    .slice(0, 10)
    .map((p) => `- ${p.title ?? p.url}: ${(p.contentText ?? '').slice(0, 500)}`)
    .join('\n');

  try {
    const response = await callLlm({
      messages: [
        {
          role: 'system',
          content: 'You are a site analysis expert. Analyze websites and suggest FAQ topics. Always respond in valid JSON.',
        },
        {
          role: 'user',
          content: `サイト「${context.siteName}」(${context.siteUrl}) のページを分析して、
一般的に必要そうなFAQ項目のトピックを提案してください。

ページ概要:
${pagesSummary}

JSON形式で回答:
{
  "suggestedTopics": ["トピック1", "トピック2", ...],
  "siteCategory": "業種/カテゴリ",
  "targetAudience": "ターゲットユーザー"
}

suggestedTopicsは10〜20個程度、具体的なFAQ質問カテゴリを含めること。
例: "料金プランについて", "アカウント登録方法", "解約・退会手続き" など`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: 'json_object' as const },
    });

    const parsed = JSON.parse(response) as {
      suggestedTopics?: string[];
      siteCategory?: string;
      targetAudience?: string;
    };

    return {
      suggestedTopics: parsed.suggestedTopics ?? ['一般的なFAQ'],
      siteCategory: parsed.siteCategory ?? '一般',
      targetAudience: parsed.targetAudience ?? '一般ユーザー',
    };
  } catch (err) {
    logger.warn({ err: String(err) }, 'Site analysis failed, using defaults');
    return {
      suggestedTopics: ['サービス概要', '料金', '使い方', 'サポート'],
      siteCategory: '一般',
      targetAudience: '一般ユーザー',
    };
  }
}

/**
 * FAQページから構造化FAQを抽出する
 */
export function extractStructuredFaqs(
  contentText: string,
): Array<{ question: string; answer: string }> {
  const faqs: Array<{ question: string; answer: string }> = [];

  // パターン1: Q&A形式（Q: ... A: ...）
  const qaPattern = /[QＱ][.．:：\s]\s*(.+?)[\r\n]+[AＡ][.．:：\s]\s*(.+?)(?=[\r\n]+[QＱ][.．:：\s]|$)/gs;
  let match: RegExpExecArray | null;
  while ((match = qaPattern.exec(contentText)) !== null) {
    const q = match[1]?.trim();
    const a = match[2]?.trim();
    if (q && a && q.length > 5 && a.length > 10) {
      faqs.push({ question: q, answer: a });
    }
  }

  // パターン2: 「よくある質問」「FAQ」セクション内の箇条書き
  const faqSectionPattern = /(?:よくある質問|FAQ|Ｆ.?Ａ.?Ｑ|質問と回答)[\s\S]*?(?:\n\n|\Z)/gi;
  const faqSections = contentText.match(faqSectionPattern);
  if (faqSections) {
    for (const section of faqSections) {
      // 「？」「?」で終わる文を質問として抽出
      const questionPattern = /(.+?[？?])[\r\n]+(.+?)(?=[\r\n]+.+?[？?]|$)/gs;
      let qMatch: RegExpExecArray | null;
      while ((qMatch = questionPattern.exec(section)) !== null) {
        const q = qMatch[1]?.trim();
        const a = qMatch[2]?.trim();
        if (q && a && q.length > 5 && a.length > 10) {
          const isDuplicate = faqs.some((f) => f.question === q);
          if (!isDuplicate) {
            faqs.push({ question: q, answer: a });
          }
        }
      }
    }
  }

  return faqs;
}

/**
 * ページコンテンツからFAQを生成する（多角的視点対応）
 */
export async function generateFaqFromContent(
  pageContent: PageContent,
  options?: {
    maxFaqs?: number;
    context?: FaqGenerationContext;
    perspective?: 'user_problems' | 'product_info' | 'procedures' | 'troubleshooting';
  },
): Promise<GeneratedFaq[]> {
  const maxFaqs = options?.maxFaqs ?? 5;

  // FAQページから直接抽出されたものがあれば最優先
  if (pageContent.structuredFaqs && pageContent.structuredFaqs.length > 0) {
    return pageContent.structuredFaqs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
      category: 'よくある質問（既存）',
      qualityScore: 1.0,
      tags: ['既存FAQ'],
    }));
  }

  if (!pageContent.contentText || pageContent.contentText.length < 100) {
    return [];
  }

  const llmAvailable = getLlmConfig();
  if (!llmAvailable) {
    throw new Error(
      'No LLM provider available for FAQ generation. Set at least one of: ZAI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY',
    );
  }

  const prompt = buildEnhancedPrompt(pageContent, maxFaqs, options?.context, options?.perspective);

  const content = await callLlm({
    messages: [
      {
        role: 'system',
        content: `You are an expert FAQ extractor and generator for Japanese websites.
You analyze web page content and create FAQ items based STRICTLY on the page content.
NEVER fabricate information not present in the source content.
Always respond with valid JSON only.
If the page is in Japanese, generate FAQ in Japanese.
When content is insufficient, return fewer FAQs rather than inventing answers.`,
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 3000,
    response_format: { type: 'json_object' as const },
  });

  const parsed = JSON.parse(content) as { faqs?: GeneratedFaq[] };
  return (parsed.faqs ?? []).slice(0, maxFaqs).map((faq) => ({
    ...faq,
    qualityScore: faq.qualityScore ?? 0.7,
    tags: faq.tags ?? [],
  }));
}

/**
 * 生成されたFAQの品質を検証・重複排除する
 */
export async function validateAndDeduplicateFaqs(
  faqs: GeneratedFaq[],
  existingFaqs: Array<{ question: string; answer: string }>,
): Promise<GeneratedFaq[]> {
  if (faqs.length === 0) return [];

  const llmAvailable = getLlmConfig();
  if (!llmAvailable) {
    // LLM未設定の場合は単純な文字列比較で重複排除
    return faqs.filter((faq) => {
      return !existingFaqs.some((existing) =>
        existing.question.includes(faq.question) || faq.question.includes(existing.question),
      );
    });
  }

  try {
    const content = await callLlm({
      messages: [
        {
          role: 'system',
          content: 'You are a FAQ quality reviewer. Validate and deduplicate FAQ items. Respond with valid JSON only.',
        },
        {
          role: 'user',
          content: `以下の新規FAQ候補と既存FAQを比較して、重複を排除し品質を評価してください。

## 新規FAQ候補
${faqs.map((f, i) => `${i + 1}. Q: ${f.question}\n   A: ${f.answer}`).join('\n')}

## 既存FAQ（これらと重複するものは除外）
${existingFaqs.length > 0 ? existingFaqs.map((f, i) => `${i + 1}. Q: ${f.question}`).join('\n') : 'なし'}

JSON形式で回答:
{
  "faqs": [
    {
      "question": "重複でない質問",
      "answer": "改善された回答",
      "category": "カテゴリ",
      "qualityScore": 0.85,
      "tags": ["タグ1"],
      "reason": "採用理由"
    }
  ]
}

品質基準:
- 質問が具体的で検索されやすい: +0.2
- 回答が具体的で実用的: +0.2
- ページコンテンツに基づいている: +0.2
- ユーザーの実際のニーズに応える: +0.2
- 既存FAQと重複していない: 必須
qualityScoreが0.5未満のものは除外すること`,
        },
      ],
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: 'json_object' as const },
    });

    const parsed = JSON.parse(content) as { faqs?: GeneratedFaq[] };
    return (parsed.faqs ?? []).filter((f) => (f.qualityScore ?? 0) >= 0.5);
  } catch (err) {
    logger.warn({ err: String(err) }, 'FAQ validation failed, returning unvalidated');
    return faqs.filter((faq) => {
      return !existingFaqs.some((existing) =>
        existing.question.includes(faq.question) || faq.question.includes(existing.question),
      );
    });
  }
}

/**
 * LLMを使ってページコンテンツからFAQを抽出する（生成ではなく抽出のみ）
 * 構造化抽出が不十分な場合のフォールバックとして使用
 */
export async function extractFaqsWithLlm(
  contentText: string,
  pageUrl: string,
): Promise<Array<{ question: string; answer: string }>> {
  const llmConfig = getLlmConfig();
  if (!llmConfig) return [];

  try {
    const response = await callLlm({
      messages: [
        {
          role: 'system',
          content: `あなたはFAQ抽出の専門家です。与えられたテキストから質問と回答のペアを正確に抽出してください。
テキストに存在しない情報は絶対に追加しないでください。
テキストにFAQが見つからない場合は空の配列を返してください。
必ず有効なJSONで応答してください。`,
        },
        {
          role: 'user',
          content: `以下のページコンテンツからFAQ（質問と回答のペア）をすべて抽出してください。
ページにFAQが存在しない場合は空配列を返してください。
**テキストに記載されている質問と回答のみ**を抽出すること。新しいFAQを作成しないこと。

URL: ${pageUrl}

コンテンツ:
${contentText.slice(0, 15000)}

JSON形式: { "faqs": [{ "question": "...", "answer": "..." }] }`,
        },
      ],
      temperature: 0.1,
      max_tokens: 4000,
      response_format: { type: 'json_object' as const },
    });

    const parsed = JSON.parse(response) as { faqs?: Array<{ question: string; answer: string }> };
    const faqs = parsed.faqs ?? [];

    // 抽出後バリデーション: 質問文がソーステキストに存在するか検証
    const contentLower = contentText.slice(0, 15000).toLowerCase();
    return faqs.filter((faq) => {
      const qFragment = faq.question.slice(0, 20).toLowerCase();
      if (qFragment.length >= 5 && !contentLower.includes(qFragment)) {
        logger.debug(
          { question: faq.question.slice(0, 50), pageUrl },
          'Filtered: question not found in source content',
        );
        return false;
      }
      return true;
    });
  } catch (err) {
    logger.warn({ err: String(err), pageUrl }, 'LLM FAQ extraction failed');
    return [];
  }
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function buildEnhancedPrompt(
  page: PageContent,
  maxFaqs: number,
  context?: FaqGenerationContext,
  perspective?: string,
): string {
  const contentPreview = (page.contentText ?? '').slice(0, 10000);
  const perspectiveInstruction = getPerspectiveInstruction(perspective);
  const existingFaqsText = context?.existingSiteFaqs && context.existingSiteFaqs.length > 0
    ? `\n## 既存FAQ（これらと重複する質問は生成しないこと）\n${context.existingSiteFaqs.map((f, i) => `${i + 1}. ${f.question}`).join('\n')}`
    : '';

  const aiContextText = context?.aiContext
    ? `\n## サイト固有コンテキスト\n${context.aiContext}\n`
    : '';

  return `以下のWebページコンテンツから**ページに実際に記載されている情報のみ**に基づいてFAQを生成してください。

## 絶対禁止事項
- ページに記載されていない情報を捏造しない
- 回答は必ずページ内の具体的な文言・数値に基づくこと
- 一般的なテンプレート回答（「お問い合わせください」等の定型文）を使わない
- ページにない機能・サービスを推測で追加しない

## ページ情報
URL: ${page.url}
タイトル: ${page.title ?? 'N/A'}
${page.isFaqPage ? '※このページはFAQ/よくある質問ページです。既存の質問を漏れなく抽出してください。' : ''}
${aiContextText}

## コンテンツ
---
${contentPreview}
---

${perspectiveInstruction}
${existingFaqsText}

## 出力形式
{
  "faqs": [
    {
      "question": "具体的で検索されやすい質問文",
      "answer": "ページ内容に基づく具体的な回答（2〜5文）",
      "category": "カテゴリ名",
      "qualityScore": 0.85,
      "tags": ["タグ1", "タグ2"]
    }
  ]
}

## 生成ルール
- ${maxFaqs}個以下のFAQを生成する（コンテンツが不十分なら数を減らす）
- 日本語のコンテンツは日本語でFAQを生成する
- 質問は実際のユーザーが検索する形式にする
- **各回答にはページ内の具体的な文言を反映させること**
- ページ内容が薄い場合はFAQ数を減らして正確性を優先する
- qualityScore: コンテンツに直接基づく=0.9, 推測を含む=0.5以下
- tagsは内容に合った分類タグ（2〜3個）`;
}

function getPerspectiveInstruction(perspective?: string): string {
  switch (perspective) {
    case 'user_problems':
      return `## 生成方針: ユーザーの困りごと視点
- 初めて利用するユーザーの不安や疑問
- よくある誤解や混乱ポイント
- 「〇〇できますか？」「〇〇はどうすればいいですか？」形式`;
    case 'product_info':
      return `## 生成方針: 製品・サービス情報視点
- 主要機能の説明、料金・プラン
- 対応環境・制限事項
- 他サービスとの違い`;
    case 'procedures':
      return `## 生成方針: 操作手順視点
- 「〇〇するにはどうすればいいですか？」形式
- ステップバイステップの手順
- 設定・カスタマイズ方法`;
    case 'troubleshooting':
      return `## 生成方針: トラブルシューティング視点
- エラーメッセージへの対処法
- うまくいかない場合の確認事項
- よくある失敗パターンと解決策`;
    default:
      return `## 生成方針: 総合的視点
- ユーザーが実際に疑問に思うことを優先
- サービスの基本情報、使い方、トラブルシューティングをバランスよく`;
  }
}

type LlmProviderConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: 'z.ai' | 'openai' | 'anthropic';
};

/**
 * 利用可能なすべてのLLMプロバイダー設定を優先順位付きで取得する
 * 優先順位: ZAI_API_KEY (z.ai) > OPENAI_API_KEY (OpenAI) > ANTHROPIC_API_KEY (Anthropic)
 */
function getAllLlmConfigs(): LlmProviderConfig[] {
  const configs: LlmProviderConfig[] = [];

  const zaiKey = process.env['ZAI_API_KEY'];
  if (zaiKey) {
    configs.push({
      apiKey: zaiKey,
      baseUrl: 'https://api.z.ai/api/paas/v4',
      model: process.env['ZAI_MODEL'] ?? 'glm-5',
      provider: 'z.ai',
    });
  }

  const openaiKey = process.env['OPENAI_API_KEY'];
  if (openaiKey) {
    configs.push({
      apiKey: openaiKey,
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      provider: 'openai',
    });
  }

  const anthropicKey = process.env['ANTHROPIC_API_KEY'];
  if (anthropicKey) {
    configs.push({
      apiKey: anthropicKey,
      baseUrl: 'https://api.anthropic.com',
      model: 'claude-sonnet-4-20250514',
      provider: 'anthropic',
    });
  }

  return configs;
}

/**
 * 後方互換: 最優先のLLM設定を返す（設定チェック用）
 */
function getLlmConfig(): LlmProviderConfig | null {
  const configs = getAllLlmConfigs();
  return configs.length > 0 ? (configs[0] ?? null) : null;
}

/** エラーがリトライ可能（別プロバイダーで再試行すべき）かどうか判定する */
function isRetryableError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message;
    // HTTP 429 (rate limit), 401 (auth), 500+ (server error), network errors
    if (/\b(429|401|402|403|500|502|503|504)\b/.test(msg)) return true;
    if (/fetch failed|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|network/i.test(msg)) return true;
  }
  return true; // デフォルトではリトライを許可
}

/** OpenAI互換API (z.ai, OpenAI) を呼び出す */
async function callOpenAICompatible(
  config: LlmProviderConfig,
  params: {
    messages: Array<{ role: string; content: string }>;
    temperature: number;
    max_tokens: number;
    response_format: { type: string };
  },
): Promise<string> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: params.messages,
      temperature: params.temperature,
      max_tokens: params.max_tokens,
      response_format: params.response_format,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`${config.provider} API error: ${response.status} - ${errText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content ?? '{}';
}

/** Anthropic Messages API を呼び出す */
async function callAnthropic(
  config: LlmProviderConfig,
  params: {
    messages: Array<{ role: string; content: string }>;
    temperature: number;
    max_tokens: number;
  },
): Promise<string> {
  const client = new Anthropic({ apiKey: config.apiKey });

  // system メッセージを分離し、残りを user/assistant メッセージに変換
  const systemMessage = params.messages.find((m) => m.role === 'system');
  const nonSystemMessages = params.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  // Anthropic は JSON mode がないため、system プロンプトに JSON 指示を追加
  const systemText = [
    systemMessage?.content ?? '',
    'IMPORTANT: You MUST respond with valid JSON only. No markdown, no explanation, just raw JSON.',
  ]
    .filter(Boolean)
    .join('\n\n');

  const response = await client.messages.create({
    model: config.model,
    max_tokens: params.max_tokens,
    temperature: params.temperature,
    system: systemText,
    messages: nonSystemMessages,
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  const rawText = textBlock && 'text' in textBlock ? textBlock.text : '{}';

  // Anthropic がマークダウンコードブロックで囲む場合があるため除去
  const cleaned = rawText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  return cleaned;
}

/** 最後に成功したプロバイダー名（ログ・デバッグ用） */
let lastSuccessfulProvider = '';

/**
 * LLM API を呼び出す（フォールバックチェーン付き）
 * z.ai -> OpenAI -> Anthropic の順にリトライする
 */
export async function callLlm(
  params: {
    messages: Array<{ role: string; content: string }>;
    temperature: number;
    max_tokens: number;
    response_format: { type: string };
  },
): Promise<string> {
  const configs = getAllLlmConfigs();
  if (configs.length === 0) {
    throw new Error(
      'No LLM API key configured. Set at least one of: ZAI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY',
    );
  }

  const errors: Array<{ provider: string; error: string }> = [];

  for (const config of configs) {
    try {
      logger.info({ provider: config.provider, model: config.model }, 'Calling LLM provider');

      let result: string;
      if (config.provider === 'anthropic') {
        result = await callAnthropic(config, params);
      } else {
        result = await callOpenAICompatible(config, params);
      }

      // 成功した場合、プロバイダーがフォールバックだったらログに記録
      if (errors.length > 0) {
        logger.warn(
          {
            provider: config.provider,
            failedProviders: errors.map((e) => e.provider),
          },
          'LLM failover: succeeded with fallback provider',
        );
      }

      lastSuccessfulProvider = `${config.provider}/${config.model}`;
      return result;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      errors.push({ provider: config.provider, error: errMsg });
      logger.warn(
        { provider: config.provider, error: errMsg },
        'LLM provider failed, trying next',
      );

      if (!isRetryableError(err)) {
        break;
      }
    }
  }

  // すべてのプロバイダーが失敗
  const errorSummary = errors.map((e) => `${e.provider}: ${e.error}`).join('; ');
  throw new Error(`All LLM providers failed. ${errorSummary}`);
}

/**
 * 現在使用中のLLMプロバイダー名を取得する
 * 最後に成功したプロバイダーがある場合はそれを返す
 */
export function getLlmProviderName(): string {
  if (lastSuccessfulProvider) return lastSuccessfulProvider;
  const config = getLlmConfig();
  if (!config) return 'none';
  return `${config.provider}/${config.model}`;
}

