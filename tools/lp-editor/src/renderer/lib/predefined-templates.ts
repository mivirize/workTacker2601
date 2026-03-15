/**
 * Predefined Form Templates
 *
 * Collection of commonly used form field templates.
 */

import type { FormTemplate } from '../types/form-templates'

/**
 * Generate a unique key for a field
 */
const generateKey = (name: string): string => `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

/**
 * Contact form template
 */
export const CONTACT_FORM_TEMPLATE: FormTemplate = {
  id: 'contact',
  name: 'お問い合わせフォーム',
  description: '名前、メールアドレス、件名、メッセージを含む標準的なお問い合わせフォーム',
  type: 'predefined',
  category: 'basic',
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'お名前',
      required: true,
      selector: 'input[name="name"]',
    },
    {
      name: 'email',
      type: 'email',
      label: 'メールアドレス',
      required: true,
      selector: 'input[name="email"]',
    },
    {
      name: 'subject',
      type: 'text',
      label: '件名',
      required: true,
      selector: 'input[name="subject"]',
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'メッセージ',
      required: true,
      selector: 'textarea[name="message"]',
    },
  ],
}

/**
 * Registration form template
 */
export const REGISTRATION_FORM_TEMPLATE: FormTemplate = {
  id: 'registration',
  name: '会員登録フォーム',
  description: '名前、メールアドレス、パスワードを含む会員登録フォーム',
  type: 'predefined',
  category: 'basic',
  fields: [
    {
      name: 'username',
      type: 'text',
      label: 'ユーザー名',
      required: true,
      selector: 'input[name="username"]',
    },
    {
      name: 'email',
      type: 'email',
      label: 'メールアドレス',
      required: true,
      selector: 'input[name="email"]',
    },
    {
      name: 'password',
      type: 'password',
      label: 'パスワード',
      required: true,
      selector: 'input[name="password"]',
    },
    {
      name: 'password_confirm',
      type: 'password',
      label: 'パスワード（確認）',
      required: true,
      selector: 'input[name="password_confirm"]',
    },
  ],
}

/**
 * Inquiry form template
 */
export const INQUIRY_FORM_TEMPLATE: FormTemplate = {
  id: 'inquiry',
  name: '資料請求フォーム',
  description: '会社名、部署名、役職、電話番号、メールアドレスを含む資料請求フォーム',
  type: 'predefined',
  category: 'business',
  fields: [
    {
      name: 'company_name',
      type: 'text',
      label: '会社名',
      required: true,
      selector: 'input[name="company_name"]',
    },
    {
      name: 'department',
      type: 'text',
      label: '部署名',
      required: false,
      selector: 'input[name="department"]',
    },
    {
      name: 'position',
      type: 'text',
      label: '役職',
      required: false,
      selector: 'input[name="position"]',
    },
    {
      name: 'phone',
      type: 'tel',
      label: '電話番号',
      required: true,
      selector: 'input[name="phone"]',
    },
    {
      name: 'email',
      type: 'email',
      label: 'メールアドレス',
      required: true,
      selector: 'input[name="email"]',
    },
  ],
}

/**
 * Event registration form template
 */
export const EVENT_REGISTRATION_TEMPLATE: FormTemplate = {
  id: 'event_registration',
  name: 'イベント参加申し込みフォーム',
  description: '名前、メールアドレス、電話番号、参加人数、備考を含むイベント参加申し込みフォーム',
  type: 'predefined',
  category: 'event',
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'お名前',
      required: true,
      selector: 'input[name="name"]',
    },
    {
      name: 'email',
      type: 'email',
      label: 'メールアドレス',
      required: true,
      selector: 'input[name="email"]',
    },
    {
      name: 'phone',
      type: 'tel',
      label: '電話番号',
      required: false,
      selector: 'input[name="phone"]',
    },
    {
      name: 'participants',
      type: 'number',
      label: '参加人数',
      required: true,
      selector: 'input[name="participants"]',
    },
    {
      name: 'notes',
      type: 'textarea',
      label: '備考',
      required: false,
      selector: 'textarea[name="notes"]',
    },
  ],
}

/**
 * Survey form template
 */
export const SURVEY_FORM_TEMPLATE: FormTemplate = {
  id: 'survey',
  name: 'アンケートフォーム',
  description: '満足度、意見、改善点を尋ねるアンケートフォーム',
  type: 'predefined',
  category: 'survey',
  fields: [
    {
      name: 'satisfaction',
      type: 'select',
      label: '満足度',
      required: true,
      selector: 'select[name="satisfaction"]',
    },
    {
      name: 'reason',
      type: 'textarea',
      label: 'その理由',
      required: false,
      selector: 'textarea[name="reason"]',
    },
    {
      name: 'improvements',
      type: 'textarea',
      label: '改善点・ご意見',
      required: false,
      selector: 'textarea[name="improvements"]',
    },
  ],
}

/**
 * Newsletter signup form template
 */
export const NEWSLETTER_TEMPLATE: FormTemplate = {
  id: 'newsletter',
  name: 'ニュースレター登録フォーム',
  description: 'メールアドレスのみのシンプルなニュースレター登録フォーム',
  type: 'predefined',
  category: 'basic',
  fields: [
    {
      name: 'email',
      type: 'email',
      label: 'メールアドレス',
      required: true,
      selector: 'input[name="email"]',
    },
  ],
}

/**
 * Quote request form template
 */
export const QUOTE_REQUEST_TEMPLATE: FormTemplate = {
  id: 'quote_request',
  name: '見積もり依頼フォーム',
  description: '会社情報、連絡先、見積もり詳細を含む見積もり依頼フォーム',
  type: 'predefined',
  category: 'business',
  fields: [
    {
      name: 'company_name',
      type: 'text',
      label: '会社名',
      required: true,
      selector: 'input[name="company_name"]',
    },
    {
      name: 'contact_person',
      type: 'text',
      label: '担当者名',
      required: true,
      selector: 'input[name="contact_person"]',
    },
    {
      name: 'email',
      type: 'email',
      label: 'メールアドレス',
      required: true,
      selector: 'input[name="email"]',
    },
    {
      name: 'phone',
      type: 'tel',
      label: '電話番号',
      required: false,
      selector: 'input[name="phone"]',
    },
    {
      name: 'service_type',
      type: 'select',
      label: 'サービス種別',
      required: true,
      selector: 'select[name="service_type"]',
    },
    {
      name: 'budget',
      type: 'text',
      label: '予算',
      required: false,
      selector: 'input[name="budget"]',
    },
    {
      name: 'details',
      type: 'textarea',
      label: '詳細',
      required: true,
      selector: 'textarea[name="details"]',
    },
  ],
}

/**
 * All predefined templates
 */
export const PREDEFINED_TEMPLATES: readonly FormTemplate[] = [
  CONTACT_FORM_TEMPLATE,
  REGISTRATION_FORM_TEMPLATE,
  INQUIRY_FORM_TEMPLATE,
  EVENT_REGISTRATION_TEMPLATE,
  SURVEY_FORM_TEMPLATE,
  NEWSLETTER_TEMPLATE,
  QUOTE_REQUEST_TEMPLATE,
]

/**
 * Get template by ID
 */
export const getTemplateById = (id: string): FormTemplate | undefined => {
  return PREDEFINED_TEMPLATES.find((t) => t.id === id)
}

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category: string): readonly FormTemplate[] => {
  return PREDEFINED_TEMPLATES.filter((t) => t.category === category)
}

/**
 * Get all categories
 */
export const getAllCategories = (): readonly string[] => {
  const categories = new Set(PREDEFINED_TEMPLATES.map((t) => t.category).filter((c): c is string => Boolean(c)))
  return Array.from(categories)
}
