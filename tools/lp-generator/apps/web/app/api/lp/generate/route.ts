import { NextResponse } from 'next/server'
import { db, generateSlug, generateBlocksFromHearing } from '@/lib/db'
import { generateLpWithAI, isAIEnabled } from '@/services/ai-generation'
import type { HearingInput } from '@/services/ai-generation'
import { z } from 'zod'

// Request validation schema
const generateRequestSchema = z.object({
  hearingId: z.string().min(1, 'hearingId is required'),
  regenerate: z.boolean().optional().default(false),
  existingLpId: z.string().optional(),
  useAI: z.boolean().optional().default(true),
})

// Error response helper
function errorResponse(
  message: string,
  status: number,
  details?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      error: message,
      status,
      timestamp: new Date().toISOString(),
      ...details,
    },
    { status }
  )
}

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return errorResponse('Invalid JSON in request body', 400)
    }

    const validation = generateRequestSchema.safeParse(body)
    if (!validation.success) {
      return errorResponse('Validation failed', 400, {
        validationErrors: validation.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }

    const { hearingId, regenerate, existingLpId, useAI } = validation.data

    // Get hearing data
    const hearing = await db.getHearingById(hearingId)

    if (!hearing) {
      return errorResponse('Hearing not found', 404, { hearingId })
    }

    // Generate LP blocks
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { linkedLp: _linkedLp, ...baseHearing } = hearing

    let pageBuilder
    let generationSource: 'ai' | 'fallback' = 'fallback'
    let analysis = undefined

    if (useAI && isAIEnabled()) {
      // Use AI generation
      const hearingInput: HearingInput = {
        clientName: hearing.clientName,
        productName: hearing.productName,
        productDescription: hearing.productDescription,
        uniqueSellingPoints: hearing.uniqueSellingPoints ?? [],
        priceInfo: hearing.priceInfo,
        targetAudience: hearing.targetAudience,
        painPoints: hearing.painPoints ?? [],
        desiredOutcome: hearing.desiredOutcome,
        templateTier: hearing.templateTier ?? 'simple',
        primaryColor: hearing.primaryColor,
        secondaryColor: hearing.secondaryColor,
        accentColor: hearing.accentColor,
        referenceUrls: hearing.referenceUrls ?? [],
      }

      const result = await generateLpWithAI(hearingInput)
      pageBuilder = result.blocks
      generationSource = result.source
      analysis = result.analysis

      console.log(`LP generated using ${result.source}${result.error ? ` (error: ${result.error})` : ''}`)
    } else {
      // Use direct mapping (fallback)
      pageBuilder = generateBlocksFromHearing(baseHearing)
    }

    let lpId: string

    if (regenerate && existingLpId) {
      // Regenerate: Update existing LP with new blocks
      const existingLp = await db.getLpById(existingLpId)
      if (!existingLp) {
        return errorResponse('Existing LP not found', 404, { existingLpId })
      }

      // Update LP with regenerated content
      await db.updateLp(existingLpId, {
        title: `${hearing.clientName} - ${hearing.productName}`,
        templateTier: hearing.templateTier ?? 'simple',
        pageBuilder,
        primaryColor: hearing.primaryColor ?? '#3B82F6',
        secondaryColor: hearing.secondaryColor ?? '#1E40AF',
        accentColor: hearing.accentColor ?? '#F59E0B',
        seoTitle: `${hearing.productName} | ${hearing.clientName}`,
        seoDescription: hearing.productDescription?.slice(0, 160) ?? '',
      })

      lpId = existingLpId
    } else {
      // New generation: Create new LP
      const slug = `${generateSlug(hearing.productName)}-${Date.now().toString(36)}`

      const lp = await db.createLp({
        title: `${hearing.clientName} - ${hearing.productName}`,
        slug: {
          _type: 'slug',
          current: slug,
        },
        clientSlug: hearing.clientSlug?.current ?? generateSlug(hearing.clientName),
        hearing: {
          _type: 'reference',
          _ref: hearingId,
        },
        templateTier: hearing.templateTier ?? 'simple',
        pageBuilder,
        primaryColor: hearing.primaryColor ?? '#3B82F6',
        secondaryColor: hearing.secondaryColor ?? '#1E40AF',
        accentColor: hearing.accentColor ?? '#F59E0B',
        seoTitle: `${hearing.productName} | ${hearing.clientName}`,
        seoDescription: hearing.productDescription?.slice(0, 160) ?? '',
        publishStatus: 'preview',
      })

      lpId = lp._id

      // Update hearing with LP reference
      await db.updateHearing(hearingId, {
        linkedLp: { _type: 'reference', _ref: lp._id },
        status: 'in_progress',
      })
    }

    return NextResponse.json({
      lpId,
      source: generationSource,
      analysis,
    })
  } catch (error) {
    console.error('Failed to generate LP:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isDev = process.env.NODE_ENV === 'development'

    return errorResponse('Failed to generate LP', 500, {
      message: isDev ? errorMessage : 'サーバーエラーが発生しました',
      ...(isDev && { stack: error instanceof Error ? error.stack : undefined }),
    })
  }
}
