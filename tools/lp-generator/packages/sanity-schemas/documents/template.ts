import { defineType, defineField } from 'sanity'

export const template = defineType({
  name: 'template',
  title: 'Template',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Template Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tier',
      title: 'Tier',
      type: 'string',
      options: {
        list: [
          { title: 'Simple', value: 'simple' },
          { title: 'Rich', value: 'rich' },
          { title: 'Premier', value: 'premier' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'image',
    }),
    defineField({
      name: 'availableBlocks',
      title: 'Available Blocks',
      type: 'array',
      of: [
        {
          type: 'string',
          options: {
            list: [
              { title: 'Hero', value: 'heroBlock' },
              { title: 'Feature', value: 'featureBlock' },
              { title: 'CTA', value: 'ctaBlock' },
              { title: 'Benefit', value: 'benefitBlock' },
              { title: 'Testimonial', value: 'testimonialBlock' },
              { title: 'Pricing', value: 'pricingBlock' },
              { title: 'FAQ', value: 'faqBlock' },
              { title: 'Form', value: 'formBlock' },
              { title: 'Gallery', value: 'imageGalleryBlock' },
              { title: 'Video', value: 'videoBlock' },
              { title: 'Text', value: 'textBlock' },
            ],
          },
        },
      ],
    }),
    defineField({
      name: 'defaultBlockTypes',
      title: 'Default Block Types',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Block types to auto-insert when creating LP',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      tier: 'tier',
      media: 'thumbnail',
    },
    prepare({ title, tier, media }) {
      const tierLabels: Record<string, string> = {
        simple: 'Simple',
        rich: 'Rich',
        premier: 'Premier',
      }
      return {
        title,
        subtitle: tierLabels[tier] ?? tier,
        media,
      }
    },
  },
})
