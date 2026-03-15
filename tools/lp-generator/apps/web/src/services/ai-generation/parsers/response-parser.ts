import { z } from 'zod'
import type { LpBlock } from '@lp-generator/sanity-schemas/types'
import type { AIGenerationResponse, Analysis, DesignRecommendations } from '../types'

const TargetPersonaSchema = z.object({
  ageRange: z.string(),
  occupation: z.string(),
  primaryConcern: z.string(),
})

const AnalysisSchema = z.object({
  industry: z.string(),
  targetPersona: TargetPersonaSchema,
  recommendedTone: z.string(),
  toneRationale: z.string(),
})

const DesignRecommendationsSchema = z.object({
  layout: z.enum(['center', 'left', 'right']).catch('center'),
  colorUsage: z.string(),
  iconStyle: z.string(),
})

const AIResponseSchema = z.object({
  analysis: AnalysisSchema,
  designRecommendations: DesignRecommendationsSchema,
  blocks: z.array(z.record(z.unknown())),
})

function extractJsonFromResponse(responseText: string): string {
  // Try to extract JSON from markdown code block
  const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    return jsonMatch[1].trim()
  }

  // Try to find raw JSON object
  const jsonObjectMatch = responseText.match(/\{[\s\S]*\}/)
  if (jsonObjectMatch) {
    return jsonObjectMatch[0]
  }

  throw new Error('AI応答にJSONが見つかりません')
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function ensureKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const result = { ...obj }

  // Ensure _key exists
  if (!result._key || typeof result._key !== 'string') {
    result._key = generateUUID()
  }

  // Process nested arrays
  for (const [key, value] of Object.entries(result)) {
    if (Array.isArray(value)) {
      result[key] = value.map((item) => {
        if (typeof item === 'object' && item !== null) {
          return ensureKeys(item as Record<string, unknown>)
        }
        return item
      })
    }
  }

  return result
}

export function parseAIResponse(responseText: string): AIGenerationResponse {
  const jsonString = extractJsonFromResponse(responseText)

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch {
    throw new Error(`JSONパースエラー: ${jsonString.slice(0, 100)}...`)
  }

  const validated = AIResponseSchema.parse(parsed)

  // Ensure all blocks have proper _key values
  const blocks = validated.blocks.map((block) => {
    const processedBlock = ensureKeys(block)
    return processedBlock as unknown as LpBlock
  })

  return {
    analysis: validated.analysis as Analysis,
    designRecommendations: validated.designRecommendations as DesignRecommendations,
    blocks,
  }
}
