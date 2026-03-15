import { defineType, defineField } from 'sanity'

export const hearing = defineType({
  name: 'hearing',
  title: 'Hearing Sheet',
  type: 'document',
  groups: [
    { name: 'client', title: 'Client Info' },
    { name: 'product', title: 'Product/Service' },
    { name: 'target', title: 'Target' },
    { name: 'design', title: 'Design' },
    { name: 'status', title: 'Status' },
  ],
  fields: [
    // === Client Info ===
    defineField({
      name: 'clientName',
      title: 'Client Name',
      type: 'string',
      group: 'client',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'clientSlug',
      title: 'Client ID (URL)',
      type: 'slug',
      group: 'client',
      options: { source: 'clientName', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'contactPerson',
      title: 'Contact Person',
      type: 'string',
      group: 'client',
    }),
    defineField({
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'string',
      group: 'client',
      validation: (rule) => rule.email(),
    }),

    // === Product/Service ===
    defineField({
      name: 'productName',
      title: 'Product/Service Name',
      type: 'string',
      group: 'product',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'productDescription',
      title: 'Product/Service Description',
      type: 'text',
      group: 'product',
      rows: 4,
    }),
    defineField({
      name: 'uniqueSellingPoints',
      title: 'USP (Unique Selling Points)',
      type: 'array',
      group: 'product',
      of: [{ type: 'string' }],
      validation: (rule) => rule.min(1).max(5),
    }),
    defineField({
      name: 'priceInfo',
      title: 'Price Info',
      type: 'object',
      group: 'product',
      fields: [
        { name: 'price', title: 'Price', type: 'string' },
        { name: 'priceNote', title: 'Price Note', type: 'string' },
      ],
    }),

    // === Target ===
    defineField({
      name: 'targetAudience',
      title: 'Target Audience',
      type: 'text',
      group: 'target',
      rows: 3,
    }),
    defineField({
      name: 'painPoints',
      title: 'Customer Pain Points',
      type: 'array',
      group: 'target',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'desiredOutcome',
      title: 'Desired Outcome',
      type: 'text',
      group: 'target',
      rows: 3,
    }),

    // === Design ===
    defineField({
      name: 'templateTier',
      title: 'Template Tier',
      type: 'string',
      group: 'design',
      options: {
        list: [
          { title: 'Simple', value: 'simple' },
          { title: 'Rich', value: 'rich' },
          { title: 'Premier', value: 'premier' },
        ],
        layout: 'radio',
      },
      initialValue: 'simple',
    }),
    defineField({
      name: 'primaryColor',
      title: 'Primary Color',
      type: 'string',
      group: 'design',
    }),
    defineField({
      name: 'secondaryColor',
      title: 'Secondary Color',
      type: 'string',
      group: 'design',
    }),
    defineField({
      name: 'accentColor',
      title: 'Accent Color',
      type: 'string',
      group: 'design',
    }),
    defineField({
      name: 'referenceUrls',
      title: 'Reference URLs',
      type: 'array',
      group: 'design',
      of: [{ type: 'url' }],
    }),
    defineField({
      name: 'logoImage',
      title: 'Logo',
      type: 'image',
      group: 'design',
      options: { hotspot: true },
    }),
    defineField({
      name: 'brandAssets',
      title: 'Brand Assets',
      type: 'array',
      group: 'design',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),

    // === Status ===
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'status',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Completed', value: 'completed' },
          { title: 'In Progress', value: 'in_progress' },
          { title: 'Review', value: 'review' },
          { title: 'Published', value: 'published' },
        ],
      },
      initialValue: 'draft',
    }),
    defineField({
      name: 'linkedLp',
      title: 'Linked LP',
      type: 'reference',
      group: 'status',
      to: [{ type: 'lp' }],
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      group: 'status',
      rows: 3,
    }),
  ],
  preview: {
    select: {
      title: 'clientName',
      subtitle: 'productName',
      status: 'status',
      media: 'logoImage',
    },
    prepare({ title, subtitle, status, media }) {
      const statusLabels: Record<string, string> = {
        draft: 'Draft',
        completed: 'Completed',
        in_progress: 'In Progress',
        review: 'Review',
        published: 'Published',
      }
      return {
        title,
        subtitle: `${subtitle} - ${statusLabels[status] ?? status}`,
        media,
      }
    },
  },
})
