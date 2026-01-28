/**
 * LP Config Validator
 *
 * Validates lp-config.json using Zod schemas.
 */

import { z } from 'zod'

// Marker type schema
const markerTypeSchema = z.enum([
  'text',
  'richtext',
  'image',
  'link',
  'background-image',
])

// Editable config schema
const editableConfigSchema = z.object({
  type: markerTypeSchema,
  label: z.string().optional(),
  group: z.string().optional(),
  recommendedSize: z.string().optional(),
})

// Repeat block config schema
const repeatBlockConfigSchema = z.object({
  label: z.string(),
  min: z.number().int().min(0).optional(),
  max: z.number().int().min(1).optional(),
  fields: z.record(editableConfigSchema),
})

// Color config schema
const colorConfigSchema = z.object({
  value: z.string().regex(/^#[0-9A-Fa-f]{6}$|^#[0-9A-Fa-f]{3}$|^rgb/i, {
    message: 'Invalid color format. Use hex (#ffffff) or rgb()',
  }),
  label: z.string().optional(),
  description: z.string().optional(),
})

// Group config schema
const groupConfigSchema = z.object({
  label: z.string(),
  order: z.number().int().min(0).optional(),
})

// Output config schema
const outputConfigSchema = z.object({
  appName: z.string().min(1, 'appName is required'),
  fileName: z.string().min(1, 'fileName is required').regex(/^[a-z0-9-]+$/, {
    message: 'fileName must be lowercase alphanumeric with hyphens only',
  }),
})

// Main LP Config schema
export const lpConfigSchema = z.object({
  name: z.string().min(1, 'name is required'),
  client: z.string().min(1, 'client is required'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, {
    message: 'version must be in semver format (e.g., 1.0.0)',
  }),
  entry: z.string().min(1, 'entry is required'),
  output: outputConfigSchema,
  editables: z.record(editableConfigSchema).optional(),
  repeatBlocks: z.record(repeatBlockConfigSchema).optional(),
  colors: z.record(colorConfigSchema).optional(),
  groups: z.record(groupConfigSchema).optional(),
})

export type LpConfigValidated = z.infer<typeof lpConfigSchema>

export interface ValidationResult {
  success: boolean
  data?: LpConfigValidated
  errors?: Array<{
    path: string
    message: string
  }>
}

/**
 * Validate LP config object
 */
export function validateLpConfig(config: unknown): ValidationResult {
  const result = lpConfigSchema.safeParse(config)

  if (result.success) {
    return {
      success: true,
      data: result.data,
    }
  }

  return {
    success: false,
    errors: result.error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    })),
  }
}

/**
 * Validate LP config from JSON string
 */
export function validateLpConfigJson(jsonString: string): ValidationResult {
  try {
    const parsed = JSON.parse(jsonString)
    return validateLpConfig(parsed)
  } catch {
    return {
      success: false,
      errors: [{ path: '', message: 'Invalid JSON format' }],
    }
  }
}
