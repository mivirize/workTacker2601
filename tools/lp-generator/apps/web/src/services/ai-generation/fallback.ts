import { generateBlocksFromHearing } from '@/lib/mock-data'
import type { Hearing } from '@lp-generator/sanity-schemas/types'
import type { GenerationResult, HearingInput } from './types'

export function convertToHearing(input: HearingInput): Hearing {
  return {
    _id: 'temp',
    _type: 'hearing',
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
    clientName: input.clientName,
    clientSlug: { _type: 'slug', current: input.clientName.toLowerCase().replace(/\s+/g, '-') },
    productName: input.productName,
    productDescription: input.productDescription ?? undefined,
    uniqueSellingPoints: input.uniqueSellingPoints,
    priceInfo: input.priceInfo?.price
      ? {
          price: input.priceInfo.price,
          priceNote: input.priceInfo.priceNote ?? undefined,
        }
      : undefined,
    targetAudience: input.targetAudience ?? undefined,
    painPoints: input.painPoints ?? [],
    desiredOutcome: input.desiredOutcome ?? undefined,
    templateTier: input.templateTier,
    primaryColor: input.primaryColor ?? undefined,
    secondaryColor: input.secondaryColor ?? undefined,
    accentColor: input.accentColor ?? undefined,
    status: 'draft',
  }
}

export function generateFallbackResult(input: HearingInput, error?: string): GenerationResult {
  const hearing = convertToHearing(input)
  const blocks = generateBlocksFromHearing(hearing)

  return {
    blocks,
    source: 'fallback',
    error,
  }
}

export async function withFallback(
  input: HearingInput,
  aiGenerator: () => Promise<GenerationResult>
): Promise<GenerationResult> {
  try {
    const result = await aiGenerator()

    // If AI generation produced empty or invalid blocks, use fallback
    if (!result.blocks || result.blocks.length === 0) {
      console.warn('AI生成結果が空のため、フォールバックを使用')
      return generateFallbackResult(input, 'AI生成結果が空でした')
    }

    return result
  } catch (error) {
    console.error('AI生成エラー:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return generateFallbackResult(input, errorMessage)
  }
}
