import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModelV1 } from 'ai';

export type LlmProvider = 'openai' | 'anthropic' | 'google';

export interface ModelConfig {
  provider: LlmProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * プロバイダーとモデルからLanguageModelを取得
 */
export function getModel(config: ModelConfig): LanguageModelV1 {
  switch (config.provider) {
    case 'openai': {
      const apiKey = process.env['OPENAI_API_KEY'];
      const openai = createOpenAI(apiKey ? { apiKey } : {});
      return openai(config.model);
    }
    case 'anthropic': {
      const apiKey = process.env['ANTHROPIC_API_KEY'];
      const anthropic = createAnthropic(apiKey ? { apiKey } : {});
      return anthropic(config.model as Parameters<ReturnType<typeof createAnthropic>>[0]);
    }
    case 'google': {
      const apiKey = process.env['GOOGLE_AI_API_KEY'];
      const google = createGoogleGenerativeAI(apiKey ? { apiKey } : {});
      return google(config.model);
    }
    default: {
      const _exhaustive: never = config.provider;
      throw new Error(`Unknown provider: ${String(_exhaustive)}`);
    }
  }
}

/** デフォルトモデル定義 */
export const DEFAULT_MODELS = {
  faqGeneration: { provider: 'openai', model: 'gpt-4o-mini' } satisfies ModelConfig,
  chatCompletion: { provider: 'openai', model: 'gpt-4o-mini' } satisfies ModelConfig,
  responseGeneration: { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' } satisfies ModelConfig,
  embedding: 'text-embedding-3-small',
} as const;
