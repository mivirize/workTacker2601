import { z } from 'zod'

export const hearingWizardSchema = z.object({
  // Step 1: Client Info
  clientName: z.string().min(1, 'クライアント名は必須です'),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email('有効なメールアドレスを入力してください').optional().or(z.literal('')),

  // Step 2: Product Info
  productName: z.string().min(1, '商品/サービス名は必須です'),
  productDescription: z.string().optional(),
  uniqueSellingPoints: z.array(z.object({ value: z.string() })).min(1, '強みは1つ以上必要です'),
  priceInfo: z.object({
    price: z.string().optional(),
    priceNote: z.string().optional(),
  }).optional(),

  // Step 3: Target Info
  targetAudience: z.string().optional(),
  painPoints: z.array(z.object({ value: z.string() })).optional(),
  desiredOutcome: z.string().optional(),

  // Step 4: Design
  templateTier: z.enum(['simple', 'rich', 'premier']),
  colorPreset: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),

  // Step 5: Confirm
  notes: z.string().optional(),
})

export type HearingWizardData = z.infer<typeof hearingWizardSchema>

// Step-specific validation schemas for partial validation
export const stepSchemas = {
  1: z.object({
    clientName: z.string().min(1, 'クライアント名は必須です'),
    contactPerson: z.string().optional(),
    contactEmail: z.string().email('有効なメールアドレスを入力してください').optional().or(z.literal('')),
  }),
  2: z.object({
    productName: z.string().min(1, '商品/サービス名は必須です'),
    productDescription: z.string().optional(),
    uniqueSellingPoints: z.array(z.object({ value: z.string() })).min(1, '強みは1つ以上必要です'),
    priceInfo: z.object({
      price: z.string().optional(),
      priceNote: z.string().optional(),
    }).optional(),
  }),
  3: z.object({
    targetAudience: z.string().optional(),
    painPoints: z.array(z.object({ value: z.string() })).optional(),
    desiredOutcome: z.string().optional(),
  }),
  4: z.object({
    templateTier: z.enum(['simple', 'rich', 'premier']),
    colorPreset: z.string().optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    accentColor: z.string().optional(),
  }),
  5: z.object({
    notes: z.string().optional(),
  }),
}

export const WIZARD_STEPS = [
  { id: 1, title: 'クライアント', description: '基本情報' },
  { id: 2, title: '商品/サービス', description: '詳細情報' },
  { id: 3, title: 'ターゲット', description: '対象顧客' },
  { id: 4, title: 'デザイン', description: 'テンプレート・カラー' },
  { id: 5, title: '確認', description: '最終確認' },
]
