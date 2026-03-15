import { generateWithClaude, isAIEnabled } from './claude-client'
import { LP_GENERATION_SYSTEM_PROMPT } from './prompts/system-prompt'
import { buildLpGenerationPrompt } from './prompts/lp-generation'
import { parseAIResponse } from './parsers/response-parser'
import { validateAndSanitizeBlocks } from './validators/block-validator'
import { withFallback, generateFallbackResult } from './fallback'
import type { GenerationResult, HearingInput } from './types'

export type { GenerationResult, HearingInput }

export async function generateLpWithAI(input: HearingInput): Promise<GenerationResult> {
  // If AI is not enabled, use fallback immediately
  if (!isAIEnabled()) {
    console.log('ANTHROPIC_API_KEY not configured, using fallback')
    return generateFallbackResult(input, 'AI機能が有効化されていません')
  }

  return withFallback(input, async () => {
    // Build the prompt
    const userPrompt = buildLpGenerationPrompt(input)

    // Call Claude API
    const responseText = await generateWithClaude({
      systemPrompt: LP_GENERATION_SYSTEM_PROMPT,
      userPrompt,
    })

    // Parse the response
    const parsed = parseAIResponse(responseText)

    // Validate and sanitize blocks
    const validatedBlocks = validateAndSanitizeBlocks(parsed.blocks, input.templateTier)

    return {
      blocks: validatedBlocks,
      source: 'ai' as const,
      analysis: parsed.analysis,
      designRecommendations: parsed.designRecommendations,
    }
  })
}

// Re-export utilities
export { isAIEnabled }
