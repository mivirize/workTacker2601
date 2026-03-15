import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'fdu4jzw2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

const lpId = 'lp-mkxea56w-py8fzmm'

const pageBuilder = [
  {
    _type: 'heroBlock',
    _key: 'hero-ai-001',
    headline: '知性を纏う、特別な一本',
    subheadline: '成人の日に。そしてこれからの人生に寄り添う、ファーストジュエリー',
    ctaText: 'コレクションを見る',
    ctaUrl: '#collection',
    ctaStyle: 'primary',
    layout: 'center',
  },
  {
    _type: 'featureBlock',
    _key: 'feature-ai-001',
    sectionTitle: 'Puzzle Chain COLLECTION',
    sectionSubtitle: '論理と遊び心が美しく交差する、知恵の輪の発想から生まれたチェーン',
    features: [
      {
        _key: 'f1',
        icon: '✨',
        title: '精密な手仕事',
        description:
          'ひとコマずつが心地よく噛み合い、静かなクリックとともに連なる構造。職人の技術が生み出す端正な佇まい。',
      },
      {
        _key: 'f2',
        icon: '💎',
        title: '彫刻的な存在感',
        description:
          '日常に寄り添う可動性を備えながら、アートピースとしての美しさを持つデザイン。',
      },
      {
        _key: 'f3',
        icon: '🔗',
        title: '自在な組み合わせ',
        description:
          '気分や装いに合わせて分解・再構築できる、あなただけのスタイルを叶える一本。',
      },
    ],
    layout: 'grid-3',
  },
  {
    _type: 'ctaBlock',
    _key: 'cta-ai-001',
    headline: '一生に寄り添う、特別な輝きを',
    description:
      '成人式という一日に留まらず、これから先の未来にそっと寄り添い続ける一本となりますように。',
    primaryButtonText: 'お問い合わせ',
    primaryButtonUrl: '#contact',
    secondaryButtonText: '詳細を見る',
    secondaryButtonUrl: '#details',
    layout: 'center',
  },
]

async function updateLp() {
  try {
    const result = await client.patch(lpId).set({ pageBuilder }).commit()
    console.log('LP updated successfully:', result._id)
  } catch (error) {
    console.error('Failed to update LP:', error.message)
  }
}

updateLp()
