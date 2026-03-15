import Anthropic from '@anthropic-ai/sdk'

const getClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }
  return new Anthropic({ apiKey })
}

export interface GenerateOptions {
  systemPrompt: string
  userPrompt: string
  maxTokens?: number
  temperature?: number
}

export async function generateWithClaude(options: GenerateOptions): Promise<string> {
  const {
    systemPrompt,
    userPrompt,
    maxTokens = Number(process.env.AI_MAX_TOKENS) || 4000,
    temperature = Number(process.env.AI_TEMPERATURE) || 0.7,
  } = options

  const client = getClient()
  const model = process.env.AI_MODEL ?? 'claude-sonnet-4-20250514'

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const textContent = response.content.find((block) => block.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Claude response')
  }

  return textContent.text
}

export function isAIEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}
