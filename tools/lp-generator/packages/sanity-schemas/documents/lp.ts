import { defineType, defineField } from 'sanity'

export const lp = defineType({
  name: 'lp',
  title: 'Landing Page',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Basic' },
    { name: 'content', title: 'Content' },
    { name: 'seo', title: 'SEO' },
    { name: 'publish', title: 'Publish' },
  ],
  fields: [
    // === Basic ===
    defineField({
      name: 'title',
      title: 'LP Title',
      type: 'string',
      group: 'basic',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      group: 'basic',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'clientSlug',
      title: 'Client Slug',
      type: 'string',
      group: 'basic',
      description: 'URL path: /[clientSlug]/[slug]',
    }),
    defineField({
      name: 'hearing',
      title: 'Source Hearing',
      type: 'reference',
      group: 'basic',
      to: [{ type: 'hearing' }],
    }),
    defineField({
      name: 'template',
      title: 'Template',
      type: 'reference',
      group: 'basic',
      to: [{ type: 'template' }],
    }),
    defineField({
      name: 'templateTier',
      title: 'Template Tier',
      type: 'string',
      group: 'basic',
      options: {
        list: [
          { title: 'Simple', value: 'simple' },
          { title: 'Rich', value: 'rich' },
          { title: 'Premier', value: 'premier' },
        ],
      },
      initialValue: 'simple',
    }),

    // === Content (Page Builder) ===
    defineField({
      name: 'pageBuilder',
      title: 'Page Content',
      type: 'array',
      group: 'content',
      of: [
        // Simple tier (available to all)
        { type: 'heroBlock' },
        { type: 'featureBlock' },
        { type: 'ctaBlock' },
        // Rich tier
        { type: 'benefitBlock' },
        { type: 'testimonialBlock' },
        { type: 'faqBlock' },
        // Premier tier
        { type: 'pricingBlock' },
        { type: 'formBlock' },
        { type: 'imageGalleryBlock' },
        { type: 'videoBlock' },
        { type: 'textBlock' },
      ],
    }),

    // === Colors ===
    defineField({
      name: 'primaryColor',
      title: 'Primary Color',
      type: 'string',
      group: 'basic',
    }),
    defineField({
      name: 'secondaryColor',
      title: 'Secondary Color',
      type: 'string',
      group: 'basic',
    }),
    defineField({
      name: 'accentColor',
      title: 'Accent Color',
      type: 'string',
      group: 'basic',
    }),

    // === SEO ===
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      group: 'seo',
      validation: (rule) => rule.max(60),
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      group: 'seo',
      rows: 3,
      validation: (rule) => rule.max(160),
    }),
    defineField({
      name: 'ogImage',
      title: 'OGP Image',
      type: 'image',
      group: 'seo',
    }),

    // === Publish ===
    defineField({
      name: 'publishStatus',
      title: 'Publish Status',
      type: 'string',
      group: 'publish',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Preview', value: 'preview' },
          { title: 'Published', value: 'published' },
          { title: 'Unpublished', value: 'unpublished' },
        ],
      },
      initialValue: 'draft',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      group: 'publish',
    }),
    defineField({
      name: 'expiresAt',
      title: 'Expires At',
      type: 'datetime',
      group: 'publish',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      slug: 'slug.current',
      status: 'publishStatus',
    },
    prepare({ title, slug, status }) {
      const statusIcons: Record<string, string> = {
        draft: '📝',
        preview: '👁️',
        published: '✅',
        unpublished: '🚫',
      }
      return {
        title: `${statusIcons[status] ?? ''} ${title}`,
        subtitle: `/${slug}`,
      }
    },
  },
})
